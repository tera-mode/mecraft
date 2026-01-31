import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getInterviewer } from '@/lib/interviewers';
import { getInterviewMode, isEndlessMode, getQuestionCount } from '@/lib/interviewModes';
import { ChatMessage, InterviewerId, InterviewMode, FixedUserData, DynamicData } from '@/types';
import { verifyAuth } from '@/lib/auth/verifyAuth';

// インタビューの状態を管理するためのインターフェース
interface InterviewState {
  collectedData: Partial<FixedUserData>;
  dynamicData: DynamicData;
  currentStep: number;
  totalSteps: number;
  isFixedPhaseComplete: boolean;
  mode: InterviewMode;
}

// Phase 1: 基本情報収集のステップ（簡素化: 2ステップのみ）
const FIXED_INTERVIEW_STEPS = ['nickname', 'occupation'];

// デフォルトの深掘り質問数（エンドレスモード以外）
const DEFAULT_DYNAMIC_STEPS = 10;

export async function POST(request: NextRequest) {
  try {
    // 認証検証（匿名ユーザーも含む）
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.uid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messages, interviewerId, mode = 'basic', forceComplete = false, userProfile } = await request.json();

    if (!messages || !Array.isArray(messages) || !interviewerId) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const interviewer = getInterviewer(interviewerId as InterviewerId);
    if (!interviewer) {
      return NextResponse.json(
        { error: 'Interviewer not found' },
        { status: 404 }
      );
    }

    // インタビューの状態を分析（userProfileがあれば固定質問をスキップ）
    const state = await analyzeInterviewState(messages, mode as InterviewMode, userProfile);

    // 強制終了フラグがある場合（エンドレスモードの終了ボタン）
    if (forceComplete && isEndlessMode(mode)) {
      return handleForceComplete(state, interviewer);
    }

    // システムプロンプトを生成
    const systemPrompt = generateSystemPrompt(interviewer, state);

    // Gemini APIを使用して返答を生成
    const model = getGeminiModel();

    // 履歴を構築（最初のassistantメッセージは除外してuserから始める）
    const historyMessages = messages.slice(0, -1);
    const validHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // 最初のuserメッセージのインデックスを見つける
    const firstUserIndex = historyMessages.findIndex(msg => msg.role === 'user');

    if (firstUserIndex !== -1) {
      // userメッセージから始まる履歴を作成
      for (let i = firstUserIndex; i < historyMessages.length; i++) {
        validHistory.push({
          role: historyMessages[i].role === 'assistant' ? 'model' : 'user',
          parts: [{ text: historyMessages[i].content }],
        });
      }
    }

    const chat = model.startChat({
      history: validHistory,
    });

    const result = await chat.sendMessage(
      `${systemPrompt}\n\nユーザーの返答: ${messages[messages.length - 1].content}`
    );

    const responseText = result.response.text();

    // === 完了判定 ===
    // エンドレスモードの場合はforceCompleteでのみ完了
    const isCompleted = isEndlessMode(mode) ? false : state.currentStep >= state.totalSteps;

    // === カテゴリ分類を追加 ===
    let finalDynamicData = state.dynamicData;
    if (isCompleted && Object.keys(state.dynamicData).length > 0) {
      finalDynamicData = await categorizeDynamicData(state.dynamicData);
    }

    // 収集したデータを返す
    return NextResponse.json({
      message: responseText,
      isCompleted,
      interviewData: isCompleted
        ? {
            ...state.collectedData,
            dynamic: finalDynamicData,
          }
        : null,
      // ニックネームが抽出されたらフロントに通知
      extractedNickname: state.collectedData.nickname || null,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * エンドレスモードの強制終了処理
 */
async function handleForceComplete(
  state: InterviewState,
  interviewer: { tone: string; character: string }
) {
  // 最終メッセージを生成
  const model = getGeminiModel();
  const prompt = `あなたはインタビュワーです。
キャラクター: ${interviewer.character}
話し方: ${interviewer.tone}

インタビューが終了しました。${state.collectedData.nickname}さんに感謝の言葉を述べて、インタビューを締めくくってください。
- 2〜3文で簡潔に
- 相手の魅力が引き出せたことを喜ぶ
- 温かい言葉で締めくくる`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // カテゴリ分類
  let finalDynamicData = state.dynamicData;
  if (Object.keys(state.dynamicData).length > 0) {
    finalDynamicData = await categorizeDynamicData(state.dynamicData);
  }

  return NextResponse.json({
    message: responseText,
    isCompleted: true,
    interviewData: {
      ...state.collectedData,
      dynamic: finalDynamicData,
    },
    extractedNickname: state.collectedData.nickname || null,
  });
}

/**
 * DynamicDataの各質問に対してカテゴリを自動分類
 */
async function categorizeDynamicData(
  dynamicData: DynamicData
): Promise<DynamicData> {
  const model = getGeminiModel();

  const items = Object.entries(dynamicData).map(([key, item]) => ({
    key,
    question: item.question,
    answer: item.answer,
  }));

  const prompt = `以下のインタビュー質問と回答のセットに対して、適切なカテゴリを付けてください。

【カテゴリの選択肢】
- 趣味・ライフスタイル
- 価値観・仕事
- エピソード・経験
- 将来の目標・夢
- 人間関係
- その他

【質問と回答】
${items
    .map(
      (item, index) =>
        `${index + 1}. 質問: ${item.question}\n   回答: ${item.answer}`
    )
    .join('\n\n')}

【出力形式】
以下のJSON形式で出力してください（他の文章は一切含めないでください）：
{
  "dynamic_1": "カテゴリ名",
  "dynamic_2": "カテゴリ名",
  ...
}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from category response');
      return dynamicData;
    }

    const categories = JSON.parse(jsonMatch[0]) as Record<string, string>;

    const categorizedData: DynamicData = {};
    Object.entries(dynamicData).forEach(([key, item]) => {
      categorizedData[key] = {
        ...item,
        category: categories[key] || 'その他',
      };
    });

    return categorizedData;
  } catch (error) {
    console.error('Error categorizing dynamic data:', error);
    return dynamicData;
  }
}

/**
 * ユーザーの回答から呼び名を抽出
 */
async function extractNickname(userResponse: string): Promise<string> {
  const model = getGeminiModel();

  const prompt = `ユーザーが「なんて呼べばいいか」に対して回答しました。
回答から適切な呼び名（名前）を抽出してください。

【ユーザーの回答】
${userResponse}

【ルール】
- 回答から呼び名として使える単語を抽出
- 「〜です」「〜と呼んでください」などの文末表現は除去
- ニックネーム、名前、あだ名などを適切に抽出
- 抽出した呼び名のみを出力（説明文は不要）

【出力例】
- 入力: "まさと呼んでください" → 出力: まさ
- 入力: "田中太郎です" → 出力: 太郎
- 入力: "みんなからはタロウって呼ばれてます" → 出力: タロウ
- 入力: "けんじ" → 出力: けんじ

【出力】`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    // 余計な改行や空白を除去
    return responseText.split('\n')[0].trim();
  } catch (error) {
    console.error('Error extracting nickname:', error);
    // フォールバック: 元の回答をそのまま使用（最初の10文字まで）
    return userResponse.replace(/です$|と呼んで.*$|って呼んで.*$/g, '').trim().slice(0, 10);
  }
}

// ヘルパー関数: assistantメッセージから質問文を抽出
function extractQuestionFromMessage(content: string): string {
  const sentences = content.split(/[。.]/);
  const questionSentence = sentences.find((s) =>
    s.includes('?') || s.includes('？')
  );
  return questionSentence ? questionSentence.trim() : content;
}

async function analyzeInterviewState(
  messages: ChatMessage[],
  mode: InterviewMode,
  userProfile?: { nickname: string; occupation: string }
): Promise<InterviewState> {
  const collectedData: Partial<FixedUserData> = {};
  const dynamicData: DynamicData = {};
  let currentStep = 0;

  // モードに基づく質問数を取得
  const questionCount = getQuestionCount(mode) || DEFAULT_DYNAMIC_STEPS;
  const totalSteps = isEndlessMode(mode) ? Infinity : FIXED_INTERVIEW_STEPS.length + questionCount;

  // メッセージ履歴から収集済みの情報を抽出
  const userMessages = messages.filter((msg) => msg.role === 'user');

  // === userProfileがある場合は固定質問フェーズをスキップ ===
  if (userProfile?.nickname && userProfile?.occupation) {
    collectedData.nickname = userProfile.nickname;
    collectedData.occupation = userProfile.occupation;
    currentStep = FIXED_INTERVIEW_STEPS.length; // 固定質問フェーズ完了済みとして扱う

    // 深掘り質問の抽出
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
    userMessages.forEach((userMsg, index) => {
      // 最初のassistantメッセージ（挨拶）の後のやり取りを深掘り質問として扱う
      const questionMsg = assistantMessages[index]; // 0番目が最初の深掘り質問
      if (questionMsg && index > 0) { // index 0はユーザーの最初の回答
        const key = `dynamic_${index}`;
        dynamicData[key] = {
          question: extractQuestionFromMessage(questionMsg.content),
          answer: userMsg.content,
          category: '',
        };
      } else if (index === 0) {
        // 最初の回答も深掘りデータとして保存
        const key = `dynamic_1`;
        dynamicData[key] = {
          question: extractQuestionFromMessage(assistantMessages[0]?.content || ''),
          answer: userMsg.content,
          category: '',
        };
      }
      currentStep = FIXED_INTERVIEW_STEPS.length + index + 1;
    });

    return {
      collectedData,
      dynamicData,
      currentStep,
      totalSteps,
      isFixedPhaseComplete: true,
      mode,
    };
  }

  // === Phase 1: 固定情報の抽出（簡素化: 2ステップ） ===

  // ステップ1: 呼び名を抽出
  if (userMessages.length >= 1 && currentStep === 0) {
    const nicknameResponse = userMessages[0].content;
    // AIで呼び名を抽出
    collectedData.nickname = await extractNickname(nicknameResponse);
    currentStep = 1;
  }

  // ステップ2: 職業を抽出
  if (userMessages.length >= 2 && currentStep === 1) {
    collectedData.occupation = userMessages[1].content;
    currentStep = 2; // Phase 1完了
  }

  // === Phase 2: 深掘り情報の抽出 ===
  const isFixedPhaseComplete = currentStep >= FIXED_INTERVIEW_STEPS.length;

  if (isFixedPhaseComplete && userMessages.length > FIXED_INTERVIEW_STEPS.length) {
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
    const phase2UserMessages = userMessages.slice(FIXED_INTERVIEW_STEPS.length);

    // Phase 2の質問はassistantメッセージのインデックス3以降
    // （挨拶1個 + Phase 1の質問2個 = インデックス3から）
    phase2UserMessages.forEach((userMsg, index) => {
      const questionIndex = FIXED_INTERVIEW_STEPS.length + 1 + index;
      const questionMsg = assistantMessages[questionIndex];

      if (questionMsg) {
        const key = `dynamic_${index + 1}`;
        dynamicData[key] = {
          question: extractQuestionFromMessage(questionMsg.content),
          answer: userMsg.content,
          category: '', // 後でAIに分類させる
        };
        currentStep = FIXED_INTERVIEW_STEPS.length + index + 1;
      }
    });
  }

  return {
    collectedData,
    dynamicData,
    currentStep,
    totalSteps,
    isFixedPhaseComplete,
    mode,
  };
}

function generateSystemPrompt(
  interviewer: { tone: string; character: string },
  state: InterviewState
): string {
  const modeConfig = getInterviewMode(state.mode);
  const modeFocus = modeConfig?.systemPromptFocus || '';

  // 質問バンクから参考質問を取得
  const questionBank = modeConfig?.questionBank;
  const deepDiveQuestions = modeConfig?.deepDiveQuestions || [];

  // === Phase 1: 固定情報収集モード（簡素化: 2ステップ） ===
  if (!state.isFixedPhaseComplete) {
    const nextStep = FIXED_INTERVIEW_STEPS[state.currentStep];

    let stepInstruction = '';

    switch (nextStep) {
      case 'nickname':
        stepInstruction = 'まず、あなたのことをなんて呼んだらいいか聞いてください。名前でもニックネームでも、呼ばれたい名前を教えてもらってください。';
        break;
      case 'occupation':
        stepInstruction = 'お仕事や普段何をしているか（学生、会社員、フリーランスなど）を聞いてください。';
        break;
      default:
        stepInstruction = '';
    }

    const progressText = isEndlessMode(state.mode)
      ? `${state.currentStep} ステップ完了（エンドレスモード）`
      : `${state.currentStep} / ${state.totalSteps} ステップ完了`;

    return `あなたは一流雑誌のインタビュワーです。目の前の人が「自分ってこんなに面白い人間だったんだ」と気づくような会話を創り出すことがあなたの使命です。

## キャラクター設定
- 性格: ${interviewer.character}
- 話し方: ${interviewer.tone}

## 絶対ルール
1. 質問は1回のレスポンスで必ず1つだけ
2. ユーザーの回答には必ず「感情的な反応」を入れてから次の質問へ
3. 「はい/いいえ」で終わる質問は避ける
4. 1回の返答は2〜3文程度に抑える

## 禁止事項
- 「なるほど」「そうなんですね」の連発（同じ相槌を2回連続使わない）
- 「〇〇についてお聞かせください」のような硬い言い回し
- 「それでは次の質問です」のような機械的な進行

## 次のステップ
${stepInstruction}

【現在の進行状況】
${progressText}`;
  }

  // === Phase 2: 深掘りモード ===
  const dynamicStepNumber = state.currentStep - FIXED_INTERVIEW_STEPS.length;
  const questionCount = getQuestionCount(state.mode) || DEFAULT_DYNAMIC_STEPS;
  const remainingQuestions = isEndlessMode(state.mode) ? null : questionCount - dynamicStepNumber;

  // エンドレスモード用の進行状況テキスト
  const progressText = isEndlessMode(state.mode)
    ? `深掘り質問: ${dynamicStepNumber}問完了（エンドレスモード - ユーザーが終了するまで継続）`
    : `深掘り質問: ${dynamicStepNumber} / ${questionCount} 完了`;

  // 残り質問数のテキスト
  const remainingText = isEndlessMode(state.mode)
    ? 'ユーザーが「インタビューを終了」ボタンを押すまで、様々な角度から質問を続けてください。'
    : `あと${remainingQuestions}個の質問を行います`;

  // 最後の質問かどうか
  const isLastQuestion = !isEndlessMode(state.mode) && remainingQuestions === 1;

  // フェーズを判定（質問数に基づく）
  let currentPhase = 'phase2';
  let phaseDescription = '価値観・人となりを探る質問';
  if (dynamicStepNumber >= 5) {
    currentPhase = 'phase3';
    phaseDescription = '具体的なエピソードを引き出す質問';
  }
  if (dynamicStepNumber >= 8 || isLastQuestion) {
    currentPhase = 'closing';
    phaseDescription = '未来・夢について締めくくりの質問';
  }

  // 質問の参考例を取得
  let questionExamples = '';
  if (questionBank) {
    if (currentPhase === 'phase2' && questionBank.phase2.length > 0) {
      const randomCategory = questionBank.phase2[Math.floor(Math.random() * questionBank.phase2.length)];
      const randomQuestions = randomCategory.questions.slice(0, 3);
      questionExamples = `
【参考: ${randomCategory.category}の質問例】
${randomQuestions.map(q => `- 「${q}」`).join('\n')}`;
    } else if (currentPhase === 'phase3' && questionBank.phase3.length > 0) {
      const randomCategory = questionBank.phase3[Math.floor(Math.random() * questionBank.phase3.length)];
      const randomQuestions = randomCategory.questions.slice(0, 3);
      questionExamples = `
【参考: ${randomCategory.category}の質問例】
${randomQuestions.map(q => `- 「${q}」`).join('\n')}`;
    } else if (currentPhase === 'closing' && questionBank.closing.length > 0) {
      const randomQuestions = questionBank.closing.slice(0, 3);
      questionExamples = `
【参考: 締めくくりの質問例】
${randomQuestions.map(q => `- 「${q}」`).join('\n')}`;
    }
  }

  // 深掘り質問の参考例
  const deepDiveExamples = deepDiveQuestions.length > 0
    ? `
【深掘りテクニック（ユーザーの回答をさらに掘り下げたい時）】
${deepDiveQuestions.slice(0, 5).map(q => `- 「${q}」`).join('\n')}`
    : '';

  return `あなたは一流雑誌のインタビュワーです。楽しい雑談のような会話で、相手の魅力を自然に引き出してください。

## キャラクター設定
- 性格: ${interviewer.character}
- 話し方: ${interviewer.tone}

## インタビュー対象者
- 呼び名: ${state.collectedData.nickname}さん
- 職業: ${state.collectedData.occupation}

## インタビューモード: ${modeConfig?.name || '基本インタビュー'}
${modeFocus}

## 質問数
${remainingText}
${questionExamples}

## ★最重要★ 会話のリズム

### 理想の流れ
1. ユーザーの回答
2. 軽い反応（1文だけ！）
3. 横展開の質問 or 具体例を聞く

### 悪い流れ（絶対NG）
1. ユーザーの回答
2. 長い解釈・意味づけ + さらに深掘り質問
→ これは尋問になる！

## ★絶対ルール★

### 縦掘りは最大2回まで
同じ話題で「なぜ？」「どう感じる？」を続けるのは2回まで。
2回掘ったら必ず横に展開する！

### 横展開のパターン（必ず使う）
- 「逆に〇〇な時ってあります？」（対比）
- 「最近そういうことあった？」（具体例を聞く）
- 「それって〇〇の時も同じ？」（別シーンに展開）
- 「ちなみに〇〇は？」「ところで〜」（話題転換）

### OKな反応（短く軽く1文）
- 「あ、そうなんだ！」
- 「へぇ〜、なるほど」
- 「あはは、わかる気がする」
- 「え、意外！」
- 「おお、いいですね」

## ★絶対NG★

### NGな深掘りチェーン
「〇〇ですね」→「それはなぜ？」→「その時どう感じる？」→「それは何を意味する？」
→ これは尋問。絶対やらない！

### NGな反応（決めつけ・過剰な意味づけ）
- 「〇〇って、すごく素敵なスキルですよね！」← 評価しすぎ
- 「〇〇とも言えそうですね」← 勝手に解釈しすぎ
- 「かけがえのない〇〇ですよね」← 大げさすぎ
- 「〜ですよね！」「〜でしょう」← 決めつけ
- 「それは愛情表現ですね」← 勝手な意味づけ

### NGな質問（重すぎる・答えにくい）
- 「どんなところが満たされる感覚がありますか？」
- 「それはどんな力や自信につながりますか？」
- 「その根底にある価値観は何でしょう？」

### OKな質問（軽くて答えやすい）
- 「それってどんな時に特に思います？」
- 「最近だとどんな場面で？」
- 「具体的にどんなこと？」
- 「例えば？」
${isLastQuestion ? `
## 最後の質問
これが最後の質問です。回答を受け取ったら、軽く温かい言葉で締めくくってください。
- 「今日は楽しかったです！ありがとうございました」
- 「〇〇の話、面白かったです！」` : ''}

【進行状況】${progressText}`;
}
