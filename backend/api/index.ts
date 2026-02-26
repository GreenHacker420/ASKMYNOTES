import { createApp } from "../src/app";
import { loadAppEnv } from "../src/config/env";

const env = loadAppEnv();
const { app } = createApp(env);

export default app;
