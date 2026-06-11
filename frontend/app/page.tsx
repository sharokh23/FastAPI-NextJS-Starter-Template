"use client";

import Link from "next/link";
import { useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/svc/api";

/** Matches `frontend.old` nav label (hero `<h1>` stayed generic there). */
const NAV_BRAND = "Next.js + FastAPI";
const HERO_TITLE = "Next.js + FastAPI";

type LoadingKey = "frontend" | "backend";

type LoadingState = Record<LoadingKey, boolean>;

const vercelJsonSnippet = `<span class="text-zinc-500">// vercel.json</span>
{
  <span class="text-pink-400">"experimentalServices"</span>: {
    <span class="text-pink-400">"frontend"</span>: {
      <span class="text-pink-400">"entrypoint"</span>: <span class="text-yellow-200">"frontend"</span>,
      <span class="text-pink-400">"routePrefix"</span>: <span class="text-yellow-200">"/"</span>
    },
    <span class="text-pink-400">"backend"</span>: {
      <span class="text-pink-400">"entrypoint"</span>: <span class="text-yellow-200">"backend/main.py"</span>,
      <span class="text-pink-400">"routePrefix"</span>: <span class="text-yellow-200">"/svc/api"</span>
    }
  }
}`;

export default function Home() {
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    frontend: false,
    backend: false,
  });

  async function call(key: LoadingKey, url: string) {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Request to ${url} failed with status ${res.status}`);
      }
      setResponse(await res.json());
    } catch (err) {
      setResponse(null);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-black text-white">
      <header className="border-b border-zinc-800">
        <nav className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:gap-8 sm:px-8">
          <Link
            href="/"
            className="text-xl font-semibold text-white no-underline"
          >
            {NAV_BRAND}
          </Link>
          <div className="flex flex-wrap justify-center gap-6 sm:ml-auto sm:justify-end">
            <a
              href={`${BACKEND}/docs`}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 no-underline transition-colors hover:bg-zinc-950 hover:text-white"
            >
              API Docs
            </a>
            <a
              href={`${BACKEND}/items`}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 no-underline transition-colors hover:bg-zinc-950 hover:text-white"
            >
              API
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center px-4 py-8 text-center sm:px-8 sm:py-16">
        <h1 className="mb-4 bg-linear-to-r from-white to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          {HERO_TITLE}
        </h1>

        <div className="mb-6 w-full max-w-[900px]">
          <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left">
            <code
              className="font-mono text-[0.85rem] leading-relaxed text-white"
              dangerouslySetInnerHTML={{ __html: vercelJsonSnippet }}
            />
          </pre>
        </div>

        <div className="grid w-full max-w-[900px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left transition-colors hover:border-zinc-600 hover:-translate-y-0.5">
            <h3 className="mb-2 text-lg font-semibold">Next.js API Route</h3>
            <p className="mb-4 flex-1 text-sm text-zinc-400">
              Calls{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.9em] text-zinc-300">
                /api/hello
              </code>
              , a route handler running on the Next.js frontend service.
            </p>
            <button
              type="button"
              onClick={() => call("frontend", "/api/hello")}
              disabled={loading.frontend}
              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            >
              {loading.frontend ? "Loading..." : "Call /api/hello →"}
            </button>
          </div>

          <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left transition-colors hover:border-zinc-600 hover:-translate-y-0.5">
            <h3 className="mb-2 text-lg font-semibold">
              FastAPI Backend Route
            </h3>
            <p className="mb-4 flex-1 text-sm text-zinc-400">
              Calls{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.9em] text-zinc-300">
                /svc/api/status
              </code>{" "}
              directly on the FastAPI backend service.
            </p>
            <button
              type="button"
              onClick={() => call("backend", `${BACKEND}/status`)}
              disabled={loading.backend}
              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            >
              {loading.backend ? "Loading..." : "Call /svc/api/status →"}
            </button>
          </div>

          <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left transition-colors hover:border-zinc-600 hover:-translate-y-0.5">
            <h3 className="mb-2 text-lg font-semibold">Interactive API Docs</h3>
            <p className="mb-4 flex-1 text-sm text-zinc-400">
              Explore the FastAPI endpoints with the auto-generated Swagger UI.
            </p>
            <a
              href={`${BACKEND}/docs`}
              className="inline-flex w-fit items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            >
              Open Swagger UI →
            </a>
          </div>
        </div>

        <div
          aria-live="polite"
          className="flex w-full flex-col items-center"
        >
          {error != null && (
            <div className="mt-6 w-full max-w-[900px]">
              <p className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-left text-sm text-red-300">
                {error}
              </p>
            </div>
          )}
          {response != null && (
            <div className="mt-6 w-full max-w-[900px]">
              <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left font-mono text-[0.8rem] leading-snug text-zinc-200">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
