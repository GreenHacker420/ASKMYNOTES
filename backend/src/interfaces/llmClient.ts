export interface ILLMClient {
  invoke(messages: Array<["system" | "human", string]>): Promise<string>;
  invokeStream(messages: Array<["system" | "human", string]>): AsyncGenerator<string, void, unknown>;
}
