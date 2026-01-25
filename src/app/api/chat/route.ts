import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getInterviewer } from '@/lib/interviewers';
import { ChatMessage, InterviewerId, FixedUserData, DynamicData } from '@/types';

// インタビューの状態を管理するためのインターフェース
interface InterviewState {
  collectedData: Partial<FixedUserData>;
  dynamicData: DynamicData;
  currentStep: number;
  totalSteps: number;
  isFixedPhaseComplete: boolean;
}

// Phase 1: 基本情報収集のステップ（簡素化: 2ステップのみ）
const FIXED_INTERVIEW_STEPS = ['nickname', 'occupation'];

// Phase 2: 深掘り質問のステップ数
const DYNAMIC_INTERVIEW_STEPS_COUNT = 10; // 深掘り質問を増やす
const TOTAL_STEPS = FIXED_INTERVIEW_STEPS.length + DYNAMIC_INTERVIEW_STEPS_COUNT;

export async function POST(request: NextRequest) {
  try {
    const { messages, interviewerId } = await request.json();

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

    // インタビューの状態を分析
    const state = await analyzeInterviewState(messages);

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
    const isCompleted = state.currentStep >= state.totalSteps;

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

async function analyzeInterviewState(messages: ChatMessage[]): Promise<InterviewState> {
  const collectedData: Partial<FixedUserData> = {};
  const dynamicData: DynamicData = {};
  let currentStep = 0;

  // メッセージ履歴から収集済みの情報を抽出
  const userMessages = messages.filter((msg) => msg.role === 'user');

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
    totalSteps: TOTAL_STEPS,
    isFixedPhaseComplete,
  };
}

function generateSystemPrompt(
  interviewer: { tone: string; character: string },
  state: InterviewState
): string {
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

    return `あなたはインタビュワーです。
キャラクター: ${interviewer.character}
話し方: ${interviewer.tone}

【重要なルール】
1. ${interviewer.tone}で話してください
2. ${interviewer.character}なキャラクターを演じてください
3. 1回の返答は2〜3文程度に抑えてください
4. 相槌や共感を入れて、親しみやすい雰囲気を作ってください
5. 次のステップ: ${stepInstruction}
6. ユーザーの回答に対して簡単にリアクションした後、次の質問をしてください

【現在の進行状況】
${state.currentStep} / ${state.totalSteps} ステップ完了`;
  }

  // === Phase 2: 深掘りモード ===
  const dynamicStepNumber = state.currentStep - FIXED_INTERVIEW_STEPS.length;
  const remainingQuestions = DYNAMIC_INTERVIEW_STEPS_COUNT - dynamicStepNumber;

  return `あなたはインタビュワーです。
キャラクター: ${interviewer.character}
話し方: ${interviewer.tone}

【状況】
基本情報の収集が完了しました。ここからは、${state.collectedData.nickname}さんの魅力をさらに深掘りする質問をします。

【収集済みの基本情報】
- 呼び名: ${state.collectedData.nickname}
- 職業: ${state.collectedData.occupation}

【深掘り質問の指示】
1. **質問の目的**: ユーザーの人柄、価値観、趣味、エピソードなど、魅力を引き出す質問をしてください
2. **質問のカテゴリ例**:
   - 趣味・ライフスタイル（休日の過ごし方、好きなこと、ハマっていること）
   - 価値観・仕事（大切にしていること、仕事への姿勢、やりがい）
   - エピソード（印象的な出来事、転機、思い出）
   - 将来の目標・夢（これからやりたいこと、挑戦したいこと）
   - 人間関係（友人との関わり、大切な人、影響を受けた人）
   - 性格・特技（自分の長所、得意なこと、人から言われること）
3. **質問の流れ**: 前回の回答を踏まえて、自然な会話の流れで次の質問を生成してください
4. **質問数**: あと${remainingQuestions}個の質問を行います
5. **トーン**: ${interviewer.tone}で、温かく共感的に話してください

【ルール】
- 1回の返答は2〜3文程度
- ユーザーの回答に対して共感や相槌を入れた後、次の質問をしてください
- 質問は1つずつ、焦らず丁寧に聞いてください
- ${remainingQuestions === 1 ? 'これが最後の質問です。回答を受け取ったら、インタビュー終了の感謝を述べてください。' : ''}

【現在の進行状況】
深掘り質問: ${dynamicStepNumber} / ${DYNAMIC_INTERVIEW_STEPS_COUNT} 完了
全体: ${state.currentStep} / ${state.totalSteps} ステップ完了`;
}
