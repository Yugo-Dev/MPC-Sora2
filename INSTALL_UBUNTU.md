# Sora MCP Server - Ubuntu Installation Guide

OpenAI Sora 2をUbuntu環境のClaude Desktopで使用するためのインストールガイドです。

## 📋 目次

- [システム要件](#システム要件)
- [事前準備](#事前準備)
- [インストール方法](#インストール方法)
- [手動インストール](#手動インストール)
- [設定の確認](#設定の確認)
- [トラブルシューティング](#トラブルシューティング)

## システム要件

- **OS**: Ubuntu 20.04 LTS以上（Ubuntu 22.04 LTS推奨）
- **Node.js**: v18以上
- **Claude Desktop**: 最新版
- **OpenAI API Key**: Soraへのアクセス権限が必要

## 事前準備

### 1. Node.jsのインストール

Node.js v20をインストールすることを推奨します：

```bash
# Node.js公式リポジトリの追加
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.jsとnpmのインストール
sudo apt-get install -y nodejs

# バージョン確認
node -v  # v20.x.x以上であることを確認
npm -v
```

### 2. Claude Desktopのインストール

Ubuntu用のClaude Desktopをインストールします：

```bash
# 公式サイトからダウンロードしてインストール
# https://claude.ai/download
```

### 3. OpenAI APIキーの準備

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. API Keysセクションで新しいAPIキーを作成
3. Soraへのアクセス権限があることを確認
4. APIキーを安全な場所に保存

## インストール方法

### 方法1: 自動インストールスクリプト（推奨）

このパッケージには自動インストールスクリプトが含まれています。

```bash
# パッケージディレクトリに移動
cd sora-ubuntu-package

# インストールスクリプトの実行
./install.sh
```

スクリプトは以下を自動的に行います：
- ✅ Node.jsのバージョンチェック
- ✅ 必要なファイルのコピー
- ✅ 依存関係のインストール
- ✅ プロジェクトのビルド
- ✅ Claude Desktop設定ファイルの作成/更新
- ✅ バックアップの作成（既存設定がある場合）

インストール中に以下を入力します：
1. **インストールディレクトリ** (デフォルト: `~/.local/share/sora-mcp-server`)
2. **OpenAI APIキー** (オプション、後で設定可能)
3. **既存設定の更新確認** (既存のClaude Desktop設定がある場合)

### 方法2: 手動インストール

自動インストールが使えない場合の手順：

#### ステップ1: インストールディレクトリの作成

```bash
mkdir -p ~/.local/share/sora-mcp-server
cd ~/.local/share/sora-mcp-server
```

#### ステップ2: ファイルのコピー

パッケージから必要なファイルをコピー：

```bash
# パッケージディレクトリから
cp -r /path/to/sora-ubuntu-package/src .
cp -r /path/to/sora-ubuntu-package/package.json .
cp -r /path/to/sora-ubuntu-package/tsconfig.json .
cp -r /path/to/sora-ubuntu-package/*.md .
```

#### ステップ3: 依存関係のインストール

```bash
npm install
```

#### ステップ4: プロジェクトのビルド

```bash
npm run build
```

#### ステップ5: Claude Desktop設定

Claude Desktopの設定ファイルを編集：

```bash
# 設定ディレクトリの作成
mkdir -p ~/.config/Claude

# 設定ファイルの編集
nano ~/.config/Claude/claude_desktop_config.json
```

以下の内容を追加（既存の設定がある場合は`mcpServers`セクションに追加）：

```json
{
  "mcpServers": {
    "sora": {
      "command": "node",
      "args": [
        "/home/YOUR_USERNAME/.local/share/sora-mcp-server/dist/index.js"
      ],
      "env": {
        "USE_AZURE": "false",
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

**重要**: 
- `YOUR_USERNAME` を実際のユーザー名に置き換える
- `your-openai-api-key-here` を実際のAPIキーに置き換える
- パスは絶対パスで指定する

## 設定の確認

### 1. ファイル構造の確認

インストールが正しく完了しているか確認：

```bash
ls -la ~/.local/share/sora-mcp-server/
```

以下のファイル/ディレクトリが存在するはず：
```
dist/
src/
node_modules/
package.json
tsconfig.json
README.md
```

### 2. ビルドの確認

```bash
ls -la ~/.local/share/sora-mcp-server/dist/
```

`index.js` ファイルが存在することを確認

### 3. Claude Desktop設定の確認

```bash
cat ~/.config/Claude/claude_desktop_config.json
```

設定が正しく追加されていることを確認

### 4. Claude Desktopの再起動

設定を反映するため、Claude Desktopを完全に再起動：

```bash
# Claude Desktopを終了
killall claude-desktop 2>/dev/null || true

# Claude Desktopを起動
claude-desktop &
```

### 5. 動作確認

Claude Desktopで以下のように質問：

```
list_presetsを使って、Sora MCP Serverの利用可能な機能を表示してください。
```

正常に動作していれば、利用可能なビデオ生成プリセットが表示されます。

## トラブルシューティング

### エラー: "sora tool not found"

**原因**: Claude Desktopが設定を読み込んでいない

**解決方法**:
```bash
# 設定ファイルのパスを確認
ls -la ~/.config/Claude/claude_desktop_config.json

# Claude Desktopを完全に再起動
killall claude-desktop
claude-desktop &
```

### エラー: "Cannot find module"

**原因**: 依存関係がインストールされていない

**解決方法**:
```bash
cd ~/.local/share/sora-mcp-server
rm -rf node_modules package-lock.json
npm install
npm run build
```

### エラー: "OPENAI_API_KEY not set"

**原因**: APIキーが設定されていない

**解決方法**:
```bash
# 設定ファイルを編集
nano ~/.config/Claude/claude_desktop_config.json

# OPENAI_API_KEY の値を実際のAPIキーに変更
```

### エラー: "404 Not Found"

**原因**: APIキーが無効、またはSoraへのアクセス権限がない

**解決方法**:
1. [OpenAI Platform](https://platform.openai.com/api-keys)でAPIキーを確認
2. アカウントでSoraが利用可能か確認
3. 課金情報が設定されているか確認

### Node.jsのバージョンが古い

**解決方法**:
```bash
# Node.js v20にアップグレード
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node -v
```

### ビルドエラー: "tsc: command not found"

**原因**: TypeScriptがインストールされていない

**解決方法**:
```bash
cd ~/.local/share/sora-mcp-server
npm install
npm run build
```

### 権限エラー

**原因**: ファイルの権限が正しくない

**解決方法**:
```bash
# 権限を修正
chmod -R u+rw ~/.local/share/sora-mcp-server
chmod +x ~/.local/share/sora-mcp-server/dist/index.js
```

## パッケージの内容

このパッケージには以下が含まれています：

```
sora-ubuntu-package/
├── install.sh                          # 自動インストールスクリプト
├── INSTALL_UBUNTU.md                   # このファイル
├── README.md                           # 使用方法とAPI仕様
├── EXAMPLES.md                         # 使用例
├── IMPROVEMENTS.md                     # 改善内容と詳細
├── SECURITY.md                         # セキュリティ情報
├── package.json                        # NPMパッケージ定義
├── tsconfig.json                       # TypeScript設定
└── src/                                # ソースコード
    ├── index.ts                        # メインファイル
    ├── utils/
    │   └── validation.ts               # バリデーション関数
    └── tests/
        └── server.test.ts              # テスト
```

## 使用方法

詳細な使用方法については以下のドキュメントを参照してください：

- **README.md**: 基本的な使用方法とAPI仕様
- **EXAMPLES.md**: 実用的な使用例
- **IMPROVEMENTS.md**: 詳細な改善内容とベストプラクティス

### 基本的な使い方

```
MCP Soraを使って、5秒間の動画を生成してください。
プロンプト: "A golden retriever puppy playing with a red ball in a sunny garden"
サイズ: 1920x1080
```

## アンインストール

Sora MCP Serverをアンインストールする場合：

```bash
# インストールディレクトリの削除
rm -rf ~/.local/share/sora-mcp-server

# Claude Desktop設定から削除
nano ~/.config/Claude/claude_desktop_config.json
# "sora"セクションを削除

# Claude Desktopを再起動
killall claude-desktop
claude-desktop &
```

## サポート

問題が発生した場合：

1. **IMPROVEMENTS.md** - 詳細な改善内容と使用方法
2. **GitHubのIssue** - 既知の問題と解決方法
3. **OpenAI公式ドキュメント** - [Sora API Documentation](https://platform.openai.com/docs/guides/video-generation)

## セキュリティ

- APIキーは環境変数または設定ファイルで安全に管理
- 設定ファイルのパーミッションを確認: `chmod 600 ~/.config/Claude/claude_desktop_config.json`
- APIキーを他人と共有しない
- 予算設定を必ず行う

## ライセンス

MIT

---

**作成日**: 2025-10-08  
**バージョン**: 2.0.0  
**対象OS**: Ubuntu 20.04 LTS以上
