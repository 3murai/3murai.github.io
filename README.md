# カラセーヌ サイト（GitHub Pages 用）

このフォルダをそのまま GitHub にアップすると、

- サイトが `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます（YouTube のサムネイルも表示されます）
- 毎朝6時（日本時間）に、YouTube の新しい動画を自動で作品一覧に追加します
  - 自分のチャンネル（にじさんじ大好き侍）：新しい動画はすべて追加
  - 依頼主のチャンネル：説明欄に「邸汰ラク」「さ村井」「カラセーヌ」「Charascène」のどれかが書かれた動画だけ追加
  - 一覧にある動画の再生回数も、取れる範囲（各チャンネルの最新15本）で更新

## はじめての設定（10分くらい）

1. https://github.com でアカウントを作る（もう持っていれば不要）
2. 右上の「＋」→「New repository」
   - Repository name：`charascene`（好きな名前でOK）
   - **Public** を選ぶ（無料で Pages を使うため）
   - 「Create repository」
3. 作ったリポジトリの画面で「uploading an existing file」をクリック
   - このフォルダの中身を**全部**ドラッグ＆ドロップ（`.github` フォルダも忘れずに）
   - ※ `.github` が見えないときは、エクスプローラーの「表示」→「隠しファイル」にチェック
   - 「Commit changes」
4. 「Settings」→ 左の「Pages」
   - Source：`Deploy from a branch`
   - Branch：`main` ／ `/(root)` →「Save」
   - 1〜2分で上に公開URLが出ます
5. 「Settings」→「Actions」→「General」
   - 一番下「Workflow permissions」で **Read and write permissions** を選んで「Save」
6. YouTube の API キーを作って登録する（無料・推奨）
   - YouTube の公開フィード（RSS）は止まっていることがあるため、公式の API を使います
   - https://console.cloud.google.com/ にログイン → プロジェクトを作成
   - 「API とサービス」→「ライブラリ」→「YouTube Data API v3」→「有効にする」
   - 「認証情報」→「認証情報を作成」→「API キー」→ 出てきたキーをコピー
   - GitHub のリポジトリ →「Settings」→「Secrets and variables」→「Actions」→「New repository secret」
     - Name：`YT_API_KEY` ／ Secret：コピーしたキー →「Add secret」
   - 1日の使用量は無料枠（1日1万）の1%未満です
7. 「Actions」タブ →「Update works」→「Run workflow」で一度手動で動かして、緑のチェックになればOK

## 依頼主を増やすとき

`scripts/update-works.mjs` の `CLIENT_CHANNELS` に、チャンネルIDと名前を1行追加します。

```js
'UCxxxxxxxxxxxxxxxxxxxxxx': '依頼主の名前',
```

## 手で作品を足したいとき

`works-data.js` の `WORKS_CLIENT`（依頼）か `WORKS_OWN`（自主制作）の一番上に1行足します。

```js
["動画ID", 再生回数, "2026-10-14", "3:25", "v", "タイトル", "依頼主"],
```

（`"v"` は通常動画、`"s"` はショート）

## メールアドレスなどを変えるとき

`estimate.js` の一番上の `CONTACT` を書き換えます。
