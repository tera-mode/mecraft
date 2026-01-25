// カテゴリ
export type TraitCategory =
  | 'personality'
  | 'hobby'
  | 'skill'
  | 'work'
  | 'value'
  | 'lifestyle'
  | 'experience'
  | 'other';

// カテゴリの日本語ラベル
export const TRAIT_CATEGORY_LABELS: Record<TraitCategory, string> = {
  personality: '性格',
  hobby: '趣味',
  skill: 'スキル',
  work: '仕事',
  value: '価値観',
  lifestyle: 'ライフスタイル',
  experience: '経験',
  other: 'その他',
};

// カテゴリの色（Tailwind CSS用）
export const TRAIT_CATEGORY_COLORS: Record<TraitCategory, string> = {
  personality: 'bg-pink-100 text-pink-800 border-pink-200',
  hobby: 'bg-green-100 text-green-800 border-green-200',
  skill: 'bg-blue-100 text-blue-800 border-blue-200',
  work: 'bg-orange-100 text-orange-800 border-orange-200',
  value: 'bg-purple-100 text-purple-800 border-purple-200',
  lifestyle: 'bg-teal-100 text-teal-800 border-teal-200',
  experience: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

// 強弱キーワードの例
export const INTENSITY_KEYWORDS = {
  // スキル系
  skill: ['駆け出し', '経験あり', '得意', '熟練', 'プロ級'],
  // 趣味・興味系
  hobby: ['ちょっと興味', '好き', '大好き', 'ハマり中', '生きがい'],
  // 性格系
  personality: ['ややそう', 'わりとそう', 'かなりそう', 'とてもそう', '超そう'],
  // 一般系
  general: ['少し', 'まあまあ', 'けっこう', 'かなり', '非常に'],
} as const;

// 専門性レベル（互換性のため残す）
export type ExpertiseLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'professional';

// 専門性レベルの日本語ラベル
export const EXPERTISE_LEVEL_LABELS: Record<ExpertiseLevel, string> = {
  beginner: '初心者',
  intermediate: '中級者',
  advanced: '上級者',
  expert: '熟練者',
  professional: 'プロフェッショナル',
};

// ユーザー特徴
export interface UserTrait {
  id: string;
  label: string; // 10文字以内のラベル
  category: TraitCategory;
  icon?: string; // 絵文字
  description?: string; // 詳細説明
  keywords: string[]; // 関連キーワード
  intensityLabel?: string | null; // 強弱を示すキーワード（例：「プロ級」「駆け出し」）、なければnull
  confidence: number; // 0-1の確信度
  expertise?: ExpertiseLevel;
  sourceMessageIndex: number;
  extractedAt: Date;
  updatedAt?: Date; // タグが更新された場合の日時
}

// 特徴サマリー
export interface TraitsSummary {
  totalCount: number;
  categoryBreakdown: Partial<Record<TraitCategory, number>>;
  topTraits: string[];
}

// API リクエスト/レスポンス型
export interface ExtractTraitsRequest {
  userMessage: string;
  assistantMessage: string;
  messageIndex: number;
  existingTraits: UserTrait[];
}

export interface ExtractTraitsResponse {
  newTraits: UserTrait[]; // 新規追加されたタグ
  updatedTraits: UserTrait[]; // 更新されたタグ（idは既存のもの）
  error?: string;
}

export interface SaveTraitsRequest {
  interviewId: string;
  traits: UserTrait[];
}

export interface SaveTraitsResponse {
  success: boolean;
  error?: string;
}
