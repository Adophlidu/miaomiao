# Server image for apps/server (Hono + Node). Multi-stage: build the bundled
# dist/index.mjs (tsdown inlines workspace + npm deps), then run it on a slim base.
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Install deps with the full workspace (server build pulls in @miaomiao/* sources).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

# Build the server (tsdown bundles everything into apps/server/dist/index.mjs).
COPY . .
RUN pnpm --filter server build

# --- runtime ---
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/server/dist ./dist
# App Runner injects PORT; the server reads it (defaults to 3000 locally).
EXPOSE 8080
CMD ["node", "dist/index.mjs"]
