# BareJS

最小限のランタイムで、AIが最適化されたコードを生成するためのフレームワーク。

## コンセプト

- **ランタイムほぼゼロ**: `signal` のみの最小API
- **effectなし**: リアクティブな自動更新は使わず、操作関数が直接DOMを更新
- **AIがコード生成**: 人間はやりたいことを伝え、AIが最適化済みコードを生成
- **人間が読める**: 冗長でも意図が明確なコード。局所的に読めて修正可能
- **コンパイラは検証のみ**: 最適化の責務はAIに移譲し、コンパイラは型チェック等に専念
- **reflow/repaint最小**: AIが操作ごとに最適化されたDOM操作コードを生成

## ワークフロー

```
人間: やりたいことをAIにprompt
  ↓
AI: 最適化されたコードを生成
  - 直接DOM操作（VDOMなし）
  - 1関数1責務で分割
  - 読み書き分離でreflow最小
  ↓
人間: 必要に応じて手直し
  ↓
コンパイラ: 型チェック、構文検証のみ
```

## 最小API

### signal

リアクティブな値を作成する。

```typescript
import { signal } from './core/signal'

const count = signal(0)

count()              // 値を取得: 0
count.set(5)         // 値を直接設定
count.update(n => n + 1)  // 関数で更新
```

## 設計思想

### なぜeffectを使わないか

- 更新箇所をAIが事前に特定して明示的に更新関数を呼ぶ
- 依存関係が明示的で、人間が読みやすい
- デバッグしやすい（どの関数がDOMを更新するか明確）

### AIが生成すべきコードの特徴

```typescript
// NG: 何をしているか分からない
const a=document.getElementById('c'),b=0;a.onclick=()=>a.textContent=++b

// OK: 冗長でも意図が明確
// --- 状態 ---
const count = signal(0)

// --- DOM参照 ---
const counterEl = document.getElementById('counter')!

// --- 更新関数 ---
function updateCounter(): void {
  counterEl.textContent = String(count())
}

// --- イベントハンドラ ---
function handleClick(): void {
  count.update(n => n + 1)
  updateCounter()
}
```

## 開発コマンド

```bash
# テスト実行
~/.bun/bin/bun test

# カウンター例のビルド
~/.bun/bin/bun build ./examples/counter/app.ts --outfile ./examples/counter/app.js

# カウンター例の実行（ビルド後）
cd examples/counter && python3 -m http.server 8000
# または
npx serve examples/counter
```

## ディレクトリ構成

```
barejs/
├── CLAUDE.md              # この設計指針
├── package.json
├── core/
│   ├── index.ts           # エクスポート
│   ├── signal.ts          # signal実装
│   └── __tests__/
│       └── signal.test.ts # ユニットテスト
└── examples/
    └── counter/
        ├── index.html
        └── app.ts
```

## 将来の目標

- Hono SSR対応
- hydrateではなく、最小限のインタラクション用JSのみをクライアントに送信
- JSX/TSXのHTML変換はコンパイラに委譲
- 出力先の抽象化（HTML、メール、ネイティブアプリ等）
