// src/utils/validation.ts

import * as path from "path";
import * as fs from "fs/promises";

export class FileValidator {
  // サポートされる画像形式
  private static readonly SUPPORTED_IMAGE_FORMATS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tiff",
  ];

  // サポートされる動画形式
  private static readonly SUPPORTED_VIDEO_FORMATS = [
    ".mp4",
    ".mov",
    ".avi",
    ".webm",
    ".mkv",
    ".m4v",
    ".wmv",
  ];

  // 最大ファイルサイズ（バイト）
  private static readonly MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
  private static readonly MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

  /**
   * ファイルが存在し、読み取り可能かチェック
   */
  public static async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ファイルサイズをチェック
   */
  public static async checkFileSize(
    filePath: string,
    maxSize: number
  ): Promise<{ valid: boolean; size: number }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        valid: stats.size <= maxSize,
        size: stats.size,
      };
    } catch {
      return {
        valid: false,
        size: 0,
      };
    }
  }

  /**
   * 画像ファイルの検証
   */
  public static async validateImageFile(filePath: string): Promise<{
    valid: boolean;
    error?: string;
    metadata?: {
      extension: string;
      size: number;
    };
  }> {
    // ファイル存在確認
    if (!(await this.checkFileExists(filePath))) {
      return {
        valid: false,
        error: `File not found: ${filePath}`,
      };
    }

    // 拡張子チェック
    const ext = path.extname(filePath).toLowerCase();
    if (!this.SUPPORTED_IMAGE_FORMATS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported image format: ${ext}. Supported formats: ${this.SUPPORTED_IMAGE_FORMATS.join(
          ", "
        )}`,
      };
    }

    // ファイルサイズチェック
    const sizeCheck = await this.checkFileSize(filePath, this.MAX_IMAGE_SIZE);
    if (!sizeCheck.valid) {
      return {
        valid: false,
        error: `Image file too large: ${(sizeCheck.size / 1024 / 1024).toFixed(
          2
        )}MB. Maximum size: ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      };
    }

    return {
      valid: true,
      metadata: {
        extension: ext,
        size: sizeCheck.size,
      },
    };
  }

  /**
   * 動画ファイルの検証
   */
  public static async validateVideoFile(filePath: string): Promise<{
    valid: boolean;
    error?: string;
    metadata?: {
      extension: string;
      size: number;
    };
  }> {
    // ファイル存在確認
    if (!(await this.checkFileExists(filePath))) {
      return {
        valid: false,
        error: `File not found: ${filePath}`,
      };
    }

    // 拡張子チェック
    const ext = path.extname(filePath).toLowerCase();
    if (!this.SUPPORTED_VIDEO_FORMATS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported video format: ${ext}. Supported formats: ${this.SUPPORTED_VIDEO_FORMATS.join(
          ", "
        )}`,
      };
    }

    // ファイルサイズチェック
    const sizeCheck = await this.checkFileSize(filePath, this.MAX_VIDEO_SIZE);
    if (!sizeCheck.valid) {
      return {
        valid: false,
        error: `Video file too large: ${(sizeCheck.size / 1024 / 1024).toFixed(
          2
        )}MB. Maximum size: ${this.MAX_VIDEO_SIZE / 1024 / 1024}MB`,
      };
    }

    return {
      valid: true,
      metadata: {
        extension: ext,
        size: sizeCheck.size,
      },
    };
  }

  /**
   * MIMEタイプを推測
   */
  public static getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".tiff": "image/tiff",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".webm": "video/webm",
      ".mkv": "video/x-matroska",
      ".m4v": "video/x-m4v",
      ".wmv": "video/x-ms-wmv",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * ビデオ生成パラメータの検証
   */
  public static validateVideoParams(params: {
    n_seconds?: number;
    width?: number;
    height?: number;
    aspect_ratio?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 時間の検証
    if (
      params.n_seconds !== undefined &&
      (params.n_seconds < 5 || params.n_seconds > 20)
    ) {
      errors.push("Video duration must be between 5 and 20 seconds");
    }

    // 解像度の検証
    if (params.width !== undefined) {
      if (params.width < 256 || params.width > 1920) {
        errors.push("Width must be between 256 and 1920 pixels");
      }
      if (params.width % 8 !== 0) {
        errors.push("Width must be divisible by 8");
      }
    }

    if (params.height !== undefined) {
      if (params.height < 256 || params.height > 1080) {
        errors.push("Height must be between 256 and 1080 pixels");
      }
      if (params.height % 8 !== 0) {
        errors.push("Height must be divisible by 8");
      }
    }

    // アスペクト比の検証
    const validAspectRatios = ["16:9", "1:1", "9:16", "4:3", "3:4"];
    if (
      params.aspect_ratio &&
      !validAspectRatios.includes(params.aspect_ratio)
    ) {
      errors.push(
        `Invalid aspect ratio. Valid options: ${validAspectRatios.join(", ")}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * プロンプトの検証
   */
  public static validatePrompt(prompt: string): {
    valid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const warnings: string[] = [];

    // 長さチェック
    if (prompt.length < 3) {
      return {
        valid: false,
        error: "Prompt is too short. Minimum 3 characters required.",
      };
    }

    if (prompt.length > 1000) {
      return {
        valid: false,
        error: "Prompt is too long. Maximum 1000 characters allowed.",
      };
    }

    // 警告チェック
    if (prompt.length < 20) {
      warnings.push(
        "Short prompts may produce less specific results. Consider adding more detail."
      );
    }

    if (prompt.length > 500) {
      warnings.push(
        "Very long prompts may be less effective. Consider focusing on key elements."
      );
    }

    // 特殊文字の警告
    if (/[<>{}\\]/.test(prompt)) {
      warnings.push(
        "Special characters detected. These may be interpreted literally."
      );
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * ビデオIDの検証
   */
  public static validateVideoId(videoId: string): boolean {
    // 基本的な形式チェック（英数字とハイフン、アンダースコア）
    const pattern = /^[a-zA-Z0-9_-]+$/;
    return pattern.test(videoId) && videoId.length >= 3 && videoId.length <= 100;
  }

  /**
   * Blendウェイトの検証
   */
  public static validateBlendWeights(
    weights: number[],
    videoCount: number
  ): { valid: boolean; error?: string } {
    if (weights.length !== videoCount) {
      return {
        valid: false,
        error: `Number of weights (${weights.length}) must match number of videos (${videoCount})`,
      };
    }

    const sum = weights.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      return {
        valid: false,
        error: `Weights must sum to 1.0 (current sum: ${sum})`,
      };
    }

    for (const weight of weights) {
      if (weight < 0 || weight > 1) {
        return {
          valid: false,
          error: "Each weight must be between 0 and 1",
        };
      }
    }

    return { valid: true };
  }
}

// エクスポート
export default FileValidator;