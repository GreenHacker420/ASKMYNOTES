import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
import type { ILLMClient } from "../../interfaces/llmClient";
import { GeminiNativeSdkClient } from "./GeminiNativeSdkClient";

export interface GeminiLangChainClientOptions {
  apiKey: string;
  model: string;
  temperature?: number;
  maxRetries?: number;
}

export class GeminiLangChainClient implements ILLMClient {
  private readonly model: ChatGoogleGenerativeAI;
  private readonly nativeClient: GeminiNativeSdkClient;
  private readonly teacherSuffix =
    "\n\nAs a teacher, end with a short check-in question like: \"Did that make sense?\"";

  constructor(options: GeminiLangChainClientOptions) {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: options.apiKey,
      model: options.model,
      temperature: options.temperature ?? 0,
      maxRetries: options.maxRetries ?? 2
    });

    this.nativeClient = new GeminiNativeSdkClient({
      apiKey: options.apiKey,
      model: options.model
    });
  }

  async invoke(messages: Array<["system" | "human", string]>): Promise<string> {
    const prompt = messages
      .map(([role, content]) => `${role.toUpperCase()}:\n${content}`)
      .join("\n\n");

    const response = await this.model.invoke(`${prompt}${this.teacherSuffix}`);

    if (typeof response.content === "string") {
      return response.content;
    }

    const normalized = response.content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("\n")
      .trim();

    if (normalized.length > 0) {
      return normalized;
    }

    return this.nativeClient.generateContent(`${prompt}${this.teacherSuffix}`);
  }
}
