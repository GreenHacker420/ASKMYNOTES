import { Router } from "express";
import type { AskController } from "../controllers/AskController";

export function createAskRoutes(controller: AskController): Router {
  const router = Router();
  router.post("/ask", controller.ask);
  return router;
}
