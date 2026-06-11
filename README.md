# FastAPI + Next.js Starter Template

Minimal starter with a **Next.js** app (port 3000) and a **FastAPI** API (port 8000). The browser talks to FastAPI under **`/svc/api/*`** on the Next.js origin; Next rewrites those requests to the backend when `BACKEND_INTERNAL_URL` is set (see `frontend/next.config.ts`).

It demonstrates:

1. A **Next.js API route** at `/api/hello`
2. A **FastAPI** route at `/svc/api/status` (and related routes under `/svc/api`)
3. **Swagger UI** at `/svc/api/docs` when the stack is running with the correct `ROOT_PATH`

## Project structure

```txt
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   └── pyproject.toml
├── frontend/
│   ├── app/
│   │   ├── api/hello/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── Dockerfile
│   ├── next.config.ts
│   └── package.json
├── docker-compose.yml
└── .mcp.json
```

## Run with Docker Compose

Development stack: **frontend** on [http://localhost:3000](http://localhost:3000), **backend** on [http://localhost:8000](http://localhost:8000). The frontend container sets `BACKEND_INTERNAL_URL` so Next.js rewrites `/svc/api/*` to `http://backend:8000/*` (same-origin calls from the browser, no CORS). The backend container sets `ROOT_PATH=/svc/api` so Swagger UI loads the schema from `/svc/api/openapi.json` (via the same rewrite) instead of `/openapi.json`, which would 404 on the Next host. Open interactive docs at [http://localhost:3000/svc/api/docs](http://localhost:3000/svc/api/docs). Optional env hints: [.env.docker.example](.env.docker.example).

**Hot reload:** Compose runs **`next dev --webpack`** (not Turbopack) with **polling-based file watching** so edits to bind-mounted files on **Docker Desktop for Windows** are picked up reliably; host-side `npm run dev` still uses the default dev bundler. `WATCHPACK_POLLING` and `WATCHFILES_FORCE_POLLING` stay enabled for the same reason. For the fastest HMR, run `npm run dev` on the host instead of in Docker ([local development guide](https://nextjs.org/docs/app/guides/local-development)).

```bash
# Build and start (foreground)
docker compose up --build

# Run in the background
docker compose up --build -d

# Stop and remove containers (named volume for node_modules is kept)
docker compose down

# Stop and remove containers and the frontend node_modules volume
docker compose down -v

# Rebuild images after Dockerfile or dependency changes
docker compose build --no-cache
docker compose up
```

Validate the Compose file (authoritative check; use this if your editor shows a bogus YAML error on named volumes):

```bash
docker compose config --quiet && echo OK
```

## Production build (Docker)

[docker-compose.prod.yml](docker-compose.prod.yml) builds the production targets of both Dockerfiles:

- **frontend** — multi-stage [standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) build (`next build` → `node server.js`), non-root user, container healthcheck. Standalone mode serializes `next.config.ts` (including resolved rewrites) into the build, so `BACKEND_INTERNAL_URL` is a **build arg** in production — changing it requires a rebuild, not just a restart.
- **backend** — `uv sync --frozen --no-dev`, non-root user, healthcheck on `/status`, and `--proxy-headers` so FastAPI sees the original request scheme/host. The backend port is **not** published to the host; all traffic flows through the `/svc/api` rewrite on the frontend.

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

For real deployments, terminate TLS with a reverse proxy (nginx, Traefik, Caddy) in front of the frontend — [Next.js recommends](https://nextjs.org/docs/app/guides/self-hosting#reverse-proxy) not exposing the Node server directly to the internet.

## `/svc/api` proxy and Swagger

- **`BACKEND_INTERNAL_URL`** (Next server env): base URL of FastAPI inside the Docker network (e.g. `http://backend:8000`). Enables rewrites in `next.config.ts`.
- **`ROOT_PATH=/svc/api`** (FastAPI env in Compose): public path prefix so OpenAPI/Swagger request `/svc/api/openapi.json` and “Try it out” use the correct base path behind the proxy.

## Next.js MCP (coding agents)

Next.js 16 exposes a dev-only MCP endpoint at `/_next/mcp`. This repo includes [`.mcp.json`](.mcp.json) with [`next-devtools-mcp`](https://www.npmjs.com/package/next-devtools-mcp) so Cursor (and other agents) can attach to a **running** `next dev` server and query errors, routes, and metadata. Start the dev server first (`docker compose up` or `cd frontend && npm run dev`), then ensure your agent loads the project MCP config. See the [Next.js MCP guide](https://nextjs.org/docs/app/guides/mcp).

## Run locally (without Docker)

**Backend** (from repo root, with Python 3.12 + [uv](https://docs.astral.sh/uv/) installed):

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

For Swagger on [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) when hitting Uvicorn directly, run **without** `ROOT_PATH` (or unset it). For the same `/svc/api` URLs as in Docker, set `ROOT_PATH=/svc/api` and use the frontend proxy below.

**Frontend** (separate terminal):

```bash
cd frontend
npm install
```

Create `frontend/.env.local` so Next can proxy to your local API:

```env
BACKEND_INTERNAL_URL=http://127.0.0.1:8000
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try:

- `/api/hello` (Next.js API route)
- `/svc/api/status` (FastAPI via Next rewrite)
- `/svc/api/docs` (FastAPI Swagger UI via Next rewrite)
