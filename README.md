# 家計簿 & 健康 Webアプリ

Windowsで作れて、iPhoneではSafariからホーム画面に追加して使える版です。

## できること

- ログインなし
- データはブラウザの端末内に保存
- 家計簿はカレンダー形式
- カレンダーの日付にはその日の支出合計のみ表示
- 上部に今月の収入 / 支出 / 固定費を表示
- 固定費は設定で登録
- 固定費は今月の支出には含めない
- 健康は一覧 + グラフ
- 体重 / 摂取カロリー / 体脂肪率 / 歩数 / 運動消費カロリーを入力
- 編集 / 削除
- バックアップ書き出し / 読み込み

## 先に知っておくこと

- このWeb版では、歩数と運動消費カロリーは手入力です。
- データは `localStorage` に保存されます。
- そのため、WindowsのブラウザとiPhoneのSafariは自動同期しません。
- iPhoneで使うなら、iPhone側で入力を続ける運用がおすすめです。
- たまにバックアップを書き出してください。

## 必要なもの

- Windows PC
- ブラウザ（Chrome / Edge 推奨）
- iPhone
- GitHubアカウント（無料。iPhoneで使うための公開に使う）

## 一番かんたんな確認方法

1. このフォルダを展開する
2. `index.html` をダブルクリックする
3. ブラウザでアプリが開く
4. まずはPC上で画面確認と入力確認をする

## iPhoneで使うための手順（GitHub Pages）

### 1. GitHubアカウントを作る
無料で大丈夫です。

### 2. 新しいリポジトリを作る
例:
- Repository name: `kakeibo-health-app`
- Public を選ぶ

### 3. このフォルダの中身をアップロードする
アップロードするのは次のファイルです。

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `assets` フォルダ

### 4. GitHub Pagesを有効にする
GitHubのリポジトリ画面で:

- `Settings`
- `Pages`
- `Build and deployment`
- `Source` を `Deploy from a branch`
- `Branch` を `main`
- フォルダは `/root`
- `Save`

少し待つと公開URLが出ます。

### 5. iPhoneでURLを開く
SafariでそのURLを開きます。

### 6. ホーム画面に追加する
Safariで:

- 共有ボタン
- `ホーム画面に追加`

これでアプリっぽく使えます。

## ファイル構成

- `index.html` : 画面
- `styles.css` : 見た目
- `app.js` : 機能
- `manifest.json` : ホーム画面追加用設定
- `service-worker.js` : 簡単なキャッシュ
- `assets/` : アイコン

## 次のおすすめ作業

1. まずPCで開いて動作確認
2. 次にGitHub Pagesで公開
3. iPhoneでホーム画面に追加
4. 実際に数日使って、入力項目や見た目を調整