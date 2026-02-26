import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadAppEnv } from "./config/env.js";
import { createSocketServer } from "./socket/socketServer.js";

const env = loadAppEnv();
const port = env.port;

const { app, services } = createApp(env);
const httpServer = createServer(app);
createSocketServer({
  httpServer,
  auth: services.auth,
  cragPipeline: services.cragPipeline,
  subjectRepository: services.subjectRepository
});

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AskMyNotes backend listening on port ${port}`);
});
