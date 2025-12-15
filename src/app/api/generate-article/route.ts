import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { FixedUserData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { interviewData } = await request.json();

    if (!interviewData) {
      return NextResponse.json(
        { error: 'Interview data is required' },
        { status: 400 }
      );
    }

    const data = interviewData as Partial<FixedUserData>;

    // プロンプトを生成
    const prompt = generateArticlePrompt(data);

    // Gemini APIを使用して記事を生成
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const article = result.response.text();

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}

function generateArticlePrompt(data: Partial<FixedUserData>): string {
  return `あなたはプロのインタビュー記事ライターです。
以下の情報を元に、魅力的なインタビュー記事を作成してください。

【インタビュー対象者の情報】
- 名前: ${data.name || '不明'}
- ニックネーム: ${data.nickname || '不明'}
- 性別: ${data.gender || '不明'}
- 年齢: ${data.age ? `${data.age}歳` : '不明'}
- 居住地: ${data.location || '不明'}
- 職業: ${data.occupation || '不明'}
- 職業詳細: ${data.occupationDetail || '不明'}

【記事の要件】
1. 文字数: 800〜1500字程度
2. 形式: 雑誌風のインタビュー記事（三人称の紹介文形式）
3. トーン: 親しみやすく、ポジティブで、対象者の魅力が伝わる文章
4. 構成:
   - 導入部: 対象者の印象や雰囲気を描写（100〜200字）
   - 本文: 対象者の背景、現在の活動、価値観などを紹介（500〜1000字）
   - 結び: 対象者の今後の展望や魅力のまとめ（200〜300字）

【スタイル】
- 読者が対象者に興味を持つような、引き込まれる文章にしてください
- 対象者の人柄や魅力が伝わるエピソードを含めてください
- 具体的で臨場感のある描写を心がけてください
- プロフェッショナルかつ温かみのある文体で書いてください

それでは、インタビュー記事を作成してください。`;
}
