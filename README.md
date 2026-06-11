# Next.js + FastAPI Services Monorepo

Minimal example showing Vercel Services with:

- `frontend` (Next.js) mounted at `/`
- `backend` (FastAPI) mounted at `/svc/api`

It demonstrates:

1. A **Next.js API route** at `/api/hello`
2. A **FastAPI backend route** at `/svc/api/status`
3. **Backend mounting via service routePrefix** in `vercel.json`

## Project structure

```txt
next-fastapi-monorepo/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   └── pyproject.toml
├── frontend/
│   ├── app/
│   │   ├── api/hello/route.js
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .mcp.json
└── vercel.json
```

## Run with Docker Compose

Development stack: **frontend** on [http://localhost:3000](http://localhost:3000), **backend** on [http://localhost:8000](http://localhost:8000). The frontend container sets `BACKEND_INTERNAL_URL` so Next.js rewrites `/svc/api/*` to `http://backend:8000/*` (same browser paths as on Vercel, no CORS). The backend container sets `ROOT_PATH=/svc/api` so Swagger UI loads the schema from `/svc/api/openapi.json` (via the same rewrite) instead of `/openapi.json`, which would 404 on the Next host. Open interactive docs at [http://localhost:3000/svc/api/docs](http://localhost:3000/svc/api/docs). Optional env hints: [.env.docker.example](.env.docker.example).

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

Non-Docker workflows are unchanged: omit `BACKEND_INTERNAL_URL` and use `vercel dev -L` as below.

## Services config

`vercel.json` uses `experimentalServices` to mount both services:

- `frontend` at `/`
- `backend` at `/svc/api`

Configure the FastAPI service with **`ROOT_PATH=/svc/api`** (environment variable) so Swagger loads `/svc/api/openapi.json` and “Try it out” targets the correct base path behind the route prefix.

## Next.js MCP (coding agents)

Next.js 16 exposes a dev-only MCP endpoint at `/_next/mcp`. This repo includes [`.mcp.json`](.mcp.json) with [`next-devtools-mcp`](https://www.npmjs.com/package/next-devtools-mcp) so Cursor (and other agents) can attach to a **running** `next dev` server and query errors, routes, and metadata. Start the dev server first (`docker compose up` or `cd frontend && npm run dev`), then ensure your agent loads the project MCP config. See the [Next.js MCP guide](https://nextjs.org/docs/app/guides/mcp).

## Run locally

Install frontend dependencies:

```bash
cd frontend
npm install
```

Then run all services via Vercel local runtime:

```bash
cd ..
vercel dev -L
```

Open `http://localhost:3000` and try:

- `/api/hello` (Next.js API route)
- `/svc/api/status` (FastAPI route)
- `/svc/api/docs` (FastAPI Swagger UI)
