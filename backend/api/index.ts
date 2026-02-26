import type { Request, Response } from "express";
import { createApp } from "../src/app";
import { loadAppEnv } from "../src/config/env";

let handler: ReturnType<typeof createApp>["app"] | null = null;
let initError: Error | null = null;

try {
    const env = loadAppEnv();
    const { app } = createApp(env);
    handler = app;
} catch (err) {
    console.error("Failed to initialize app:", err);
    initError = err instanceof Error ? err : new Error(String(err));
}

export default function serverlessHandler(req: Request, res: Response) {
    if (initError || !handler) {
        res.status(500).json({
            error: "Server initialization failed",
            message: initError?.message ?? "Unknown error"
        });
        return;
    }
    return handler(req, res);
}
