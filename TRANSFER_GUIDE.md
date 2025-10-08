# Ubuntu環境への転送とインストール - クイックガイド

## 📥 Ubuntu環境でのインストール手順

### ステップ1: パッケージの展開

```bash
# ホームディレクトリに展開
cd ~
tar -xzf sora-ubuntu-package.tar.gz
cd sora-ubuntu-package
```

### ステップ2: インストールスクリプトの実行

```bash
# 実行権限の確認
chmod +x install.sh

# インストール実行
./install.sh
```

### ステップ3: 対話的な設定

インストール中に以下を入力：

1. **インストールディレクトリ**
   - デフォルト: `~/.local/share/sora-mcp-server`
   - そのままEnterでOK

2. **OpenAI APIキー**
   - APIキーを入力（後で設定する場合はEnter）

3. **既存設定の更新**
   - 既存のClaude Desktop設定がある場合は `y` で更新

### ステップ4: Claude Desktopの再起動

```bash
# Claude Desktopを終了
killall claude-desktop 2>/dev/null || true

# Claude Desktopを起動
claude-desktop &
```

### ステップ5: 動作確認

Claude Desktopで以下のように質問：

```
list_presetsを使って、Sora MCP Serverの利用可能な機能を表示してください。
```

## 📝 事前準備（Ubuntu環境）

インストール前に以下が必要：

### 1. Node.js v18以上のインストール

```bash
# Node.js v20のインストール（推奨）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node -v  # v20.x.x以上
npm -v
```

### 2. Claude Desktopのインストール

公式サイトからダウンロード：
https://claude.ai/download

### 3. OpenAI APIキーの準備

1. https://platform.openai.com/ にアクセス
2. APIキーを作成
3. Soraへのアクセス権限を確認

## 🐛 トラブルシューティング

### インストールが失敗する場合

```bash
# Node.jsのバージョンを確認
node -v

# v18未満の場合はアップグレード
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Claude Desktopが認識しない場合

```bash
# 設定ファイルを確認
cat ~/.config/Claude/claude_desktop_config.json

# パスが正しいことを確認
ls -l ~/.local/share/sora-mcp-server/dist/index.js
```

### APIキーを後で設定する場合

```bash
# 設定ファイルを編集
nano ~/.config/Claude/claude_desktop_config.json

# OPENAI_API_KEY の値を実際のキーに変更
```

## 📚 詳細ドキュメント

詳細な情報については、以下のファイルを参照：

- **PACKAGE_README.md**: パッケージの概要
- **INSTALL_UBUNTU.md**: 詳細なインストールガイド
- **README.md**: 使用方法とAPI仕様
- **EXAMPLES.md**: 使用例
- **IMPROVEMENTS.md**: 改善内容

## ✅ インストール完了チェックリスト

- [ ] Node.js v18以上がインストールされている
- [ ] パッケージを展開した
- [ ] install.shを実行した
- [ ] OpenAI APIキーを設定した
- [ ] Claude Desktopを再起動した
- [ ] 動作確認ができた

## 🎉 インストール完了後

以下のコマンドで動画生成を試してみましょう：

```
MCP Soraを使って、5秒間の動画を生成してください。
プロンプト: "A golden retriever puppy playing with a red ball in a sunny garden"
サイズ: 1920x1080
```

---

**作成日**: 2025-10-08  
**対象**: Ubuntu 20.04 LTS以上  
**所要時間**: 約10-15分
