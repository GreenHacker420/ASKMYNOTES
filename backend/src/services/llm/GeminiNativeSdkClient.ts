import { GoogleGenAI } from "@google/genai";

export interface GeminiNativeSdkClientOptions {
  apiKey: string;
  model: string;
}

export class GeminiNativeSdkClient {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(options: GeminiNativeSdkClientOptions) {
    this.model = options.model;
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt
    });

    return response.text ?? "";
  }
}
