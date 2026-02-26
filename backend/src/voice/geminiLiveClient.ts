import { GoogleGenAI, Modality } from "@google/genai";

const DEFAULT_TRANSCRIBE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const DEFAULT_AUDIO_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const DEFAULT_VOICE_NAME = "Kore";

export interface GeminiLiveClientOptions {
  apiKey: string;
  transcriptionModel?: string;
  audioModel?: string;
  voiceName?: string;
}

export interface AudioInput {
  audioBuffer: Buffer;
  mimeType: string;
}

export interface TextToSpeechResult {
  audioBuffer: Buffer;
  mimeType: string;
}

type LiveServerMessage = {
  serverContent?: {
    turnComplete?: boolean;
    inputTranscription?: {
      text?: string;
    };
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          data?: unknown;
          mimeType?: string;
        };
      }>;
    };
  };
  text?: string;
  data?: unknown;
};

export class GeminiLiveClient {
  private readonly client: GoogleGenAI;
  private readonly transcriptionModel: string;
  private readonly audioModel: string;
  private readonly voiceName: string;

  constructor(options: GeminiLiveClientOptions) {
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
    this.transcriptionModel = options.transcriptionModel ?? DEFAULT_TRANSCRIBE_MODEL;
    this.audioModel = options.audioModel ?? DEFAULT_AUDIO_MODEL;
    this.voiceName = options.voiceName ?? DEFAULT_VOICE_NAME;
  }

  async transcribeAudio(input: AudioInput): Promise<string> {
    const { session, responseQueue } = await this.connectSession(this.transcriptionModel, {
      responseModalities: [Modality.TEXT],
      inputAudioTranscription: {}
    });

    try {
      const base64Audio = input.audioBuffer.toString("base64");
      await session.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: input.mimeType
        }
      });
      await session.sendRealtimeInput({ audioStreamEnd: true });

      const messages = await this.collectTurn(responseQueue);
      const transcriptParts: string[] = [];

      for (const message of messages) {
        const inputText = message.serverContent?.inputTranscription?.text;
        if (inputText) {
          transcriptParts.push(inputText);
          continue;
        }
        if (message.text) {
          transcriptParts.push(message.text);
        }
      }

      return transcriptParts.join("").trim();
    } finally {
      session.close();
    }
  }

  async textToSpeech(text: string): Promise<TextToSpeechResult> {
    const { session, responseQueue } = await this.connectSession(this.audioModel, {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: this.voiceName
          }
        }
      }
    });

    try {
      await session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text }]
          }
        ],
        turnComplete: true
      });

      const messages = await this.collectTurn(responseQueue);
      const audioChunks: Buffer[] = [];
      let mimeType = "audio/pcm;rate=24000";

      for (const message of messages) {
        const parts = message.serverContent?.modelTurn?.parts ?? [];
        for (const part of parts) {
          if (!part.inlineData) {
            continue;
          }
          if (part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          const decoded = this.decodeInlineData(part.inlineData.data);
          if (decoded.length > 0) {
            audioChunks.push(decoded);
          }
        }
      }

      return {
        audioBuffer: Buffer.concat(audioChunks),
        mimeType
      };
    } finally {
      session.close();
    }
  }

  private async connectSession(model: string, config: Record<string, unknown>): Promise<{
    session: {
      sendRealtimeInput: (input: Record<string, unknown>) => Promise<void>;
      sendClientContent: (content: Record<string, unknown>) => Promise<void>;
      close: () => void;
    };
    responseQueue: LiveServerMessage[];
  }> {
    const responseQueue: LiveServerMessage[] = [];

    const session = await this.client.live.connect({
      model,
      config,
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          responseQueue.push(message);
        },
        onerror: (error: unknown) => {
          responseQueue.push({ text: "", data: error });
        }
      }
    });

    return { session, responseQueue };
  }

  private async collectTurn(responseQueue: LiveServerMessage[]): Promise<LiveServerMessage[]> {
    const messages: LiveServerMessage[] = [];
    const startedAt = Date.now();
    const maxWaitMs = 15000;
    const idleMs = 350;
    let lastMessageAt = startedAt;

    while (Date.now() - startedAt < maxWaitMs) {
      const message = await this.waitForMessage(responseQueue, 200);
      if (message) {
        messages.push(message);
        lastMessageAt = Date.now();
        if (message.serverContent?.turnComplete) {
          break;
        }
      } else if (messages.length > 0 && Date.now() - lastMessageAt > idleMs) {
        break;
      }
    }

    return messages;
  }

  private waitForMessage(
    responseQueue: LiveServerMessage[],
    timeoutMs: number
  ): Promise<LiveServerMessage | null> {
    if (responseQueue.length > 0) {
      return Promise.resolve(responseQueue.shift() ?? null);
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (responseQueue.length > 0) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(responseQueue.shift() ?? null);
        }
      }, 25);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, timeoutMs);
    });
  }

  private decodeInlineData(data: unknown): Buffer {
    if (!data) {
      return Buffer.alloc(0);
    }

    if (Buffer.isBuffer(data)) {
      return data;
    }

    if (data instanceof Uint8Array) {
      return Buffer.from(data);
    }

    if (typeof data === "string") {
      return Buffer.from(data, "base64");
    }

    if (typeof data === "object" && data !== null && "data" in data) {
      const nested = (data as { data?: unknown }).data;
      return this.decodeInlineData(nested);
    }

    return Buffer.alloc(0);
  }
}
