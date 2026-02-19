# じぶんクラフト

AIとの会話や診断で自分の特徴を集め、自己PR・プロフィール等のアウトプットを生成するサービス

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| サービス名 | じぶんクラフト（mecraft） |
| ドメイン | mecraft.life |
| コンセプト | AIとの会話や診断で自分の特徴を集め、自己PR・プロフィール等のアウトプットを生成 |

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS 4 |
| データベース | Firebase Firestore |
| ストレージ | Firebase Storage |
| 認証 | Firebase Auth (Google, Email/Password, Anonymous) |
| ホスティング | Vercel |
| AI | Gemini API (gemini-2.5-flash / gemini-2.5-pro) |

## 環境構築

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定：

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (サーバーサイドのみ)
FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 4. ビルド

```bash
npm run build
```

## ルート構成

4タブ構成のメインUI。`(main)` ルートグループで認証ガード・BottomNav・背景グラデーションを共有。

```
/                          → LP（エメラルドテーマ）
/login                     → ログイン / 新規登録

(main) ルートグループ（認証必須・BottomNav付き）
├── /dig                   → ほるトップ（メニュー）
│   ├── /dig/swipe         → スワイプ診断
│   └── /dig/interview/
│       ├── select-mode    → モード選択
│       ├── select-interviewer → インタビュワー選択
│       ├── [mode]         → AIチャットインタビュー
│       └── history        → インタビュー履歴
├── /mypage                → じぶん（特徴一覧）
│   ├── /mypage/[traitId]  → 特徴詳細
│   ├── /mypage/settings   → プロフィール・インタビュワー設定
│   └── /mypage/interview/[id] → インタビュー詳細
├── /craft                 → つくるトップ（メニュー）
│   ├── /craft/create      → テキスト生成
│   ├── /craft/[id]        → アウトプット詳細
│   ├── /craft/self-image  → 自分像生成
│   ├── /craft/talk-with-self → 自分との対話
│   └── /craft/history     → アウトプット履歴
└── /everyone              → みんな（Coming Soon）
```

### リダイレクト（旧URL互換）

旧パスへのアクセスは新パスにリダイレクト：
`/home`, `/onboarding`, `/result`, `/select-interviewer`,
`/interview/*`, `/output/*`, `/mypage/traits`

## ディレクトリ構造

```
mecraft/
├── public/image/                # インタビュワー画像
├── src/
│   ├── app/
│   │   ├── (main)/              # 認証必須ルートグループ
│   │   │   ├── layout.tsx       # AuthGuard + BottomNav + bg-gradient-main
│   │   │   ├── dig/             # ほるタブ
│   │   │   ├── mypage/          # じぶんタブ
│   │   │   ├── craft/           # つくるタブ
│   │   │   └── everyone/        # みんなタブ
│   │   ├── api/                 # APIルート
│   │   ├── login/               # ログインページ
│   │   ├── page.tsx             # LPページ
│   │   ├── layout.tsx           # ルートレイアウト
│   │   └── providers.tsx        # プロバイダー設定
│   ├── components/
│   │   ├── ui/                  # 共通UIコンポーネント
│   │   │   ├── AppHeader.tsx    # アプリヘッダー
│   │   │   ├── BottomNav.tsx    # 下部タブナビゲーション
│   │   │   └── MenuCard.tsx     # メニューカード
│   │   └── interview/           # インタビュー関連コンポーネント
│   ├── contexts/
│   │   ├── AuthContext.tsx      # 認証コンテキスト
│   │   └── TraitsContext.tsx    # 特徴データコンテキスト
│   ├── hooks/                   # カスタムフック
│   ├── lib/
│   │   ├── firebase/            # Firebase設定（Client / Admin）
│   │   ├── api/
│   │   │   └── authenticatedFetch.ts
│   │   ├── auth/
│   │   │   └── verifyAuth.ts
│   │   ├── gemini.ts            # Gemini API設定（リトライ付き）
│   │   ├── interviewers.ts
│   │   ├── interviewModes.ts
│   │   └── outputTypes.ts
│   └── types/
│       └── index.ts
├── .env.local
└── package.json
```

## デザインシステム

- **カラースキーム**: エメラルド / ティール基調
- **UIスタイル**: グラスモーフィズム（`glass`, `glass-card`, `glass-input` クラス）
- **グラデーション**: `bg-gradient-main`（メイン背景）、`btn-gradient-primary` / `btn-gradient-secondary`
- **装飾**: グラデーションオーブ（`gradient-orb-emerald`, `gradient-orb-amber`）

## 認証フロー

```
LP（/）
├─ ゲストで始める → Firebase匿名認証 → /dig/swipe（スワイプ診断）
├─ 新規登録 → /login?mode=signup → メール or Google登録 → /dig/swipe
└─ ログイン → /login → メール or Googleログイン → /mypage

ゲスト → 本登録（アカウントリンク）
├─ 新規登録タブ → linkWithCredential / linkWithPopup でUID維持 → データ引き継ぎ
└─ ログインタブ → 既存アカウントにサインイン → ゲスト時のデータは失われる
```

## 主要パターン

| パターン | 説明 |
|----------|------|
| `useTraits()` | TraitsContextから特徴データを取得 |
| `useAuth()` | AuthContextから認証状態・操作を取得 |
| `authenticatedFetch()` | 認証トークン付きAPI呼び出し |
| `verifyAuth()` | サーバーサイドAPIルートでの認証検証 |
| `getGeminiModel()` | Gemini AI呼び出し（リトライロジック付き） |

## データ構造

### 特徴データ（Traits）

```typescript
interface UserTrait {
  id: string;
  label: string;                 // 例: 「チームワーク重視」
  category: TraitCategory;       // personality | skill | value | interest | experience | goal
  description: string;
  keywords: string[];
  confidence: number;            // 0-1
  intensityLabel: IntensityLabel; // とても | かなり | やや
  icon: string;                  // 絵文字
  extractedAt: Date;
}
```

### Firestoreデータ構造

```
/users/{userId}
  - uid, email, displayName, nickname, occupation
  - interviewerName, selectedInterviewer
  - createdAt, lastLoginAt, updatedAt

/interviews/{interviewId}
  - userId, interviewerId, mode
  - messages: ChatMessage[]
  - data: { fixed, dynamic, createdAt, updatedAt }
  - traits: UserTrait[]
  - traitsSummary: { totalCount, categoryBreakdown, topTraits }
  - status: 'in_progress' | 'completed'
```

## API一覧

| メソッド | エンドポイント | 概要 |
|----------|---------------|------|
| POST | `/api/chat` | AIチャットインタビュー |
| POST | `/api/chat-with-self` | 自分との対話 |
| POST | `/api/extract-traits` | 会話から特徴抽出 |
| POST | `/api/save-traits` | 特徴保存 |
| POST | `/api/delete-trait` | 特徴削除 |
| POST | `/api/swipe-diagnose` | スワイプ診断 |
| POST | `/api/generate-output` | テキストアウトプット生成 |
| POST | `/api/generate-self-image` | 自分像生成 |
| POST | `/api/generate-article` | インタビュー記事生成 |
| DELETE | `/api/delete-self-image` | 自分像削除 |
| GET/POST | `/api/outputs` | アウトプット取得 |
| POST | `/api/save-interview` | インタビュー保存 |
| POST | `/api/save-profile` | プロフィール保存 |
| POST | `/api/save-interviewer-name` | インタビュワー名保存 |
| GET | `/api/get-interviews` | インタビュー一覧取得 |
| GET | `/api/get-user-interviews` | ユーザーのインタビュー一覧 |
| GET | `/api/get-interview` | インタビュー詳細取得 |
| GET | `/api/get-user-data` | ユーザーデータ取得 |
| GET | `/api/get-user-traits` | ユーザー特徴取得 |

## インタビュワー設定

| ID | 性別 | キャラクター | 口調 |
|----|------|-------------|------|
| female_01 | 女性 | かわいい・親しみやすい | 丁寧だけどフレンドリー |
| male_01 | 男性 | かっこいい・知的 | 落ち着いた敬語 |

## インタビューモード

| ID | モード名 | 質問数 | 説明 |
|----|----------|--------|------|
| basic | 基本インタビュー | エンドレス | 多角的に深掘りし、様々な魅力を発見 |
| self-pr | 自己PR発見 | 10問 | 仕事での強みや成果にフォーカス |
| manual | わたしの取説 | 10問 | コミュニケーションスタイルや好き嫌いを明確化 |

## トラブルシューティング

### ビルドエラー

ルートディレクトリのリネーム後はキャッシュを削除：
```bash
rm -rf .next
npm run build
```

### Windows環境での注意

`mv` がパーミッションエラーになる場合は `cp -r && rm -rf` を使用。

### Firebase接続エラー

1. `.env.local`の環境変数を確認
2. Firebase Consoleで認証方法が有効化されているか確認
3. Firestoreのセキュリティルールを確認

## ライセンス

非公開プロジェクト
