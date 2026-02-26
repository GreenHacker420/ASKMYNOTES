import type { MemoryTurn } from "../types/crag";

export interface IMemoryService {
  loadThreadMemory(threadId: string): Promise<MemoryTurn[]>;
  appendThreadMemory(threadId: string, turn: MemoryTurn): Promise<void>;
}
