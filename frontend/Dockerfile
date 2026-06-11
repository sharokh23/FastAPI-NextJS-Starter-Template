# syntax=docker/dockerfile:1
#
# Dev-oriented image for docker-compose (next dev + bind mounts).
# For production, follow the official standalone pattern:
# https://github.com/vercel/next.js/tree/canary/examples/with-docker

FROM node:22-bookworm-slim

WORKDIR /app

# Minimal OS deps if native addons appear later
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 3000

# Overridden by docker-compose (bind mount + hot reload)
CMD ["npm", "run", "dev:docker"]
