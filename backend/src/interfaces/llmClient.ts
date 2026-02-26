export interface ILLMClient {
  invoke(messages: Array<["system" | "human", string]>): Promise<string>;
}
