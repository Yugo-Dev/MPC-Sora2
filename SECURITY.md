# セキュリティとガードレール実装ガイド

## 1. ガードレールの実装

OpenAI SoraのAPIにはコンテンツポリシーとガードレールが組み込まれていますが、MCPサーバーレベルでも追加の保護層を実装することを推奨します。

### 入力ガードレール

```typescript
// src/guardrails/input.ts

export class InputGuardrail {
  private forbiddenTerms = [
    // コンテンツポリシー違反となる可能性のある用語
  ];

  private maxPromptLength = 500;

  public async validatePrompt(prompt: string): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    // 長さチェック
    if (prompt.length > this.maxPromptLength) {
      return {
        valid: false,
        reason: `Prompt exceeds maximum length of ${this.maxPromptLength} characters`,
      };
    }

    // 禁止用語チェック
    const lowerPrompt = prompt.toLowerCase();
    for (const term of this.forbiddenTerms) {
      if (lowerPrompt.includes(term.toLowerCase())) {
        return {
          valid: false,
          reason: "Prompt contains inappropriate content",
        };
      }
    }

    // PII（個人識別情報）検出
    if (this.containsPII(prompt)) {
      return {
        valid: false,
        reason: "Prompt may contain personally identifiable information",
      };
    }

    return { valid: true };
  }

  private containsPII(text: string): boolean {
    // メールアドレス
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    // 電話番号（簡易版）
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    // クレジットカード番号（簡易版）
    const ccRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
    
    return emailRegex.test(text) || phoneRegex.test(text) || ccRegex.test(text);
  }
}
```

### レート制限

```typescript
// src/guardrails/rateLimit.ts

export class RateLimiter {
  private requestCounts = new Map<string, number[]>();
  private limits = {
    perMinute: 10,
    perHour: 100,
    perDay: 500,
  };

  public checkLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId) || [];
    
    // 24時間以上前のリクエストを削除
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < 86400000
    );

    // 各時間枠でのチェック
    const lastMinute = recentRequests.filter(
      (t) => now - t < 60000
    ).length;
    const lastHour = recentRequests.filter(
      (t) => now - t < 3600000
    ).length;
    const lastDay = recentRequests.length;

    if (
      lastMinute >= this.limits.perMinute ||
      lastHour >= this.limits.perHour ||
      lastDay >= this.limits.perDay
    ) {
      return false;
    }

    // リクエストを記録
    recentRequests.push(now);
    this.requestCounts.set(userId, recentRequests);
    
    return true;
  }
}
```

## 2. セキュリティベストプラクティス

### APIキーの管理

1. **環境変数の使用**
   - APIキーはコードに直接記述しない
   - `.env`ファイルはgitignoreに追加

2. **キーローテーション**
   - 定期的にAPIキーを更新
   - 漏洩時の即座な無効化

3. **最小権限の原則**
   - 必要最小限のスコープのみ許可
   - 本番環境と開発環境で別のキーを使用

### データ保護

```typescript
// src/security/encryption.ts

import * as crypto from 'crypto';

export class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private secretKey: Buffer;

  constructor(secret: string) {
    this.secretKey = crypto.scryptSync(secret, 'salt', 32);
  }

  public encrypt(text: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.secretKey,
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
    };
  }

  public decrypt(
    encrypted: string,
    iv: string,
    authTag: string
  ): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

## 3. ロギングとモニタリング

```typescript
// src/logging/logger.ts

import * as fs from 'fs';
import * as path from 'path';

export class SecurityLogger {
  private logPath: string;

  constructor() {
    this.logPath = path.join(process.cwd(), 'logs', 'security.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public logSecurityEvent(event: {
    type: 'BLOCKED_REQUEST' | 'RATE_LIMIT' | 'INVALID_INPUT' | 'API_ERROR';
    userId?: string;
    details: any;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    fs.appendFileSync(
      this.logPath,
      JSON.stringify(logEntry) + '\n'
    );

    // 重要なイベントは即座にアラート
    if (event.type === 'API_ERROR' || event.type === 'BLOCKED_REQUEST') {
      this.sendAlert(logEntry);
    }
  }

  private sendAlert(logEntry: any) {
    // アラート通知の実装（メール、Slack等）
    console.error('SECURITY ALERT:', logEntry);
  }
}
```

## 4. コンテンツモデレーション

```typescript
// src/moderation/contentFilter.ts

export class ContentModerator {
  // OpenAI Moderation APIを使用した実装例
  public async moderateContent(text: string): Promise<{
    flagged: boolean;
    categories: string[];
  }> {
    try {
      // OpenAI Moderation APIを呼び出し
      const response = await fetch(
        'https://api.openai.com/v1/moderations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ input: text }),
        }
      );

      const result = await response.json();
      const flaggedCategories = Object.entries(
        result.results[0].categories
      )
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return {
        flagged: result.results[0].flagged,
        categories: flaggedCategories,
      };
    } catch (error) {
      console.error('Moderation API error:', error);
      // エラー時は安全側に倒す
      return { flagged: true, categories: ['error'] };
    }
  }
}
```

## 5. エラーハンドリング

```typescript
// src/errors/handler.ts

export class ErrorHandler {
  public handleError(error: any): {
    userMessage: string;
    logMessage: string;
    statusCode: number;
  } {
    // APIキーなどの機密情報を含まないエラーメッセージ
    const sanitizedError = this.sanitizeError(error);

    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return {
        userMessage: 'Request limit exceeded. Please try again later.',
        logMessage: `Rate limit exceeded: ${error.details}`,
        statusCode: 429,
      };
    }

    if (error.code === 'INVALID_INPUT') {
      return {
        userMessage: 'Invalid input provided. Please check your request.',
        logMessage: `Invalid input: ${sanitizedError}`,
        statusCode: 400,
      };
    }

    // デフォルトエラー
    return {
      userMessage: 'An error occurred processing your request.',
      logMessage: `Unexpected error: ${sanitizedError}`,
      statusCode: 500,
    };
  }

  private sanitizeError(error: any): string {
    // 機密情報を除去
    const sensitivePatterns = [
      /api[_-]?key["\s:=]+["']?[\w-]+["']?/gi,
      /bearer\s+[\w.-]+/gi,
      /password["\s:=]+["']?[^"'\s]+["']?/gi,
    ];

    let errorString = JSON.stringify(error);
    for (const pattern of sensitivePatterns) {
      errorString = errorString.replace(pattern, '[REDACTED]');
    }

    return errorString;
  }
}
```

## 6. コンプライアンスチェックリスト

- [ ] GDPR準拠（EU）
- [ ] CCPA準拠（カリフォルニア）
- [ ] 個人情報保護法準拠（日本）
- [ ] データ保持ポリシーの実装
- [ ] ユーザー同意管理
- [ ] データ削除機能
- [ ] 監査ログの実装
- [ ] セキュリティインシデント対応計画

## 7. デプロイメント時のセキュリティ

### Docker化

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

### セキュリティヘッダー

```typescript
// HTTPサーバーを使用する場合
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

## まとめ

これらのガードレールとセキュリティ対策を実装することで、Sora MCP Serverをより安全に運用できます。定期的なセキュリティ監査と更新を忘れずに行ってください。
