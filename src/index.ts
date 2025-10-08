#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
import FormData from "form-data";

// Load environment variables
dotenv.config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_BASE = "https://api.openai.com/v1";

// Enhanced interfaces for Sora 2 features
interface VideoGenerationParams {
  prompt: string;
  size?: string;  // e.g., "720x1280", "1920x1080"
  seconds?: number;
  model?: string;
}

interface RemixParams {
  video_id: string;
  prompt: string;
}

interface VideoResponse {
  id: string;
  status: string;
  created_at?: string;
  progress?: number;
  error?: {
    message: string;
  };
}

export class SoraMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "sora-mcp-server",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "generate_video",
          description: "Generate a video using OpenAI Sora 2 model with text prompt. Uses sora-2 model by default.",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Text description of the video to generate",
              },
              size: {
                type: "string",
                description: "Video size (e.g., '720x1280' for 9:16, '1920x1080' for 16:9, '1080x1080' for 1:1). Default: '1920x1080'",
                default: "1920x1080",
              },
              seconds: {
                type: "number",
                description: "Duration in seconds (4-20 for sora-2)",
                default: 5,
              },
              model: {
                type: "string",
                description: "Model to use: 'sora-2' (default) or 'sora-2-pro' (note: pro model may experience delays)",
                enum: ["sora-2", "sora-2-pro"],
                default: "sora-2",
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "generate_video_with_reference",
          description: "Generate a video using a reference image. The image will be animated according to the prompt.",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "Text description of how to animate the image",
              },
              reference_image: {
                type: "string",
                description: "Absolute path to reference image file (PNG, JPG, etc.)",
              },
              size: {
                type: "string",
                description: "Video size. Default: '1920x1080'",
                default: "1920x1080",
              },
              seconds: {
                type: "number",
                description: "Duration in seconds",
                default: 5,
              },
              model: {
                type: "string",
                description: "Model to use",
                enum: ["sora-2", "sora-2-pro"],
                default: "sora-2",
              },
            },
            required: ["prompt", "reference_image"],
          },
        },
        {
          name: "remix_video",
          description: "Remix an existing video with a new prompt while maintaining visual consistency",
          inputSchema: {
            type: "object",
            properties: {
              video_id: {
                type: "string",
                description: "ID of the video to remix",
              },
              prompt: {
                type: "string",
                description: "New prompt for remixing the video",
              },
            },
            required: ["video_id", "prompt"],
          },
        },
        {
          name: "retrieve_video",
          description: "Retrieve the status and details of a video generation job",
          inputSchema: {
            type: "object",
            properties: {
              video_id: {
                type: "string",
                description: "The video ID to retrieve",
              },
            },
            required: ["video_id"],
          },
        },
        {
          name: "list_videos",
          description: "List all recent videos",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of videos to return (default: 10)",
                default: 10,
              },
            },
          },
        },
        {
          name: "download_video",
          description: "Download a completed video to local storage",
          inputSchema: {
            type: "object",
            properties: {
              video_id: {
                type: "string",
                description: "ID of the video to download",
              },
              output_path: {
                type: "string",
                description: "Local path to save the video (e.g., '/Users/yugo/claude/output/video.mp4')",
              },
            },
            required: ["video_id", "output_path"],
          },
        },
        {
          name: "list_presets",
          description: "List available video generation presets and best practices",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "generate_video":
            return await this.generateVideo(args as unknown as VideoGenerationParams);
          
          case "generate_video_with_reference":
            return await this.generateVideoWithReference(args as any);
          
          case "remix_video":
            return await this.remixVideo(args as unknown as RemixParams);
          
          case "retrieve_video":
            if (!args || typeof args !== 'object' || !('video_id' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "video_id is required");
            }
            return await this.retrieveVideo(args.video_id as string);
          
          case "list_videos":
            return await this.listVideos(args?.limit as number | undefined);
          
          case "download_video":
            if (!args || typeof args !== 'object' || !('video_id' in args) || !('output_path' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "video_id and output_path are required");
            }
            return await this.downloadVideo(
              args.video_id as string,
              args.output_path as string
            );
          
          case "list_presets":
            return await this.listPresets();
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error: any) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  private async generateVideo(params: VideoGenerationParams) {
    try {
      if (!OPENAI_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: "Error: OPENAI_API_KEY not configured. Please set OPENAI_API_KEY environment variable.",
            },
          ],
        };
      }

      const url = `${OPENAI_API_BASE}/videos`;
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      };

      const requestBody = {
        model: params.model || "sora-2",
        prompt: params.prompt,
        size: params.size || "1920x1080",
        seconds: String(params.seconds || 5),
      };

      console.error(`Creating video with params:`, JSON.stringify(requestBody, null, 2));

      const response = await axios.post(url, requestBody, { headers });
      const video: VideoResponse = response.data;

      return {
        content: [
          {
            type: "text",
            text: `Video generation started successfully!\n\nVideo ID: ${video.id}\nStatus: ${video.status}\n\nPrompt: "${params.prompt}"\nModel: ${params.model || 'sora-2'}\nSize: ${params.size || '1920x1080'}\nDuration: ${params.seconds || 5} seconds\n\nUse 'retrieve_video' with video ID "${video.id}" to check progress.\n\nNote: Video generation typically takes 1-3 minutes.`,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : '';
      
      return {
        content: [
          {
            type: "text",
            text: `Error generating video: ${errorMessage}\n\n${errorDetails ? `Details:\n${errorDetails}` : ''}`,
          },
        ],
      };
    }
  }

  private async generateVideoWithReference(params: any) {
    try {
      if (!OPENAI_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: "Error: OPENAI_API_KEY not configured.",
            },
          ],
        };
      }

      // Read reference image
      const imagePath = params.reference_image;
      if (!imagePath) {
        throw new Error("reference_image path is required");
      }

      const imageBuffer = await fs.readFile(imagePath);
      
      const url = `${OPENAI_API_BASE}/videos`;
      
      const formData = new FormData();
      formData.append("model", params.model || "sora-2");
      formData.append("prompt", params.prompt);
      formData.append("size", params.size || "1920x1080");
      formData.append("seconds", String(params.seconds || 5));
      formData.append("input_reference", imageBuffer, {
        filename: path.basename(imagePath),
        contentType: "image/jpeg",
      });

      const headers = {
        ...formData.getHeaders(),
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      };

      console.error(`Creating video with reference image: ${imagePath}`);

      const response = await axios.post(url, formData, { headers });
      const video: VideoResponse = response.data;

      return {
        content: [
          {
            type: "text",
            text: `Video generation with reference started!\n\nVideo ID: ${video.id}\nStatus: ${video.status}\n\nReference Image: ${imagePath}\nPrompt: "${params.prompt}"\nModel: ${params.model || 'sora-2'}\nSize: ${params.size || '1920x1080'}\nDuration: ${params.seconds || 5} seconds\n\nUse 'retrieve_video' with video ID "${video.id}" to check progress.`,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return {
        content: [
          {
            type: "text",
            text: `Error generating video with reference: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async remixVideo(params: RemixParams) {
    try {
      if (!OPENAI_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: "Error: OPENAI_API_KEY not configured.",
            },
          ],
        };
      }

      const url = `${OPENAI_API_BASE}/videos/remix`;
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      };

      const requestBody = {
        video_id: params.video_id,
        prompt: params.prompt,
      };

      console.error(`Remixing video ${params.video_id} with new prompt: ${params.prompt}`);

      const response = await axios.post(url, requestBody, { headers });
      const video: VideoResponse = response.data;

      return {
        content: [
          {
            type: "text",
            text: `Video remix started!\n\nNew Video ID: ${video.id}\nStatus: ${video.status}\n\nOriginal Video: ${params.video_id}\nNew Prompt: "${params.prompt}"\n\nUse 'retrieve_video' with video ID "${video.id}" to check progress.`,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return {
        content: [
          {
            type: "text",
            text: `Error remixing video: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async retrieveVideo(videoId: string) {
    try {
      if (!OPENAI_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: "Error: OPENAI_API_KEY not configured.",
            },
          ],
        };
      }

      const url = `${OPENAI_API_BASE}/videos/${videoId}`;
      const headers = {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      };

      const response = await axios.get(url, { headers });
      const video: VideoResponse = response.data;

      let statusText = `Video ID: ${video.id}\nStatus: ${video.status}`;
      
      if (video.created_at) {
        statusText += `\nCreated: ${video.created_at}`;
      }
      
      if (video.progress !== undefined) {
        statusText += `\nProgress: ${video.progress}%`;
      }

      if (video.status === "completed") {
        statusText += "\n\n✓ Video generation completed!";
        statusText += `\n\nUse 'download_video' with video ID "${videoId}" to save the video locally.`;
      } else if (video.status === "failed") {
        const errorMsg = video.error?.message || "Unknown error";
        statusText += `\n\n✗ Video generation failed: ${errorMsg}`;
      } else if (video.status === "in_progress" || video.status === "queued") {
        statusText += "\n\n⏳ Video is still processing. Check again in a few moments.";
      }

      return {
        content: [
          {
            type: "text",
            text: statusText,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving video status: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async listVideos(limit?: number) {
    try {
      if (!OPENAI_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: "Error: OPENAI_API_KEY not configured.",
            },
          ],
        };
      }

      const url = `${OPENAI_API_BASE}/videos`;
      const headers = {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      };

      const params = {
        limit: limit || 10,
      };

      const response = await axios.get(url, { headers, params });
      const videos = response.data.data || [];

      if (videos.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No videos found.",
            },
          ],
        };
      }

      let videosList = `Found ${videos.length} video(s):\n\n`;
      videos.forEach((video: VideoResponse, index: number) => {
        videosList += `${index + 1}. Video ID: ${video.id}\n`;
        videosList += `   Status: ${video.status}\n`;
        if (video.created_at) {
          videosList += `   Created: ${video.created_at}\n`;
        }
        videosList += '\n';
      });

      videosList += "Use 'retrieve_video' to get details about a specific video.";

      return {
        content: [
          {
            type: "text",
            text: videosList,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return {
        content: [
          {
            type: "text",
            text: `Error listing videos: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async downloadVideo(videoId: string, outputPath: string) {
    try {
      if (!OPENAI_API_KEY) {
        return {
          content: [
            {
              type: "text",
              text: "Error: OPENAI_API_KEY not configured.",
            },
          ],
        };
      }

      // First, retrieve video to check status
      const videoUrl = `${OPENAI_API_BASE}/videos/${videoId}`;
      const headers = {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      };

      const videoResponse = await axios.get(videoUrl, { headers });
      const video: any = videoResponse.data;

      if (video.status !== "completed") {
        return {
          content: [
            {
              type: "text",
              text: `Cannot download video. Current status: ${video.status}\n\nPlease wait for the video to complete generation.`,
            },
          ],
        };
      }

      // Download content
      const downloadUrl = `${OPENAI_API_BASE}/videos/${videoId}/content`;
      const downloadResponse = await axios.get(downloadUrl, {
        headers,
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(downloadResponse.data);
      const fullPath = path.resolve(outputPath);
      
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);

      return {
        content: [
          {
            type: "text",
            text: `Video downloaded successfully!\n\nSaved to: ${fullPath}\nFile size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      return {
        content: [
          {
            type: "text",
            text: `Error downloading video: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private async listPresets() {
    const presets = {
      "Cinematic": {
        prompt_tips: "Use 'cinematic shot', 'dramatic lighting', 'wide angle'",
        recommended_settings: { seconds: 10, size: "1920x1080" },
      },
      "Social Media": {
        prompt_tips: "Use 'vertical format', 'engaging', 'dynamic movement'",
        recommended_settings: { seconds: 15, size: "720x1280" },
      },
      "Product Demo": {
        prompt_tips: "Use 'clean background', 'product focus', 'smooth rotation'",
        recommended_settings: { seconds: 5, size: "1080x1080" },
      },
      "Animation": {
        prompt_tips: "Use 'animated style', 'cartoon', 'vibrant colors'",
        recommended_settings: { seconds: 20, size: "1920x1080" },
      },
    };

    let presetsText = "Available Video Generation Presets:\n\n";
    for (const [name, details] of Object.entries(presets)) {
      presetsText += `${name}:\n`;
      presetsText += `  Prompt tips: ${details.prompt_tips}\n`;
      presetsText += `  Recommended: ${JSON.stringify(details.recommended_settings)}\n\n`;
    }

    presetsText += "Best Practices:\n";
    presetsText += "1. Be specific and descriptive in your prompts\n";
    presetsText += "2. Include style references (cinematic, realistic, animated)\n";
    presetsText += "3. Specify camera movements if needed\n";
    presetsText += "4. Mention lighting and atmosphere details\n";
    presetsText += "5. Keep prompts under 500 characters for best results\n\n";
    presetsText += "Recommended Video Sizes:\n";
    presetsText += "- 16:9 (horizontal): 1920x1080\n";
    presetsText += "- 9:16 (vertical): 720x1280\n";
    presetsText += "- 1:1 (square): 1080x1080\n\n";
    presetsText += "Models:\n";
    presetsText += "- sora-2: Standard model (recommended, reliable)\n";
    presetsText += "- sora-2-pro: Higher quality but may experience delays";

    return {
      content: [
        {
          type: "text",
          text: presetsText,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Sora MCP Server v2.0 running on stdio transport");
  }
}

// Start the server
const server = new SoraMCPServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
