import { createApp } from "./app";
import { loadEnv } from "./config/env";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const { app, stop } = createApp(env);

  const server = app.listen(env.port, () => {
    console.log(`AskMyNotes backend listening on port ${env.port}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await stop();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
