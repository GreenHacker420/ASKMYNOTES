import type { NextFunction, Request, RequestHandler, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import type { BetterAuthInstance } from "./auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
  authSession?: unknown;
}

export function createRequireAuth(auth: BetterAuthInstance): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionResult = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
      });

      if (!sessionResult || !("session" in sessionResult) || !sessionResult.session) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const typedReq = req as AuthenticatedRequest;
      typedReq.authSession = sessionResult.session;
      typedReq.authUser = "user" in sessionResult ? sessionResult.user : undefined;

      next();
    } catch (error) {
      next(error);
    }
  };
}
