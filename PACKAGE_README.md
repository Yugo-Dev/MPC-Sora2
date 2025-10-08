# Sora MCP Server - Ubuntu移植パッケージ

OpenAI Sora 2 MCP ServerをUbuntu環境に移植するためのパッケージです。

## 📦 パッケージ内容

このパッケージには、macOS版のSora MCP ServerをUbuntu環境で動作させるために必要なすべてのファイルが含まれています。

```
sora-ubuntu-package/
├── install.sh                    # 自動インストールスクリプト
├── INSTALL_UBUNTU.md             # Ubuntu向けインストールガイド
├── PACKAGE_README.md             # このファイル
├── README.md                     # 使用方法とAPI仕様
├── EXAMPLES.md                   # 使用例
├── IMPROVEMENTS.md               # 改善内容と詳細
├── SECURITY.md                   # セキュリティ情報
├── package.json                  # NPMパッケージ定義
├── tsconfig.json                 # TypeScript設定
└── src/                          # ソースコード
    ├── index.ts                  # メインファイル
    ├── utils/
    │   └── validation.ts         # バリデーション関数
    └── tests/
        └── server.test.ts        # テスト
```

## 🚀 クイックスタート

### 1. パッケージをUbuntu環境に転送

```bash
# macOSからUbuntu環境にパッケージを転送（例: scp）
scp -r sora-ubuntu-package username@ubuntu-host:~/
```

または、USBドライブ、共有フォルダなどを使用してファイルを転送します。

### 2. Ubuntu環境でインストール

```bash
# Ubuntu環境で実行
cd ~/sora-ubuntu-package
./install.sh
```

### 3. 詳細なインストール手順

詳細なインストール手順については、**INSTALL_UBUNTU.md** を参照してください。

## 📋 システム要件

- **OS**: Ubuntu 20.04 LTS以上（Ubuntu 22.04 LTS推奨）
- **Node.js**: v18以上（v20推奨）
- **Claude Desktop**: 最新版
- **OpenAI API Key**: Soraへのアクセス権限が必要

## 🔧 インストール方法

### 方法1: 自動インストールスクリプト（推奨）

```bash
cd sora-ubuntu-package
./install.sh
```

このスクリプトは以下を自動的に実行します：
- ✅ Node.jsバージョンのチェック
- ✅ 依存関係のインストール
- ✅ プロジェクトのビルド
- ✅ Claude Desktop設定の作成/更新
- ✅ バックアップの作成（既存設定がある場合）

### 方法2: 手動インストール

詳細な手動インストール手順については、**INSTALL_UBUNTU.md** を参照してください。

## 📖 ドキュメント

- **INSTALL_UBUNTU.md**: Ubuntu向けの詳細なインストールガイド
  - システム要件
  - 事前準備
  - インストール手順
  - トラブルシューティング
  
- **README.md**: Sora MCP Serverの使用方法とAPI仕様
  - 基本的な使い方
  - 各種ツールの説明
  - パラメータの詳細
  
- **EXAMPLES.md**: 実用的な使用例
  - 基本的なビデオ生成
  - 参照画像を使用したビデオ生成
  - リミックス機能
  
- **IMPROVEMENTS.md**: v2.0での改善内容
  - 404エラーの修正
  - パラメータ形式の改善
  - ベストプラクティス

- **SECURITY.md**: セキュリティに関する情報
  - APIキーの安全な管理
  - コンテンツモデレーション
  - 推奨設定

## 🎯 主な機能

- **基本的なビデオ生成**: テキストプロンプトからビデオを生成
- **参照画像を使用したビデオ生成**: 画像をアニメーション化
- **ビデオのリミックス**: 既存ビデオを新しいプロンプトで変更
- **ビデオステータスの確認**: 生成進捗の確認
- **ビデオ一覧の取得**: 最近生成したビデオのリスト
- **ビデオのダウンロード**: 完成ビデオをローカルに保存

## ⚙️ インストール後の設定

### Claude Desktop設定ファイルの場所

Ubuntu環境では、Claude Desktopの設定ファイルは以下の場所にあります：

```
~/.config/Claude/claude_desktop_config.json
```

### 設定例

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

**注意**: 
- `YOUR_USERNAME` を実際のユーザー名に置き換える
- `your-openai-api-key-here` を実際のOpenAI APIキーに置き換える

## 🔍 動作確認

インストール後、Claude Desktopで以下のように質問して動作を確認：

```
list_presetsを使って、Sora MCP Serverの利用可能な機能を表示してください。
```

## 🐛 トラブルシューティング

よくある問題と解決方法については、**INSTALL_UBUNTU.md** の「トラブルシューティング」セクションを参照してください。

主な問題：
- Node.jsのバージョンが古い
- APIキーが設定されていない
- Claude Desktopが設定を読み込んでいない
- 依存関係のインストールエラー

## 📝 移植時の変更点

macOS版からUbuntu版への主な変更点：

1. **設定ファイルのパス**
   - macOS: `~/Library/Application Support/Claude/`
   - Ubuntu: `~/.config/Claude/`

2. **デフォルトインストールパス**
   - macOS: `/Users/username/claude/mcp/`
   - Ubuntu: `~/.local/share/`

3. **インストールスクリプト**
   - Ubuntu用のbashスクリプトを追加
   - 自動設定とバックアップ機能

4. **ドキュメント**
   - Ubuntu固有のインストールガイドを追加
   - トラブルシューティングセクションを強化

## 🔐 セキュリティ

- OpenAI APIキーを安全に管理してください
- 設定ファイルの権限を適切に設定: `chmod 600 ~/.config/Claude/claude_desktop_config.json`
- APIキーをバージョン管理システムにコミットしない
- 予算設定を行うことを強く推奨

## 📚 参考リンク

- [OpenAI Sora公式ドキュメント](https://platform.openai.com/docs/guides/video-generation)
- [Sora 2モデル情報](https://platform.openai.com/docs/models/sora-2)
- [OpenAI料金ページ](https://openai.com/api/pricing/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 📄 ライセンス

MIT

## 📞 サポート

問題が発生した場合：

1. まず **INSTALL_UBUNTU.md** のトラブルシューティングセクションを確認
2. **IMPROVEMENTS.md** で詳細な使用方法を確認
3. OpenAI APIのステータスを確認: [status.openai.com](https://status.openai.com/)

## 🎉 完了後

インストールが完了したら、以下をお試しください：

```
MCP Soraを使って、5秒間の動画を生成してください。
プロンプト: "A golden retriever puppy playing with a red ball in a sunny garden"
サイズ: 1920x1080
```

---

**パッケージ作成日**: 2025-10-08  
**バージョン**: 2.0.0  
**元のOS**: macOS  
**対象OS**: Ubuntu 20.04 LTS以上
