# Discord期日通知システム - セットアップガイド

## 概要

このシステムは、Redmineチケットの期日に基づいて自動的にDiscord通知を送信します。

## 通知タイミング

- **前日**: 期日の1日前
- **当日**: 期日当日  
- **超過後**: 期日を過ぎた日から毎日（完了するまで）

## 設定手順

### 1. Discord Webhookの作成

1. Discordで通知を送信したいチャンネルを開く
2. チャンネル設定 → 連携サービス → ウェブフック
3. 「新しいウェブフック」をクリック
4. ウェブフックURLをコピー

### 2. Discord User IDと表示名の確認

**DiscordユーザーIDの取得:**
1. Discordの設定 → 詳細設定 → 開発者モードを有効化
2. ユーザーを右クリック → IDをコピー

**表示名の確認:**
- Discordでのユーザー表示名を確認（例: `SoumaKamata`）

### 3. 環境変数の設定

`.env.local`ファイルに以下を追加：

**オプション1: IDのみ（シンプル）**
```env
# Discord Webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

# ユーザーマッピング (Redmine名前 → Discord User ID)
DISCORD_USER_MAPPING={"Kamata Souma":"1068052953052762142","田中太郎":"234567890123456789"}

# API Key (任意の文字列)
NOTIFICATION_API_KEY=your-secret-api-key-here
```

**オプション2: IDと表示名（推奨）**
```env
# Discord Webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

# ユーザーマッピング (Redmine名前 → {id: Discord ID, name: 表示名})
DISCORD_USER_MAPPING={"Kamata Souma":{"id":"1068052953052762142","name":"SoumaKamata"},"田中太郎":{"id":"234567890123456789","name":"田中太郎"}}

# API Key (任意の文字列)
NOTIFICATION_API_KEY=your-secret-api-key-here
```

**動作の違い:**
- **オプション1**: メンション通知が飛び、Embed内では Redmine の担当者名が表示される
- **オプション2**: メンション通知が飛び、Embed内では指定した Discord 表示名が表示される

**重要:** 
- `DISCORD_USER_MAPPING`はJSON形式で記述
- Redmineの担当者名と完全一致させる必要があります
- Discord User IDは数字のみ（`<@...>`形式は不要）

### 4. Vercel Cronの設定 (本番環境)

`vercel.json`は既に設定済みです：

```json
{
  "crons": [{
    "path": "/api/notifications/check-due-dates",
    "schedule": "0 0 * * *"
  }]
}
```

**スケジュール**: 毎日0:00 UTC (日本時間 9:00)

## テスト方法

### Discord接続テスト

```bash
curl http://localhost:3000/api/notifications/test-discord
```

または、ブラウザで:
```
http://localhost:3000/api/notifications/test-discord
```

### 期日チェックテスト

```bash
curl -X POST http://localhost:3000/api/notifications/check-due-dates \
  -H "Authorization: Bearer your-secret-api-key-here"
```

開発環境ではGETメソッドでもアクセス可能：
```
http://localhost:3000/api/notifications/check-due-dates
```

## 手動実行 (本番環境)

GitHub Actionsやcurlで手動実行する場合：

```bash
curl -X POST https://your-app.vercel.app/api/notifications/check-due-dates \
  -H "Authorization: Bearer ${NOTIFICATION_API_KEY}"
```

## トラブルシューティング

### 通知が送信されない

1. `DISCORD_WEBHOOK_URL`が正しく設定されているか確認
2. Webhook URLが有効か確認（Discordで無効化されていないか）
3. ログを確認してエラーメッセージを確認

### 表示名が正しく表示されない

1. `DISCORD_USER_MAPPING`のJSON形式が正しいか確認
2. Redmineの担当者名と完全一致しているか確認
3. Discordの表示名が正しいか確認（`@SoumaKamata`ではなく`SoumaKamata`）
4. `@`マークは自動で追加されるため、マッピングには含めない

### Cronが実行されない

1. Vercelの Deployments → Cron Jobsで実行履歴を確認
2. Vercelのプランを確認（Hobbyプランでは制限あり）
3. `vercel.json`が正しくデプロイされているか確認

## APIエンドポイント

### `GET /api/notifications/test-discord`

Discord Webhook接続をテストします。

**レスポンス例:**
```json
{
  "success": true,
  "message": "Test notification sent successfully"
}
```

### `POST /api/notifications/check-due-dates`

期日をチェックして通知を送信します。

**ヘッダー:**
```
Authorization: Bearer YOUR_API_KEY
```

**レスポンス例:**
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "stats": {
    "totalTickets": 150,
    "tomorrow": 3,
    "today": 2,
    "overdue": 5
  }
}
```

## セキュリティ

- `NOTIFICATION_API_KEY`は必ず設定してください
- `.env.local`はGitにコミットしないでください（`.gitignore`で除外済み）
- Webhook URLは公開しないでください

## カスタマイズ

### 通知時刻の変更

`vercel.json`の`schedule`を変更：

```json
"schedule": "0 1 * * *"  // 10:00 JST
"schedule": "30 23 * * *"  // 8:30 JST
```

Cron形式: `分 時 日 月 曜日` (UTC)

### 完了ステータスIDの変更

`src/lib/due-date-checker.js`の`completedStatusIds`を変更：

```javascript
const completedStatusIds = [5, 6]; // Redmineのステータスに合わせて変更
```
