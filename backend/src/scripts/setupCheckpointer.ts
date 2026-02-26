import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"; // Docs: https://docs.langchain.com/oss/javascript/langgraph/add-memory
import { loadEnv } from "../config/env";

async function main(): Promise<void> {
  const env = loadEnv();

  const checkpointer = PostgresSaver.fromConnString(env.databaseUrl, {
    schema: "public"
  });

  await checkpointer.setup();
  await checkpointer.end();

  console.log("LangGraph Postgres checkpointer tables are ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
