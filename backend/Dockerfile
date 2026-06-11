# syntax=docker/dockerfile:1
#
# Multi-stage image:
#   dev  — used by docker-compose.yml (bind mount + --reload)
#   prod — non-root runtime with healthcheck (docker-compose.prod.yml)

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS base

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

# --- Development (docker-compose.yml overrides CMD with --reload) ---
FROM base AS dev

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen

COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- Production ---
FROM base AS prod

COPY pyproject.toml uv.lock ./

# Cache mount speeds up rebuilds; --no-dev keeps dev/test tooling out of the image.
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

COPY . .

RUN groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app app

USER app

# Run uvicorn from the project venv directly (no uv resync at startup).
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/status', timeout=2).status == 200 else 1)"]

# --proxy-headers: trust X-Forwarded-* set by the Next.js rewrite proxy.
# --forwarded-allow-ips '*' is acceptable only because docker-compose.prod.yml
# does not publish this port; it is reachable solely on the internal network.
# Add --workers N for single-server deployments (keep one process per container
# on orchestrated clusters and scale with replicas instead).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
