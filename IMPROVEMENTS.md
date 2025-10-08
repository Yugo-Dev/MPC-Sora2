# Sora MCP Server 改善内容

## 改善日時
2025-10-08

## 参考リソース
- GitHub リポジトリ: https://github.com/daveebbelaar/ai-cookbook/tree/main/models/openai/08-video
- OpenAI Sora 2 API ドキュメント

## 主な問題点と修正内容

### 1. **APIエンドポイントの修正**

**問題:**
- 旧実装: `/v1/video/generations/jobs` (ジョブベースAPI、存在しない)
- これが404エラーの主な原因

**修正:**
- 正しいエンドポイント: `/v1/videos` (ビデオ作成)
- リミックス: `/v1/videos/remix`
- ステータス確認: `/v1/videos/{video_id}`
- ダウンロード: `/v1/videos/{video_id}/content`

### 2. **パラメータ形式の修正**

**問題:**
- 旧実装: 個別に `height`, `width`, `n_seconds`, `n_variants` を送信
- パラメータ形式が正しくない

**修正:**
- `size`: 文字列形式 (例: "720x1280", "1920x1080", "1080x1080")
- `seconds`: 文字列形式 (例: "5", "10")
- `model`: "sora-2" または "sora-2-pro"

### 3. **リミックス機能の修正**

**問題:**
- 旧実装: `/v1/videos/{video_id}/remix` (パスパラメータ)
- エンドポイントが間違っている

**修正:**
- 正しいエンドポイント: `/v1/videos/remix`
- パラメータ: `{ video_id: string, prompt: string }`

### 4. **機能の簡素化と実用性の向上**

**削除した機能:**
- `blend_videos`: API実装が不明確
- `recut_video`: API実装が不明確
- `create_storyboard`: API実装が不明確
- Azure OpenAI サポート: 不要な複雑性

**追加・改善した機能:**
- `retrieve_video`: ビデオステータスの詳細確認
- `list_videos`: 最近のビデオ一覧表示
- `download_video`: 完成したビデオのダウンロード
- プログレス表示: 生成進捗の表示

### 5. **モデル指定の追加**

**追加:**
- `model` パラメータで "sora-2" または "sora-2-pro" を選択可能
- デフォルトは "sora-2" (安定版)
- "sora-2-pro" は高品質だが遅延の可能性あり

## API仕様

### 1. generate_video
```typescript
{
  prompt: string,           // 必須: ビデオの説明
  size?: string,            // オプション: "1920x1080" (デフォルト)
  seconds?: number,         // オプション: 5 (デフォルト)
  model?: string            // オプション: "sora-2" (デフォルト)
}
```

**サイズオプション:**
- 16:9 (横長): "1920x1080"
- 9:16 (縦長): "720x1280"
- 1:1 (正方形): "1080x1080"

### 2. generate_video_with_reference
```typescript
{
  prompt: string,           // 必須: アニメーション指示
  reference_image: string,  // 必須: 画像の絶対パス
  size?: string,            // オプション: "1920x1080"
  seconds?: number,         // オプション: 5
  model?: string            // オプション: "sora-2"
}
```

**重要な注意事項:**
- 実際の人物の画像は使用不可（モデレーションが厳しい）
- サポートされる画像形式: PNG, JPG, JPEG

### 3. remix_video
```typescript
{
  video_id: string,         // 必須: リミックス元のビデオID
  prompt: string            // 必須: 新しいプロンプト
}
```

**特徴:**
- 元のビデオの視覚的一貫性を保ちながら、新しいプロンプトで変更
- キャラクターや背景の一貫性を維持

### 4. retrieve_video
```typescript
{
  video_id: string          // 必須: 確認するビデオID
}
```

**ステータス:**
- `queued`: キューに入っている
- `in_progress`: 生成中
- `completed`: 完成
- `failed`: 失敗

### 5. list_videos
```typescript
{
  limit?: number            // オプション: 取得数 (デフォルト: 10)
}
```

### 6. download_video
```typescript
{
  video_id: string,         // 必須: ダウンロードするビデオID
  output_path: string       // 必須: 保存先の絶対パス
}
```

**例:**
```
/Users/yugo/claude/output/my_video.mp4
```

## 使用例

### 基本的な動画生成
```
1. generate_video を実行
   - prompt: "A golden retriever puppy playing with a red ball in a sunny garden"
   - size: "1920x1080"
   - seconds: 5

2. retrieve_video でステータス確認
   - video_id: (生成されたID)

3. download_video でダウンロード
   - video_id: (生成されたID)
   - output_path: "/Users/yugo/claude/output/puppy.mp4"
```

### 参照画像を使用した動画生成
```
1. 画像を準備

2. generate_video_with_reference を実行
   - prompt: "Make this image come to life"
   - reference_image: "/Users/yugo/pictures/scene.jpg"
   - size: "720x1280"
   - seconds: 5

3. retrieve_video でステータス確認

4. download_video でダウンロード
```

### リミックス機能
```
1. 元の動画を生成

2. remix_video を実行
   - video_id: (元の動画のID)
   - prompt: "Same character, now in a modern office setting"

3. retrieve_video でステータス確認

4. download_video でダウンロード
```

## ベストプラクティス

### プロンプト作成のコツ
1. **具体的に記述する**: "犬" ではなく "ゴールデンレトリーバーの子犬"
2. **スタイルを指定する**: "cinematic shot", "animated style", "photorealistic"
3. **カメラの動きを指定する**: "tracking shot", "aerial view", "static camera"
4. **照明と雰囲気**: "soft morning light", "dramatic lighting", "neon glow"
5. **500文字以内に収める**

### 推奨設定

**映画風 (Cinematic):**
- size: "1920x1080"
- seconds: 10
- プロンプトに含める: "cinematic shot", "dramatic lighting", "wide angle"

**ソーシャルメディア (Social Media):**
- size: "720x1280"
- seconds: 15
- プロンプトに含める: "vertical format", "engaging", "dynamic"

**商品デモ (Product Demo):**
- size: "1080x1080"
- seconds: 5
- プロンプトに含める: "clean background", "product focus", "smooth rotation"

**アニメーション (Animation):**
- size: "1920x1080"
- seconds: 20
- プロンプトに含める: "animated style", "cartoon", "vibrant colors"

## トラブルシューティング

### 404 エラー
- **原因**: APIキーが無効、またはSoraへのアクセス権限がない
- **解決**: OpenAIのダッシュボードでAPIキーとSoraアクセスを確認

### モデレーションエラー
- **原因**: プロンプトまたは参照画像が規約に違反
- **解決**: 
  - 実際の人物の画像を避ける
  - 暴力的、性的なコンテンツを避ける
  - より一般的な記述に変更する

### 生成が遅い
- **原因**: sora-2-pro モデルを使用、またはサーバー負荷
- **解決**: 
  - sora-2 モデルを使用（より高速）
  - 動画の長さを短くする
  - オフピーク時間に実行

## 次のステップ

1. **Claude Desktopを再起動**して、新しいMCPサーバーを読み込む

2. **動画生成をテスト**する:
   ```
   MCP Soraを使って、5秒間の動画を生成してください。
   プロンプト: "A golden retriever puppy playing with a red ball in a sunny garden"
   ```

3. **ステータス確認**:
   ```
   retrieve_video を使って、ビデオID "xxx" のステータスを確認してください。
   ```

4. **ダウンロード**:
   ```
   download_video を使って、ビデオを /Users/yugo/claude/output/video.mp4 に保存してください。
   ```

## バックアップファイル

元のファイルはバックアップされています:
- `/Users/yugo/claude/mcp/sora-mcp-server/src/index.ts.backup_[タイムスタンプ]`

問題が発生した場合は、バックアップファイルから復元できます。

## 参考情報

### OpenAI Sora 2 公式ドキュメント
- ビデオ生成ガイド: https://platform.openai.com/docs/guides/video-generation
- Sora 2 モデル: https://platform.openai.com/docs/models/sora-2
- Sora 2 Pro モデル: https://platform.openai.com/docs/models/sora-2-pro
- プロンプティングガイド: https://cookbook.openai.com/examples/sora/sora2_prompting_guide

### 料金について
- Sora API の使用には課金が発生します
- 使用状況は https://platform.openai.com/usage で確認できます
- 予算設定を行うことをお勧めします

## 注意事項

1. **コンテンツモデレーション**: Soraは厳しいモデレーションがあります
   - 実際の人物の画像から動画への変換はサポートされていません
   - 特定のテーマやシナリオは制限されています

2. **Pro モデルの状態**: sora-2-pro モデルは現在、生成中に停止する問題が報告されています
   - 信頼性のある結果を得るには sora-2 を使用してください

3. **カメオ機能**: カメオオプションはまだAPI経由では利用できません

## バージョン情報

- **改善前**: v1.0.0 (ジョブベースAPI、動作不良)
- **改善後**: v2.0.0 (正しいOpenAI Video API実装)
