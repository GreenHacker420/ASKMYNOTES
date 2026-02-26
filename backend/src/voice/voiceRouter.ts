import express, { Router, type RequestHandler } from "express";
import type { VoiceController } from "./voiceController";

export interface VoiceControllers {
  voiceController: VoiceController;
}

export function createVoiceRouter(
  controllers: VoiceControllers,
  requireAuth: RequestHandler
): Router {
  const router = Router();

  const rawAudioParser = express.raw({
    type: ["audio/*", "application/octet-stream"],
    limit: "25mb"
  });

  router.post("/query", requireAuth, rawAudioParser, controllers.voiceController.query);
  router.post("/speak", requireAuth, controllers.voiceController.speak);

  return router;
}
