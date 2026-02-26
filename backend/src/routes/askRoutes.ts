import { Router, type RequestHandler } from "express";
import type { AskController } from "../controllers/AskController";

export function createAskRoutes(
  controller: AskController,
  requireAuth: RequestHandler
): Router {
  const router = Router();
  router.post("/ask", requireAuth, controller.ask);
  return router;
}
