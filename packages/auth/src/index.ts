import { createDb } from "@miaomiao/db";
import * as schema from "@miaomiao/db/schema/auth";
import { env } from "@miaomiao/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        // HTTPS deploys: cross-site cookies (secure + sameSite none).
        // Plain-HTTP deploys (a bare public IP, no domain): browsers drop
        // `secure` cookies, so fall back to a same-site lax, non-secure cookie.
        sameSite: env.BETTER_AUTH_URL.startsWith("https") ? "none" : "lax",
        secure: env.BETTER_AUTH_URL.startsWith("https"),
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
