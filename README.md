# Vertus Mexico — GTM Landing Page

Marketing landing page for Vertus Mexico, with a contact form that submits into HubSpot.

> **Origin:** This repo was created from a clean export of the Replit workspace
> (`Vertus-Mexicon-Landing-Page`) on **2026-07-22**. It is intended to be merged
> back into the primary repo `joealbi64/vertus-mexico-gtm`.

## Structure

This is a **pnpm workspace monorepo**. The real work happens under `artifacts/`:

| Path | What it is |
| --- | --- |
| `artifacts/vertus-mexico` | The landing page — React + Vite + TypeScript + Tailwind/shadcn. Copy lives in `src/lib/content.ts`; layout in `src/App.tsx` + `src/components/`. |
| `artifacts/api-server` | Node/Express backend that pipes the contact form into HubSpot. |
| `artifacts/mockup-sandbox` | Replit design-tool sandbox (not part of the shipped site). |
| `attached_assets/` | Images/fonts referenced by the app via the `@assets` alias. |
| `lib/`, `scripts/` | Shared libraries and workspace scripts. |

## Prerequisites

- Node 24
- pnpm (this workspace **requires** pnpm — `npm`/`yarn` are blocked by a preinstall guard)

## Getting started

```bash
pnpm install
pnpm run typecheck          # typecheck all packages

# Dev / build need PORT + BASE_PATH (see "Environment variables" below):
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/vertus-mexico dev     # run locally
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/vertus-mexico build   # production build

pnpm --filter @workspace/vertus-mexico test    # Playwright layout tests
```

## Environment variables

Config comes from environment variables — copy the example files and adjust. The
Vite config reads `PORT`/`BASE_PATH` directly from `process.env`, so they must be
present in the environment (exported / set by your shell or host) for both `dev`
and `build`; a `.env` file alone won't populate them.

```bash
cp artifacts/vertus-mexico/.env.example artifacts/vertus-mexico/.env
cp artifacts/api-server/.env.example    artifacts/api-server/.env
```

| App | Required | Optional |
| --- | --- | --- |
| `vertus-mexico` (frontend) | `PORT`, `BASE_PATH` | `VITE_GTM_ID`, `VITE_SITE_URL` |
| `api-server` | `PORT` | `NODE_ENV`, `LOG_LEVEL` |

## Secrets

HubSpot is reached through Replit's connector proxy (`@replit/connectors-sdk`), so
there is **no** HubSpot token in the code — OAuth is injected by Replit. Running the
api-server's HubSpot path outside Replit means adapting the proxy call in
`artifacts/api-server/src/lib/hubspot.ts`. Never commit a `.env`.

## Deployment

Deployed on Replit (autoscale). See `.replit` for the run/deploy configuration.
