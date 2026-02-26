import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../services/auth/requireAuth";

export class MeController {
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const typedReq = req as AuthenticatedRequest;
      const user = typedReq.authUser;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
