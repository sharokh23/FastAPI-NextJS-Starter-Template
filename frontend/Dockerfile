# syntax=docker/dockerfile:1
#
# Multi-stage image:
#   dev    — used by docker-compose.yml (next dev + bind mounts)
#   runner — production standalone server (docker-compose.prod.yml)
# Production pattern follows the official example:
# https://github.com/vercel/next.js/tree/canary/examples/with-docker

FROM node:22-bookworm-slim AS base

WORKDIR /app

# Minimal OS deps if native addons appear later
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed (layer cached while package files are unchanged)
FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

# --- Development (docker-compose.yml: bind mount + hot reload) ---
FROM base AS dev

COPY --from=deps /app/node_modules ./node_modules

COPY . .

EXPOSE 3000

# Overridden by docker-compose (bind mount + hot reload)
CMD ["npm", "run", "dev:docker"]

# --- Production build ---
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Standalone mode serializes next.config (including resolved rewrites) into
# the build output, so the /svc/api proxy target must be known at build time.
ARG BACKEND_INTERNAL_URL=http://backend:8000
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}

RUN npm run build

# --- Production runtime (minimal, non-root) ---
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/hello').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
