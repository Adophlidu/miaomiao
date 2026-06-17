import { defineConfig } from "vitest/config";

/**
 * Root Vitest config. Runs every `*.test.ts(x)` across the workspace.
 *
 * No live database is required to run the suite: the `env` block below supplies
 * dummy server-env values so that importing `@miaomiao/db` (which constructs a
 * drizzle node-postgres pool at module load) succeeds. The pool is created
 * lazily and never connects unless a query actually runs — so contract/pure
 * tests import the routers freely. DB-integration tests are guarded with
 * `describe.skipIf(!process.env.TEST_DATABASE_URL)` and only execute when a real
 * test database is configured.
 */
export default defineConfig({
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    env: {
      SKIP_ENV_VALIDATION: "1",
      DATABASE_URL: "postgres://test:test@localhost:5432/miaomiao_test",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123",
      BETTER_AUTH_URL: "http://localhost:3000",
      CORS_ORIGIN: "http://localhost:3001",
      NODE_ENV: "test",
    },
  },
});
