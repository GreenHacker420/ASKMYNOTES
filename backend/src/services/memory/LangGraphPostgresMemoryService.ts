import { entrypoint, getPreviousState } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"; 
import type { IMemoryService } from "../../interfaces/memory";
import type { MemoryTurn } from "../../types/crag";

type MemoryCommand =
  | { action: "load" }
  | { action: "append"; turn: MemoryTurn };

export interface LangGraphPostgresMemoryServiceOptions {
  connectionString: string;
  autoSetup?: boolean;
  schema?: string;
  maxTurns?: number;
}

export class LangGraphPostgresMemoryService implements IMemoryService {
  private readonly checkpointer: PostgresSaver;
  private readonly autoSetup: boolean;
  private readonly maxTurns: number;
  private initialized = false;
  private readonly workflow;

  constructor(options: LangGraphPostgresMemoryServiceOptions) {
    this.checkpointer = PostgresSaver.fromConnString(options.connectionString, {
      schema: options.schema ?? "public"
    });

    this.autoSetup = options.autoSetup ?? true;
    this.maxTurns = options.maxTurns ?? 20;

    this.workflow = entrypoint<MemoryCommand, MemoryTurn[]>({
      name: "askmynotes_thread_memory",
      checkpointer: this.checkpointer
    },(input) => {
      const previous = getPreviousState<MemoryTurn[]>() ?? [];

      if (input.action === "load") {
        return previous;
      }

      const updated = [...previous, input.turn].slice(-this.maxTurns);
      return updated;
    });
  }

  async loadThreadMemory(threadId: string): Promise<MemoryTurn[]> {
    await this.ensureInitialized();

    const memory = await this.workflow.invoke(
      { action: "load" },
      { configurable: { thread_id: threadId } }
    );

    return Array.isArray(memory) ? memory : [];
  }

  async appendThreadMemory(threadId: string, turn: MemoryTurn): Promise<void> {
    await this.ensureInitialized();

    await this.workflow.invoke(
      { action: "append", turn },
      { configurable: { thread_id: threadId } }
    );
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.autoSetup) {

      await this.checkpointer.setup();
    }

    this.initialized = true;
  }
}
