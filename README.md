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
pnpm --filter @workspace/vertus-mexico dev     # run the landing page locally
pnpm --filter @workspace/vertus-mexico test    # Playwright layout tests
```

## Secrets

HubSpot credentials are **not** in this repo — they live in Replit Secrets (and
should be provided as environment variables when running the api-server locally).
Never commit a `.env`.

## Deployment

Deployed on Replit (autoscale). See `.replit` for the run/deploy configuration.
