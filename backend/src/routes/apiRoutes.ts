import { Router, type RequestHandler } from "express";
import type { AskController } from "../controllers/AskController";
import type { IngestionController } from "../controllers/IngestionController";
import type { MeController } from "../controllers/MeController";
import type { SubjectController } from "../controllers/SubjectController";
import type { QuizController } from "../controllers/QuizController";

export interface ApiControllers {
  askController: AskController;
  subjectController: SubjectController;
  ingestionController: IngestionController;
  quizController: QuizController;
  meController: MeController;
}

export function createApiRoutes(
  controllers: ApiControllers,
  requireAuth: RequestHandler,

): Router {
  const router = Router();

  router.get("/subjects", requireAuth, controllers.subjectController.list);
  router.post("/subjects", requireAuth, controllers.subjectController.create);
  router.get("/subjects/:subjectId/files", requireAuth, controllers.subjectController.listFiles);
  router.post(
    "/subjects/:subjectId/files",
    requireAuth,
    controllers.ingestionController.uploadFile
  );
  router.post("/subjects/:subjectId/quiz", requireAuth, controllers.quizController.generateQuiz);

  router.get("/me", requireAuth, controllers.meController.me);
  router.post("/ask", requireAuth, controllers.askController.ask);
  router.post("/ask/stream", requireAuth, controllers.askController.askStream);

  return router;
}
