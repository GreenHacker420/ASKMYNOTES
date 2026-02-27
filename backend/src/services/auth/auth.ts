import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "../../../generated/prisma/client";
import { renderVerificationEmail, renderResetPasswordEmail } from "./email/EmailTemplateRenderer";
import { SmtpEmailSender } from "./email/SmtpEmailSender";

export interface BetterAuthEnv {
  betterAuthSecret: string;
  betterAuthUrl: string;
  betterAuthTrustedOrigins: string[];
  frontendUrl?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  googleOauthClientId?: string;
  googleOauthClientSecret?: string;
  resendApiKey?: string;
}

export function createBetterAuth(prisma: PrismaClient, env: BetterAuthEnv) {
  const hasSmtpCredentials =
    (env.smtpUser.trim().length > 0 &&
      env.smtpPass.trim().length > 0) || !!env.resendApiKey;

  const smtpSender = hasSmtpCredentials
    ? new SmtpEmailSender({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      user: env.smtpUser,
      pass: env.smtpPass,
      from: env.smtpFrom,
      resendApiKey: env.resendApiKey
    })
    : null;

  const socialProviders =
    env.googleOauthClientId && env.googleOauthClientSecret
      ? {
        google: {
          clientId: env.googleOauthClientId,
          clientSecret: env.googleOauthClientSecret
        }
      }
      : undefined;

  const trustedOrigins = new Set(env.betterAuthTrustedOrigins);
  trustedOrigins.add("https://askmynotes-4ro5.vercel.app");
  trustedOrigins.add("https://askmynotes-backend.onrender.com");

  const dispatchEmail = (send: () => Promise<void>, context: string) => {
    void send().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[auth-email] Failed to send ${context}: ${message}`);
    });
  };

  const baseAuthUrl = "https://askmynotes-4ro5.vercel.app/api/auth";

  return betterAuth({
    secret: env.betterAuthSecret,
    baseURL: baseAuthUrl,
    trustedOrigins: Array.from(trustedOrigins),
    database: prismaAdapter(prisma, {
      provider: "postgresql"
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (!smtpSender) {
          console.warn(`SMTP credentials missing. Reset URL for ${user.email}: ${url}`);
          return;
        }

        const rendered = await renderResetPasswordEmail({
          appName: "AskMyNotes",
          userName: user.name,
          resetUrl: url
        });

        dispatchEmail(
          () =>
            smtpSender.sendMail({
              to: user.email,
              subject: "Reset your AskMyNotes password",
              html: rendered.html,
              text: rendered.text
            }),
          `reset email to ${user.email}`
        );
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (!smtpSender) {
          console.warn(`SMTP credentials missing. Verification URL for ${user.email}: ${url}`);
          return;
        }

        const rendered = await renderVerificationEmail({
          appName: "AskMyNotes",
          userName: user.name,
          verificationUrl: url
        });

        dispatchEmail(
          () =>
            smtpSender.sendMail({
              to: user.email,
              subject: "Verify your AskMyNotes email",
              html: rendered.html,
              text: rendered.text
            }),
          `verification email to ${user.email}`
        );
      }
    },
    ...(socialProviders ? { socialProviders } : {}),
    advanced: {
      crossSubDomainCookies: {
        enabled: true
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true
      }
    }
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
