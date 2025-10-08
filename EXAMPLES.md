# Sora 2 MCP サーバー使用例

このファイルには、Sora 2 MCPサーバーの各機能の使用例が含まれています。Claude Desktopで以下のプロンプトを使用できます。

## 1. 基本的なビデオ生成

### シンプルな生成
```
Sora MCPツールを使って、「夕日が沈む海岸線を歩く人のシルエット」というプロンプトで10秒のビデオを生成してください。
```

### スタイル指定付き生成
```
generate_videoツールを使用して以下のビデオを生成：
- プロンプト: "A futuristic city with flying cars and neon lights"
- スタイル: cinematic
- カメラモーション: slow aerial sweep
- 長さ: 15秒
- 解像度: 1920x1080
```

## 2. リファレンスを使用した生成

### 画像リファレンス
```
generate_video_with_referenceツールを使用：
- プロンプト: "Transform this landscape into a magical winter wonderland with falling snow"
- reference_image: "/Users/username/Desktop/summer_landscape.jpg"
- preserve_style: true
- 長さ: 10秒
```

### 動画リファレンス（モーション転送）
```
generate_video_with_referenceツールで動画のモーションを転送：
- プロンプト: "Apply this dance movement to a robot character"
- reference_video: "/Users/username/Videos/dance.mp4"
- motion_transfer: true
- preserve_style: false
- 長さ: 12秒
```

## 3. ビデオのリミックス

### スタイル変更
```
remix_videoツールを使用して既存のビデオをリミックス：
- video_id: "gen-abc123xyz"
- new_prompt: "Convert this to an animated cartoon style with bright colors"
- preserve_motion: true
- preserve_style: false
- strength: 0.8
```

### 環境変更
```
remix_videoツールで背景を変更：
- video_id: "gen-def456uvw"
- new_prompt: "Place the subject in a cyberpunk city at night"
- preserve_motion: true
- strength: 0.6
```

## 4. 複数ビデオのブレンド

### スムーズなトランジション
```
blend_videosツールで3つのビデオを結合：
- video_ids: ["gen-111aaa", "gen-222bbb", "gen-333ccc"]
- transition_type: "smooth"
- blend_weights: [0.3, 0.4, 0.3]
- output_duration: 20
```

### モーフィング効果
```
blend_videosツールでモーフィング効果を作成：
- video_ids: ["gen-morning", "gen-evening"]
- transition_type: "morph"
- output_duration: 10
```

## 5. ビデオの再編集

### トリミング
```
recut_videoツールでビデオをトリミング：
- video_id: "gen-xyz789"
- start_time: 3
- end_time: 8
```

### 延長
```
recut_videoツールでビデオを延長：
- video_id: "gen-abc456"
- extend_direction: "both"
- extend_duration: 5
```

### ループ作成
```
recut_videoツールでシームレスループを作成：
- video_id: "gen-loop123"
- loop: true
```

## 6. ストーリーボード

### 短編ストーリー
```
create_storyboardツールでストーリーボードを作成：
scenes: [
  {
    prompt: "Establishing shot of a mysterious forest at dawn",
    duration: 4,
    camera: "wide static"
  },
  {
    prompt: "A deer appears from behind the trees",
    duration: 3,
    camera: "slow zoom in",
    transition: "fade"
  },
  {
    prompt: "The deer runs through the forest",
    duration: 5,
    camera: "tracking shot",
    transition: "cut"
  },
  {
    prompt: "The deer reaches a magical clearing with glowing flowers",
    duration: 4,
    camera: "aerial reveal",
    transition: "smooth"
  }
]
style: "cinematic"
total_duration: 16
```

### プロダクトデモ
```
create_storyboardツールで製品デモを作成：
scenes: [
  {
    prompt: "Close-up of smartphone on white background",
    duration: 2,
    camera: "static"
  },
  {
    prompt: "Hand picks up the phone and unlocks it",
    duration: 3,
    camera: "slow push in"
  },
  {
    prompt: "Screen shows app interface with animations",
    duration: 4,
    camera: "overhead shot"
  },
  {
    prompt: "Multiple features demonstrated in split screen",
    duration: 5,
    camera: "dynamic movement"
  }
]
style: "photorealistic"
total_duration: 14
```

## 7. ワークフロー例

### 完全なビデオ制作フロー
```
1. まず、generate_videoでベースとなるビデオを生成してください：
   プロンプト: "A peaceful mountain lake at sunrise"
   
2. ジョブIDを使ってcheck_job_statusでステータスを確認

3. 完成したら、remix_videoで季節を変更：
   new_prompt: "Same scene but in autumn with colorful leaves"
   
4. さらに別のビデオを生成：
   プロンプト: "The same lake at sunset"
   
5. 最後にblend_videosで朝から夕方への時間経過動画を作成

6. download_videoで最終的なビデオをダウンロード
```

## 8. トラブルシューティング例

### ジョブ状態の確認
```
check_job_statusツールでジョブ「gen-status123」の現在の状態を確認してください。
```

### プリセット確認
```
list_presetsツールを使って、利用可能なプリセットと推奨設定を表示してください。
```

## 注意事項

- ビデオIDは生成後に返されるものを使用してください
- リファレンスファイルのパスは絶対パスで指定してください
- 処理には時間がかかる場合があるので、定期的にステータスを確認してください
- コンテンツポリシーに準拠したプロンプトを使用してください

## よくある質問

### Q: 生成にどれくらい時間がかかりますか？
A: 通常5-20秒のビデオで1-10分程度ですが、サーバーの混雑状況により変動します。

### Q: 同時に複数のジョブを実行できますか？
A: はい、ただしアカウントのレート制限に注意してください。

### Q: リファレンス画像の推奨サイズは？
A: 生成するビデオと同じアスペクト比の高解像度画像を推奨します。

### Q: Remixのstrengthパラメータの適切な値は？
A: 
- 0.1-0.3: 微調整（色調整、小さな変更）
- 0.4-0.6: 中程度の変更（要素の追加/削除）
- 0.7-1.0: 大幅な変更（スタイル変換、環境変更）

### Q: Blendで最大何個のビデオを結合できますか？
A: APIの制限により通常2-5個程度を推奨します。

## サポート

問題が発生した場合は、以下を確認してください：
1. APIキーが正しく設定されているか
2. ファイルパスが正しいか
3. ビデオIDが有効か
4. ネットワーク接続が安定しているか