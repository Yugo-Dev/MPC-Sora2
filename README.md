# Sora MCP Server for Claude Desktop (v2.0 - 改善版)

OpenAI Sora 2ビデオAPIを利用するためのModel Context Protocol (MCP) サーバー実装です。Claude Desktopから直接ビデオ生成、リミックスを行うことができます。

## 🎯 v2.0での主な改善点

このバージョンでは、OpenAIの公式Sora 2 APIに完全対応し、以下の問題を解決しました：

- ✅ **404エラーの修正**: 正しいAPIエンドポイントを使用
- ✅ **パラメータ形式の修正**: OpenAI APIに準拠した形式
- ✅ **実装の簡素化**: 実証済みの機能のみを提供
- ✅ **エラーハンドリングの改善**: 詳細なエラーメッセージ

詳細な改善内容は [IMPROVEMENTS.md](./IMPROVEMENTS.md) をご覧ください。

## ✨ 利用可能な機能

### 🎬 基本的なビデオ生成
プロンプトからビデオを生成します。

### 🖼️ 参照画像を使用したビデオ生成
画像を基にアニメーションビデオを生成します。

### 🔀 ビデオのリミックス
既存のビデオを新しいプロンプトで変更します（視覚的一貫性を保持）。

### 📊 ビデオステータスの確認
生成中のビデオの進捗を確認します。

### 📋 ビデオ一覧の表示
最近生成したビデオのリストを取得します。

### 💾 ビデオのダウンロード
完成したビデオをローカルに保存します。

## 必要条件

- Node.js v18以上
- OpenAI APIキー（Soraへのアクセス権限が必要）
- Claude Desktop（最新版）

## セットアップ

### 1. OpenAI APIキーの準備

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. API Keysセクションで新しいAPIキーを作成
3. Soraへのアクセス権限があることを確認

### 2. Claude Desktop設定

#### macOS
設定ファイルの場所: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Windows
設定ファイルの場所: `%APPDATA%\Claude\claude_desktop_config.json`

以下の設定を追加（既存の設定がある場合は、`mcpServers`セクションに追加）：

```json
{
  "mcpServers": {
    "sora": {
      "command": "node",
      "args": [
        "/Users/yugo/claude/mcp/sora-mcp-server/dist/index.js"
      ],
      "env": {
        "USE_AZURE": "false",
        "OPENAI_API_KEY": "your-openai-api-key-here"
      }
    }
  }
}
```

**重要:** パスは絶対パスで指定してください。

### 3. Claude Desktopの再起動

設定を反映するため、Claude Desktopを完全に再起動してください。

## 使用方法

### 1. 基本的なビデオ生成

```
MCP Soraを使って、5秒間の動画を生成してください。
プロンプト: "A golden retriever puppy playing with a red ball in a sunny garden"
サイズ: 1920x1080
```

**生成されるもの:**
- ビデオID
- ステータス情報
- 推定完了時間

### 2. ビデオステータスの確認

```
retrieve_video を使って、ビデオID "video_xxx" のステータスを確認してください。
```

**取得できる情報:**
- 現在のステータス (queued, in_progress, completed, failed)
- 生成進捗率（パーセンテージ）
- 作成日時

### 3. ビデオのダウンロード

```
download_video を使って、ビデオID "video_xxx" を
/Users/yugo/claude/output/puppy.mp4 に保存してください。
```

### 4. 参照画像を使用したビデオ生成

```
generate_video_with_reference を使って、
画像 /Users/yugo/pictures/scene.jpg をアニメーション化してください。
プロンプト: "Make this scene come to life with gentle movement"
サイズ: 1920x1080
長さ: 5秒
```

### 5. ビデオのリミックス

```
remix_video を使って、ビデオID "video_xxx" を
新しいプロンプト "Same scene but in winter with snow falling" でリミックスしてください。
```

### 6. 最近のビデオ一覧

```
list_videos を使って、最近生成したビデオを10件表示してください。
```

## 推奨設定とベストプラクティス

### ビデオサイズ

- **16:9 (横長)**: `1920x1080` - 標準的な動画、YouTube向け
- **9:16 (縦長)**: `720x1280` - Instagram Stories、TikTok向け
- **1:1 (正方形)**: `1080x1080` - Instagram投稿、Facebook向け

### 動画の長さ

- **最小**: 4秒
- **最大**: 20秒（sora-2）
- **推奨**: 5-10秒（生成時間とコストのバランス）

### モデルの選択

- **sora-2** (デフォルト): 安定して高速、推奨
- **sora-2-pro**: 高品質だが遅延の可能性あり

### プロンプトのコツ

1. **具体的に記述する**
   ```
   ❌ "A dog playing"
   ✅ "A golden retriever puppy playing with a red ball in a sunny garden"
   ```

2. **スタイルを指定する**
   ```
   "cinematic shot", "animated style", "photorealistic"
   ```

3. **カメラワークを含める**
   ```
   "tracking shot", "aerial view", "static camera", "slow pan"
   ```

4. **照明と雰囲気を記述する**
   ```
   "soft morning light", "dramatic lighting", "neon glow", "golden hour"
   ```

5. **500文字以内に収める**

### プリセット例

#### 映画風
```
prompt: "Cinematic shot of a city skyline at sunset, dramatic lighting, wide angle"
size: "1920x1080"
seconds: 10
```

#### ソーシャルメディア向け
```
prompt: "Vertical format product showcase, clean background, dynamic movement"
size: "720x1280"
seconds: 15
```

#### 商品デモ
```
prompt: "Clean white background, product rotating smoothly, professional lighting"
size: "1080x1080"
seconds: 5
```

## トラブルシューティング

### エラー: "404 Not Found"

**原因:**
- APIキーが無効
- Soraへのアクセス権限がない

**解決方法:**
1. [OpenAI Platform](https://platform.openai.com/api-keys) でAPIキーを確認
2. アカウントでSoraが利用可能か確認
3. 課金情報が設定されているか確認

### エラー: "Content policy violation"

**原因:**
- プロンプトまたは参照画像が規約違反

**解決方法:**
- 実際の人物の画像を避ける
- 暴力的、性的なコンテンツを避ける
- より一般的な表現に変更

### ビデオ生成が遅い

**原因:**
- サーバー負荷
- sora-2-proモデルの使用

**解決方法:**
1. sora-2モデルを使用（より高速）
2. 動画の長さを短くする（5秒推奨）
3. オフピーク時間に実行

### 参照画像が読み込めない

**原因:**
- ファイルパスが間違っている
- ファイル形式が非対応

**解決方法:**
- 絶対パスを使用する
- サポートされる形式: PNG, JPG, JPEG
- ファイルが存在することを確認

## 注意事項

### コンテンツモデレーション

Soraには厳格なコンテンツモデレーションがあります：

- ❌ 実際の人物の画像からの動画生成は非対応
- ❌ 暴力的、性的なコンテンツ
- ❌ 著作権で保護されたキャラクターや商標
- ✅ オリジナルのキャラクターや架空のシーン
- ✅ 自然風景や抽象的な概念

### 料金について

- Sora APIの使用には課金が発生します
- 使用状況: https://platform.openai.com/usage
- 予算設定を行うことを強く推奨します

### Pro モデルについて

`sora-2-pro` モデルは現在、生成中に停止する問題が報告されています。
信頼性の高い結果を得るには `sora-2` を使用してください。

## API仕様

### generate_video

```typescript
{
  prompt: string,           // 必須: ビデオの説明
  size?: string,            // オプション: "1920x1080" (デフォルト)
  seconds?: number,         // オプション: 5 (デフォルト、4-20)
  model?: string            // オプション: "sora-2" (デフォルト)
}
```

### generate_video_with_reference

```typescript
{
  prompt: string,           // 必須: アニメーション指示
  reference_image: string,  // 必須: 画像の絶対パス
  size?: string,            // オプション: "1920x1080"
  seconds?: number,         // オプション: 5
  model?: string            // オプション: "sora-2"
}
```

### remix_video

```typescript
{
  video_id: string,         // 必須: リミックス元のビデオID
  prompt: string            // 必須: 新しいプロンプト
}
```

### retrieve_video

```typescript
{
  video_id: string          // 必須: 確認するビデオID
}
```

### list_videos

```typescript
{
  limit?: number            // オプション: 取得数 (デフォルト: 10)
}
```

### download_video

```typescript
{
  video_id: string,         // 必須: ダウンロードするビデオID
  output_path: string       // 必須: 保存先の絶対パス
}
```

## 今後の開発予定

現在、以下の機能は実装されていません（将来的に追加予定）：

- [ ] blend_videos（複数ビデオのブレンド）
- [ ] recut_video（ビデオの編集）
- [ ] create_storyboard（マルチシーン動画）
- [ ] Cameo機能（API対応時）

これらの機能が必要な場合は、現時点ではPython SDKを直接使用することをお勧めします。

## 参考リンク

- [OpenAI Sora 公式ドキュメント](https://platform.openai.com/docs/guides/video-generation)
- [Sora 2 モデル情報](https://platform.openai.com/docs/models/sora-2)
- [参考実装（Python）](https://github.com/daveebbelaar/ai-cookbook/tree/main/models/openai/08-video)
- [OpenAI 料金ページ](https://openai.com/api/pricing/)

## ライセンス

MIT

## サポート

問題が発生した場合は、以下を確認してください：

1. [IMPROVEMENTS.md](./IMPROVEMENTS.md) - 詳細な改善内容と使用方法
2. GitHubのIssue - 既知の問題と解決方法

## バージョン履歴

### v2.0.0 (2025-10-08) - 大幅改善
- ✅ 正しいOpenAI Video APIエンドポイントに対応
- ✅ パラメータ形式をOpenAI仕様に修正
- ✅ リミックス機能の実装修正
- ✅ エラーハンドリングの改善
- ✅ 実証済みの機能のみを提供
- ✅ 詳細なドキュメント追加

### v1.0.0 (以前)
- ❌ ジョブベースAPI（動作不良）
- ❌ 404エラーが発生
- ❌ パラメータ形式が不正確

---

**注意**: このバージョンは、GitHubの参考実装とOpenAI公式ドキュメントに基づいて大幅に改善されています。旧バージョンで発生していた404エラーは解決されています。
