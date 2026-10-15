# Pegasus TCG Web

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white) ![License](https://img.shields.io/badge/license-Apache--2.0-blue)

Welcome to the frontend for **Pegasus TCG**, a trading card marketplace. This guide will help you get the app running and find the right place to make your first change.

## What is here?

| Area | What you can work on | Example routes |
| --- | --- | --- |
| Public marketplace | Home, catalog, product details, listings, stores, cart, and checkout | `/`, `/products`, `/cart` |
| Accounts | Sign in, register, profile, addresses, and order history | `/login`, `/register`, `/account/profile` |
| Seller workspace | Shop, products, orders, payouts, returns, and reviews | `/seller`, `/seller/products` |
| Admin workspace | Catalog, seller approvals, users, orders, payments, and more | `/admin` |

The seller and admin routes require the corresponding account role. Some public-layout pages, such as account and payment pages, also require sign-in.

## Tech stack

React 19, TypeScript 6, Vite 8, React Router 7, Tailwind CSS 4, shadcn/ui, TanStack Query, Vitest, and Cypress. The frontend talks to the separate [Pegasus TCG API](https://github.com/MUDST-2026-Pegasus/pegasus-tcg-api) under `/api/v1`.

## Get started

Install **Node.js 22** and **pnpm 10.6.5**. The API is optional for browsing the frontend, but features that request live data need it running locally on port `8080` or at the proxy target you configure below.

```bash
git clone https://github.com/MUDST-2026-Pegasus/pegasus-tcg-web.git
cd pegasus-tcg-web
corepack enable
corepack prepare pnpm@10.6.5 --activate
pnpm install --frozen-lockfile
```

Create your local environment file and start Vite:

```bash
cp .env.example .env.local
pnpm dev
```

Open **http://localhost:5173**. By default, Vite sends `/api` requests to `http://localhost:8080`; change `VITE_API_PROXY_TARGET` in `.env.local` if your API runs elsewhere. Leave `VITE_API_BASE_URL` empty for local development so requests use this proxy. Restart the dev server after changing environment values.

> **Windows PowerShell:** use `Copy-Item .env.example .env.local` in place of `cp` if needed.

### Environment variables

Copy these from [`.env.example`](.env.example). Values beginning with `VITE_` are exposed in the browser, so do not put secrets in them.

| Variable | Local default / example | Purpose |
| --- | --- | --- |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | Backend target for Vite's development `/api` proxy. |
| `VITE_API_BASE_URL` | Empty | Optional backend origin prepended to `/api/v1` requests; leave empty in local development. A deployed frontend needs a reachable backend origin or a reverse proxy for `/api`. |
| `VITE_PEGASUS_STORE_USERNAME` | Empty (`pegasus_official` fallback) | Store username used for Pegasus Picks on the home page. |

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite development server. |
| `pnpm build` | Type-check and build production assets into `dist/`. |
| `pnpm preview --port 5173` | Serve the production build locally (also the URL expected by Cypress). |
| `pnpm lint` | Check the code with ESLint. |
| `pnpm test` | Run all Vitest tests once. |
| `pnpm test:unit` | Run Vitest excluding integration tests. |
| `pnpm test:integration` | Run integration tests. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm cyopen` | Open the Cypress test runner. |
| `pnpm cyrun` | Run Cypress headlessly. |

Cypress expects the app at `http://localhost:5173`. Start `pnpm dev` in one terminal, then run `pnpm cyrun` in another. If the Cypress binary is missing, run `pnpm exec cypress install` first. The E2E workflow in `.github/workflows/e2e-cypress.yml` builds the app and starts a preview server before running Cypress.

## Find your way around

```text
src/
  app/              Router and route groups (public, auth, seller, admin)
  components/       Shared UI, layouts, and loading/error/empty states
  features/         Feature pages, components, API functions, and query hooks
  hooks/            Shared React hooks
  lib/              API client, environment values, navigation, and utilities
  styles/           Global styles and theme tokens
  test/             Vitest unit and integration tests
cypress/            E2E specs, fixtures, and support commands
public/             Static assets
nginx/              Static-site server configuration for Docker
```

Features include product discovery, shopping cart and checkout, account management, seller inventory and orders, and admin operations. Route definitions live in `src/app/routes/`; the feature implementations live in `src/features/`.

## Working on a feature

1. Create a ticket branch from the latest `develop` (for example, `feat/TCG-123-short-description`). Open your PR against `develop`.
2. Add or update the route in the appropriate file under `src/app/routes/`, and keep page code inside its feature folder.
3. Call the backend through the shared `api` client in `@/lib/api`. Keep request functions in a feature's `*.api.ts` and TanStack Query keys/hooks in `*.queries.ts`; include every result-changing parameter in a query key.
4. Add relevant tests. Run `pnpm lint`, `pnpm build`, and the tests for your change before opening the PR.
5. Follow the team conventions in [CONTRIBUTING.md](CONTRIBUTING.md). This project is covered by the [Apache 2.0 license](LICENSE).

### Handy tips

- `@/` points to `src/`, so `@/components/common` is easier to follow than long relative imports.
- Shared shadcn/ui components live in `src/components/ui/`; use the shadcn CLI (`pnpm exec shadcn add <component>`) to add generated components. Keep page-specific styling near the feature.
- `QueryBoundary` from `@/components/common` handles query loading, error, and empty states. A disabled query can remain pending, so check its `enabled` condition before rendering the boundary.
- App-wide light and dark theme tokens are in `src/styles/globals.css`. Prefer existing tokens and component classes over hard-coded colors.

## Docker

To build and serve the static frontend with Nginx:

```bash
docker compose up --build -d
```

Open **http://localhost:4433** and stop it with `docker compose down`. This container serves the frontend only. Its current Nginx configuration does not proxy `/api`, and Vite variables are baked in at build time. For a working API in a Docker deployment, configure a reverse proxy for `/api` or build the frontend with a reachable `VITE_API_BASE_URL`.

## Contributors

Thanks to everyone building Pegasus together!

[![Pegasus TCG Web contributors](https://contrib.rocks/image?repo=MUDST-2026-Pegasus/pegasus-tcg-web)](https://github.com/MUDST-2026-Pegasus/pegasus-tcg-web/graphs/contributors)
