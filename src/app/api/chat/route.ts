import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getInterviewer } from '@/lib/interviewers';
import { ChatMessage, InterviewerId, FixedUserData } from '@/types';

// インタビューの状態を管理するためのインターフェース
interface InterviewState {
  collectedData: Partial<FixedUserData>;
  currentStep: number;
  totalSteps: number;
}

// 基本情報収集のステップ
const INTERVIEW_STEPS = [
  'name',
  'nickname',
  'gender',
  'age',
  'location',
  'occupation',
  'occupationDetail',
];

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
    const state = analyzeInterviewState(messages);

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

    // インタビュー完了判定
    const isCompleted = state.currentStep >= state.totalSteps;

    // 収集したデータを返す
    return NextResponse.json({
      message: responseText,
      isCompleted,
      interviewData: isCompleted ? state.collectedData : null,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeInterviewState(messages: ChatMessage[]): InterviewState {
  const collectedData: Partial<FixedUserData> = {};
  let currentStep = 0;

  // メッセージ履歴から収集済みの情報を抽出
  // 簡易的な実装（Phase 2で改善）
  const userMessages = messages.filter((msg) => msg.role === 'user');

  if (userMessages.length > 0) {
    // 名前を推定（最初のユーザーメッセージ）
    if (userMessages.length >= 1 && currentStep === 0) {
      collectedData.name = userMessages[0].content;
      currentStep = 1;
    }

    // ニックネームを推定（2番目のユーザーメッセージ）
    if (userMessages.length >= 2 && currentStep === 1) {
      collectedData.nickname = userMessages[1].content;
      currentStep = 2;
    }

    // 性別を推定（3番目のユーザーメッセージ）
    if (userMessages.length >= 3 && currentStep === 2) {
      const genderResponse = userMessages[2].content;
      if (genderResponse.includes('男性') || genderResponse.includes('男')) {
        collectedData.gender = '男性';
      } else if (
        genderResponse.includes('女性') ||
        genderResponse.includes('女')
      ) {
        collectedData.gender = '女性';
      } else {
        collectedData.gender = 'その他';
      }
      currentStep = 3;
    }

    // 年齢を推定（4番目のユーザーメッセージ）
    if (userMessages.length >= 4 && currentStep === 3) {
      const ageMatch = userMessages[3].content.match(/\d+/);
      if (ageMatch) {
        collectedData.age = parseInt(ageMatch[0]);
      }
      currentStep = 4;
    }

    // 居住地を推定（5番目のユーザーメッセージ）
    if (userMessages.length >= 5 && currentStep === 4) {
      collectedData.location = userMessages[4].content;
      currentStep = 5;
    }

    // 職業カテゴリを推定（6番目のユーザーメッセージ）
    if (userMessages.length >= 6 && currentStep === 5) {
      const occupationResponse = userMessages[5].content;
      // 職業カテゴリを推定
      if (occupationResponse.includes('会社員')) {
        collectedData.occupation = '会社員';
      } else if (occupationResponse.includes('経営者')) {
        collectedData.occupation = '経営者';
      } else if (occupationResponse.includes('自営業')) {
        collectedData.occupation = '自営業';
      } else if (occupationResponse.includes('公務員')) {
        collectedData.occupation = '公務員';
      } else if (occupationResponse.includes('フリーランス')) {
        collectedData.occupation = 'フリーランス';
      } else if (
        occupationResponse.includes('主婦') ||
        occupationResponse.includes('主夫')
      ) {
        collectedData.occupation = '主婦/主夫';
      } else if (occupationResponse.includes('学生')) {
        collectedData.occupation = '学生（大学生）';
      } else if (occupationResponse.includes('無職')) {
        collectedData.occupation = '無職';
      } else {
        collectedData.occupation = 'その他';
      }
      currentStep = 6;
    }

    // 職業詳細を推定（7番目のユーザーメッセージ）
    if (userMessages.length >= 7 && currentStep === 6) {
      collectedData.occupationDetail = userMessages[6].content;
      currentStep = 7;
    }
  }

  return {
    collectedData,
    currentStep,
    totalSteps: INTERVIEW_STEPS.length,
  };
}

function generateSystemPrompt(
  interviewer: { name: string; tone: string; character: string },
  state: InterviewState
): string {
  const nextStep = INTERVIEW_STEPS[state.currentStep];

  let stepInstruction = '';

  switch (nextStep) {
    case 'name':
      stepInstruction = 'ユーザーの本名を聞いてください。';
      break;
    case 'nickname':
      stepInstruction =
        'ユーザーのニックネームや呼ばれたい名前を聞いてください。';
      break;
    case 'gender':
      stepInstruction = 'ユーザーの性別を聞いてください（男性・女性・その他）。';
      break;
    case 'age':
      stepInstruction = 'ユーザーの年齢を聞いてください。';
      break;
    case 'location':
      stepInstruction = 'ユーザーの居住地（都道府県）を聞いてください。';
      break;
    case 'occupation':
      stepInstruction =
        'ユーザーの職業カテゴリを聞いてください（会社員、経営者、自営業、公務員、フリーランス、主婦/主夫、学生、無職、その他）。';
      break;
    case 'occupationDetail':
      stepInstruction =
        'ユーザーの職業の詳細や具体的な仕事内容を聞いてください。これが最後の質問です。回答を受け取ったら、インタビューを終了する旨を伝え、感謝の言葉を述べてください。';
      break;
    default:
      stepInstruction = 'インタビューは完了しました。感謝の言葉を述べてください。';
  }

  return `あなたは${interviewer.name}というインタビュワーです。
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
