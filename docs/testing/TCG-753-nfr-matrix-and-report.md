# TCG-753 Standalone NFR Testing Matrix and Report

## Latest live VPN execution — 2026-11-12

**Overall TCG-753 result: Fail.** Live evidence now exists for the Dev Gateway and local production preview. Frozen thresholds are unchanged. Remaining unmeasured areas stay `Blocked`; they are not counted as passes.

| Area | Result | Measured outcome |
| --- | --- | --- |
| Gateway/API connectivity | Pass | Gateway root and `/api/v1/games`, `/catalog/products`, `/listings`, `/home/banners`, `/listings/90` returned HTTP 200 JSON. Listing ID `90` was used for detail. |
| Cypress NFR | Fail | 24/24 page captures; 23/24 Cypress LCP values unavailable and 24/24 interaction values unavailable. Accessibility axe check failed. |
| Lighthouse web vitals | Fail | 24/24 runs breached LCP 2.5 s. LCP range by page: home 14.1–15.1 s; catalog 10.4 s; detail 17.7–17.8 s; cart 10.4 s; checkout 15.9 s; auction 12.5–13.2 s; seller dashboard 13.5 s; admin report 13.4 s. CLS exceeded 0.10 in 13/24 runs. |
| WCAG axe-core | Fail | One Serious `aria-prohibited-attr` violation on Home; 0 Critical/Serious violations on each of the other seven pages. Manual 200% zoom, screen reader announcements, and full keyboard journey remain unverified. |
| k6 smoke / baseline | Blocked pending threshold evaluator review | Smoke 3 VUs/5 min: 2,621 iterations, 0 dropped, read p95/p99 184.5/245.2 ms, search 224.9/308.6 ms, unexpected error rate 0. Baseline 15 VUs/15 min: 36,953 iterations, 0 dropped, read p95/p99 288.4/517.0 ms, search 328.3/589.5 ms, unexpected error rate 0. Both numeric samples are below frozen budgets, but exported k6 threshold booleans were `false` for those values while process exit was 0; do not report a threshold pass until that runner discrepancy is resolved. |
| Security probes / headers | Partial; findings recorded | Anonymous profile/seller/admin endpoints returned 401; untrusted CORS preflight returned 403. API responses had `X-Content-Type-Options: nosniff`; HSTS and CSP were absent on those responses. Actuator/Swagger paths through the Gateway returned the same HTML fallback shape, so exposure is not confirmed. |
| Gitleaks | Fail / triage required | Four redacted `generic-api-key` candidates: `scripts/test-auction-e2e.sh:23` and `src/features/auction/components/MyAuctionRow.tsx:192-194`. |
| Trivy | Fail | Lockfile scan reported 1 Critical, 17 High, 25 Medium, and 6 Low dependency findings; Dockerfiles each reported a High root-user misconfiguration. See raw report. |
| Semgrep | Blocked | Pinned image ran but `--config=auto` did not return a report before the bounded wait; no Semgrep pass is claimed. |
| Actuator / MinIO / PostgreSQL / DB analysis | Blocked | Direct Actuator and MinIO requests timed out; PostgreSQL TCP check failed. No `psql` executable or DB credential keys were found. No `EXPLAIN ANALYZE` or `pg_stat_statements` query ran. |
| DB-backed synthetic seed | Blocked | Existing seed utility only creates local offline fixtures. It created 25 run-tagged records; it does not insert API/DB data. No shared Dev DB data was written, dropped, or truncated. |

### Live run metadata and topology

| Field | Value |
| --- | --- |
| Run ID | `tcg753-vpn-20261112` |
| Commit SHA at execution | `58aced49bf05e6f9e07e101a3750bc2891cbfaa9` (working tree contained NFR/report-only changes; production application sources were not changed) |
| Topology | Windows x64 workstation → local production preview `http://127.0.0.1:4173` → Dev API Gateway `https://pegasus-dev.gameinwza.com`; direct backend `100.86.49.143:8080`, PostgreSQL `100.86.49.143:5432`, and MinIO `100.86.61.35:9000` were unreachable from this host during checks. |
| Frontend build | `VITE_API_BASE_URL=https://pegasus-dev.gameinwza.com`; `pnpm build` passed. Local preview used an ignored temporary static SPA server because installed Vite preview dependencies were incomplete. |
| Versions | Node `22.20.0`; pnpm `10.6.5`; Vite `8.3.5`; Cypress `16.1.0` / Electron `146`; Lighthouse `12.2.1`; Chrome; k6 `0.55.0` in `grafana/k6:0.55.0`; Docker server `29.1.3` (resource runner pins `27.5.1`); Gitleaks `8.21.2`; Semgrep `1.99.0`; Trivy `0.58.1`; `psql` unavailable. |
| Database credentials | `.env` contains no PostgreSQL/DB host, username, or password keys. Credentials were not available to the runner. |
| Synthetic fixture | 25 local records tagged `tcg753-vpn-20261112`; manifest says `offline synthetic fixture only; no API/database writes`. |

### Live evidence paths

- Cypress: `artifacts/nfr/tcg753-vpn-20261112/frontend/cypress.log`, `summary.json`, `measurements.json`, `axe-status.json`, `manual-a11y-checklist.json`, and `screenshots/`.
- Lighthouse: `artifacts/nfr/tcg753-vpn-20261112/lighthouse/run.json` and 24 per-page JSON reports.
- k6: `artifacts/nfr/tcg753-vpn-20261112/performance/smoke-summary.json` and `baseline-summary.json`.
- API security: `artifacts/nfr/tcg753-vpn-20261112/security/attack-probes.json`.
- Resource and DB: `artifacts/nfr/tcg753-vpn-20261112/resources/warmup.json` and `postgres.json`.
- Static scans: `artifacts/nfr/tcg753-vpn-20261112/security/gitleaks.json` and `trivy-fs.json`. The source snapshot used for Gitleaks is ignored at `.nfr-runs/tcg753-gitleaks-source/`.
- Seed manifest: `.nfr-runs/tcg753-vpn-20261112/manifest.json`.

The prior Phase 1–5 entries below are historical local checkpoints. The live status and evidence above supersede any older statements that tools or Dev services were unavailable.

## Scope and evidence rules

This repository contains the React/Vite frontend only. `README.md` identifies the API as a separate `pegasus-tcg-api` project; `docker-compose.yml` starts only the web container and explicitly expects an API on host port `8080`. The API paths below are **client request contracts observed in this repository**, not a claim that backend route handlers were inspected. No API, database, JVM, MinIO, or production source is present here.

All targets pass `scripts/nfr/target-guard.mjs`: loopback by default, the exact TCG-753 Dev hosts (`pegasus-dev.gameinwza.com`, `100.86.49.143`, `100.86.61.35`), or an exact `.test` / `.localhost` hostname explicitly added to `NFR_TEST_TARGET_HOSTS`. Other production hosts and arbitrary public IPs remain rejected. Every runner must set a timeout and record its tool version.

Status values describe evidence from this run, not expected outcomes: `Pass`, `Fail`, `Blocked`, `Not Run`, or `N/A`. A missing backend/tool is recorded as `Blocked` or `Not Run`; it is never reported as a pass.

## Frozen thresholds

Thresholds are frozen before measurements. They are initial project NFR budgets, not claims of existing service capacity.

| NFR area | Frozen threshold |
| --- | --- |
| General read API | p95 ≤ 500 ms; p99 ≤ 1,000 ms; unexpected HTTP/network errors < 1%. |
| General write API | p95 ≤ 1,000 ms; p99 ≤ 2,000 ms; unexpected HTTP/network errors < 1%. |
| Search / catalog filtering | p95 ≤ 800 ms; p99 ≤ 1,500 ms; unexpected errors < 1%. |
| Admin report / PDF | p95 ≤ 2,000 ms; p99 ≤ 4,000 ms for the declared small fixture; unexpected errors < 1%. Large report sizes require a separate frozen budget before execution. |
| Upload metadata / presign | p95 ≤ 1,500 ms; p99 ≤ 3,000 ms; unexpected errors < 1%. File transfer throughput is reported by payload size and is not assigned a pass threshold until the local object store and fixture sizes are available. |
| Expected business outcomes | 400 / 401 / 403 / 404 / 409 / 422 / 429 responses are counted separately from unexpected errors and validated against the scenario; they are not silently excluded. |
| Web vitals / interaction | LCP ≤ 2.5 s; CLS ≤ 0.10; INP / interaction latency ≤ 200 ms, lab-run p75 where applicable. |
| Accessibility | Zero axe Critical / Serious violations; manual WCAG 2.2 AA checks for keyboard-only operation, visible focus, labels, contrast, 200% zoom, error announcements, and non-color-only status. |
| Compatibility | Required Chromium, Edge, Firefox, and WebKit runs have zero blocking workflow failures. WebKit automation is not equivalent to Safari certification. Mobile viewport has no horizontal overflow and interactive targets meet the chosen 24 CSS px WCAG minimum. |
| Soak / resource efficiency | Soak duration ≥ 4 h; no OOM/container restart/deadlock; post-warm-up GC heap growth ≤ 10%; CPU p95 ≤ 80%; DB connections ≤ 80% of configured pool. Resource thresholds are blocked until the API/DB/container topology is supplied. |

## NFR Scenario Matrix

`Target API` values are paths under the configured API base (the FE client defaults to `/api/v1`). UI paths come from `src/app/routes/*.tsx`.

| Scenario ID | Module | NFR Type | Target API / UI | Workload Profile | Frozen Threshold | Status | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NFR-AUTH-PERF-01 | Auth / Account | Performance | `/login`, `/register`, `/account/profile`; `/auth/login`, `/auth/register`, `/auth/me`, `/users/me` | Anonymous login/register smoke; authenticated profile read; 1-20 VUs | Read/write API budgets | Blocked | `artifacts/nfr/<run-id>/auth/perf/` |
| NFR-AUTH-SEC-01 | Auth / Account | Security / Privacy | `/auth/login`, `/auth/logout`, `/auth/logout-all`, `/auth/me`, `/auth/password/*` | Expired/tampered/replayed token; logout reuse; login rate-limit probes | No auth bypass; no token/PII leak; unexpected errors <1% | Blocked | `artifacts/nfr/<run-id>/auth/security/` |
| NFR-AUTH-UI-01 | Auth / Account | Accessibility / Compatibility | `/login`, `/register`, `/account/profile`, `/account/orders`, `/account/addresses`, `/account/coupons` | Keyboard, 200% zoom, Chrome/Edge/Firefox/WebKit, mobile | WCAG / compatibility budgets | Blocked | `artifacts/nfr/tcg753-fe-local/frontend/cypress.log` |
| NFR-AUTH-RES-01 | Auth / Account | Resource Efficiency | API auth/session and browser storage | 4 h authenticated session / repeated login-refresh-logout | Soak / resource budgets | Blocked | `artifacts/nfr/<run-id>/auth/resources/` |
| NFR-CATALOG-PERF-01 | Home / Catalog / Search | Performance | `/`, `/search`, `/products/:productId`; `/home/banners`, `/catalog/products`, `/catalog/trending`, `/listings` | Cold/warm cache; anonymous browse; search/filter pages 0-10 | Search p95 ≤800 ms / p99 ≤1,500 ms | Blocked | `artifacts/nfr/<run-id>/catalog/perf/` |
| NFR-CATALOG-SEC-01 | Home / Catalog / Search | Security / Privacy | `/catalog/products/:id`, `/listings/:id`, search query inputs | Injection/XSS strings in search and identifiers; malformed filters | No execution/reflected script; no unexpected errors | Blocked | `artifacts/nfr/<run-id>/catalog/security/` |
| NFR-CATALOG-UI-01 | Home / Catalog / Search | Accessibility / Compatibility | `/`, `/search`, `/products/:productId`, `/products/:productId/listings`, `/listings/:listingId` | 8-page Lighthouse set; keyboard; browser/mobile matrix | Web vitals, WCAG, compatibility budgets | Fail | `artifacts/nfr/tcg753-vpn-20261112/frontend/`, `artifacts/nfr/tcg753-vpn-20261112/lighthouse/` |
| NFR-CATALOG-RES-01 | Home / Catalog / Search | Resource Efficiency | Catalog pagination, filters, detail/market APIs | 4 h paginated/filter navigation; repeated detail open | Soak / resource budgets; no unbounded client growth | Blocked | `artifacts/nfr/<run-id>/catalog/resources/` |
| NFR-COL-PERF-01 | Collection | Performance | `/account/collection`, `/users/:username`; `/collection`, `/users/:username/collection` | Owner read/write; public read; pages 0-20 | Read/write API budgets | Blocked | `artifacts/nfr/<run-id>/collection/perf/` |
| NFR-COL-SEC-01 | Collection | Security / Privacy | `/collection`, `/collection/:id`, `/users/:username/collection` | Cross-user ownership / IDOR, mass assignment, malformed payload | Zero cross-user access; no unauthorized mutation | Blocked | `artifacts/nfr/<run-id>/collection/security/` |
| NFR-COL-UI-01 | Collection | Accessibility / Compatibility | `/account/collection`, `/users/:username` | Keyboard, zoom, screen-size and browser matrix | WCAG / compatibility budgets | Blocked | `artifacts/nfr/<run-id>/collection/ui/` |
| NFR-COL-RES-01 | Collection | Resource Efficiency | Collection pagination and client cache | 4 h page/filter/edit loop | Soak / resource budgets | Blocked | `artifacts/nfr/<run-id>/collection/resources/` |
| NFR-SELLER-PERF-01 | Seller / Listings / Inventory | Performance | `/seller`, `/seller/products`, `/seller/products/:productId/restock`; `/sellers/me/listings`, `/sellers/me/inventory/stock-ins` | Authenticated seller; list/filter/page; read/write mix | Read/write API budgets | Blocked | `artifacts/nfr/<run-id>/seller/perf/` |
| NFR-SELLER-SEC-01 | Seller / Listings / Inventory | Security / Privacy | `/sellers/me/listings/*`, `/sellers/me/units/*`, seller inventory APIs | Cross-seller IDOR, role bypass, mass assignment, price/status tampering | Zero cross-seller access or unauthorized mutation | Blocked | `artifacts/nfr/<run-id>/seller/security/` |
| NFR-SELLER-UI-01 | Seller / Listings / Inventory | Accessibility / Compatibility | `/seller`, `/seller/products`, `/seller/products/new`, `/seller/products/:productId/edit`, `/seller/products/:productId/restock` | Seller dashboard perf/a11y, keyboard, browser/mobile | Web vitals / WCAG / compatibility budgets | Blocked | `artifacts/nfr/tcg753-fe-local/frontend/cypress.log` |
| NFR-SELLER-RES-01 | Seller / Listings / Inventory | Resource Efficiency | Product list/filter, stock forecast, stock-in history | 4 h paging/filter/restock-preview loop | Soak / resource budgets; DB connections ≤80% | Blocked | `artifacts/nfr/<run-id>/seller/resources/` |
| NFR-CART-PERF-01 | Cart / Checkout / Orders | Performance | `/cart`, `/checkout`, `/account/orders`; `/cart`, `/checkout/shipping-quotes`, `/checkout/promotions`, `/checkout` | Multi-shop carts; read/write arrival rates; 1-100 VUs | Read/write API budgets | Blocked | `artifacts/nfr/<run-id>/cart/perf/` |
| NFR-CART-SEC-01 | Cart / Checkout / Orders | Security / Privacy | `/cart/items/:id`, `/checkout`, `/orders/:id/*` | IDOR, price/quantity mass assignment, duplicate/idempotency and CSRF checks | Zero unauthorized access; checkout integrity assertions | Blocked | `artifacts/nfr/<run-id>/cart/security/` |
| NFR-CART-UI-01 | Cart / Checkout / Orders | Accessibility / Compatibility | `/cart`, `/checkout`, `/account/orders` | Multi-shop journey; keyboard, zoom, slow/offline/401/403/429/5xx | WCAG / compatibility budgets; no blocking workflow failure | Blocked | `artifacts/nfr/tcg753-fe-local/frontend/cypress.log` |
| NFR-CART-RES-01 | Cart / Checkout / Orders | Resource Efficiency | Cart mutations, checkout quote and submit, order pagination | 4 h repeated read/write journey | Soak / resource budgets; no connection exhaustion | Blocked | `artifacts/nfr/<run-id>/cart/resources/` |
| NFR-PROMO-PERF-01 | Promotion / Sale | Performance | `/sale`, `/sale/:slug`, `/account/coupons`; `/sales`, `/promotions/featured`, `/me/promotions` | Anonymous sale browse; coupon wallet; claim/read/write mix | Read/write API budgets | Blocked | `artifacts/nfr/<run-id>/promotion/perf/` |
| NFR-PROMO-SEC-01 | Promotion / Sale | Security / Privacy | `/promotions/:id/claim`, `/me/promotions/claim-by-code`, `/sellers/me/promotions/*` | Claim replay, ownership, quota/race and mass assignment | No quota bypass; expected conflicts counted separately | Blocked | `artifacts/nfr/<run-id>/promotion/security/` |
| NFR-PROMO-UI-01 | Promotion / Sale | Accessibility / Compatibility | `/sale`, `/sale/:slug`, `/account/coupons`, `/seller/promotions`, `/seller/sales/*` | Buyer and seller journeys; keyboard/browser/mobile | WCAG / compatibility budgets | Blocked | `artifacts/nfr/<run-id>/promotion/ui/` |
| NFR-PROMO-RES-01 | Promotion / Sale | Resource Efficiency | Promotion listing, claim, redemption report | 4 h claim/list/read loop with bounded synthetic users | Soak / resource budgets | Blocked | `artifacts/nfr/<run-id>/promotion/resources/` |
| NFR-AUCTION-PERF-01 | Auction | Performance | `/auctions`, `/auctions/:auctionId`, `/account/auctions`, `/seller/auctions`; `/auctions`, `/auctions/:id/bids` | Listing/detail polling, bid arrival-rate and buy-now | Read/write API budgets; dropped iterations reported | Blocked | `artifacts/nfr/<run-id>/auction/perf/` |
| NFR-AUCTION-SEC-01 | Auction | Security / Privacy | `/auctions/:id/bids`, `/auctions/:id/buy-now`, seller/admin auction APIs | Bid tampering, ownership/role bypass, replay, rate-limit | No unauthorized bid; expected 409/429 separate | Blocked | `artifacts/nfr/<run-id>/auction/security/` |
| NFR-AUCTION-UI-01 | Auction | Accessibility / Compatibility | `/auctions`, `/auctions/:auctionId`, `/account/auctions`, `/seller/auctions` | 4 h memory-growth candidate; keyboard and cross-browser | WCAG / compatibility; no memory growth >10% after warm-up | Blocked | `artifacts/nfr/<run-id>/auction/ui/` |
| NFR-AUCTION-RES-01 | Auction | Resource Efficiency | Auction polling, bid history and bidding APIs | 4 h soak, warm-up compared to final 30 min | Heap growth ≤10%; no OOM/restart; CPU p95 ≤80% | Blocked | `artifacts/nfr/<run-id>/auction/resources/` |
| NFR-FIN-PERF-01 | Payment / Finance / Aftersales | Performance | `/payment`, `/payment/success`, `/seller/returns`, `/seller/payout`; `/payments`, `/refunds`, `/orders/:id/returns` | Read/write and status-poll scenarios; no real payment side effects | Read/write API budgets | Blocked | `artifacts/nfr/<run-id>/finance/perf/` |
| NFR-FIN-SEC-01 | Payment / Finance / Aftersales | Security / Privacy | `/payments/:id/slip`, `/refunds/:id`, `/sellers/me/returns/:id/*` | Private slip/KYC ownership, auth/session/CSRF and PII leak probes | Zero cross-user access or secret/PII disclosure | Blocked | `artifacts/nfr/<run-id>/finance/security/` |
| NFR-FIN-UI-01 | Payment / Finance / Aftersales | Accessibility / Compatibility | `/payment`, `/payment/success`, `/seller/returns`, `/seller/payout` | Keyboard, error announcements, 200% zoom, slow/offline | WCAG / compatibility budgets | Blocked | `artifacts/nfr/<run-id>/finance/ui/` |
| NFR-FIN-RES-01 | Payment / Finance / Aftersales | Resource Efficiency | Payment/refund/payout/return APIs | 4 h read-only polling; writes only to disposable local fixtures | No real transactions; DB/resource budgets | Blocked | `artifacts/nfr/<run-id>/finance/resources/` |
| NFR-ADMIN-PERF-01 | Admin / Reports | Performance | `/admin`, `/admin/orders`, `/admin/reports/weekly-stock-profit`; `/admin/metrics/overview`, `/admin/orders`, `/admin/reports/*` | Admin report by declared fixture size; paginated filters | Report p95 ≤2,000 ms / p99 ≤4,000 ms | Blocked | `artifacts/nfr/<run-id>/admin/perf/` |
| NFR-ADMIN-SEC-01 | Admin / Reports | Security / Privacy | `/admin/*`, `/admin/reports/*` | Role bypass, IDOR, query injection, report data leakage | Zero admin privilege bypass or cross-tenant disclosure | Blocked | `artifacts/nfr/<run-id>/admin/security/` |
| NFR-ADMIN-UI-01 | Admin / Reports | Accessibility / Compatibility | `/admin`, `/admin/orders`, `/admin/reports/weekly-stock-profit`, `/admin/payments`, `/admin/refunds` | Lighthouse/admin report; keyboard, zoom, browser/mobile | Web vitals / WCAG / compatibility budgets | Blocked | `artifacts/nfr/tcg753-fe-local/frontend/cypress.log` |
| NFR-ADMIN-RES-01 | Admin / Reports | Resource Efficiency | Admin report, pagination, export/PDF | 4 h report pagination and repeated filter changes | Report budget; no DB lock/deadlock; DB connections ≤80% | Blocked | `artifacts/nfr/<run-id>/admin/resources/` |
| NFR-UPLOAD-PERF-01 | Upload / PDF | Performance | Embedded upload UIs (`/payment`, `/seller/products/*`); `/uploads/presign` | 1 MiB / 5 MiB synthetic fixtures; PDF generation by declared page count | Presign p95 ≤1,500 ms / p99 ≤3,000 ms; transfer size reported | Blocked | `artifacts/nfr/<run-id>/upload/perf/` |
| NFR-UPLOAD-SEC-01 | Upload / PDF | Security / Privacy | `/uploads/presign`, private slip/KYC keys, PDF export | MIME/extension mismatch, oversize, traversal, object ownership, bucket access | No unauthorized object access, path traversal, or PII leak | Blocked | `artifacts/nfr/<run-id>/upload/security/` |
| NFR-UPLOAD-UI-01 | Upload / PDF | Accessibility / Compatibility | Payment slip, product photos, admin/account PDF download flows | Keyboard file selection, labels, errors, browser download matrix | WCAG / compatibility budgets | Blocked | `artifacts/nfr/<run-id>/upload/ui/` |
| NFR-UPLOAD-RES-01 | Upload / PDF | Resource Efficiency | Upload presign/transfer and report/PDF export | 4 h bounded synthetic upload/read loop; PDFs sized by fixture | No OOM/restart; upload/report budgets | Blocked | `artifacts/nfr/<run-id>/upload/resources/` |

## Route and API discovery

- UI route source: `src/app/router.tsx`, `src/app/routes/public.routes.tsx`, `auth.routes.tsx`, `seller.routes.tsx`, and `admin.routes.tsx`.
- API path source: `src/features/**/**.api.ts` and `src/lib/upload/upload.api.ts`; `README.md` states the API prefix is `/api/v1`.
- This repository does not contain backend route annotations/OpenAPI, SQL migrations, PostgreSQL config, Spring Boot/JVM config, MinIO config, or API Docker services. Exact server behavior, auth policy, supported payload limits, and financial ledger semantics must be validated in the API repository/environment.
- `/users/:username` is the public collection page; `/account/collection` is the signed-in collection page. Upload and PDF features are embedded flows rather than standalone routes.

## Isolated synthetic data setup

The Phase 1 seed utility creates deterministic synthetic browser/API fixture records only; it does not call an API, write a database, create real payment data, or use real PII. Default size is 1,000 rows, bounded at 5,000. Runtime records, manifests, and raw evidence are ignored by Git under `.nfr-runs/` and `artifacts/nfr/`.

```powershell
node scripts/nfr/seed-data.mjs --run-id local-smoke-001 --records 25 --target http://127.0.0.1:8080
node scripts/nfr/cleanup-data.mjs local-smoke-001
```

Cleanup requires the run ID and removes only `.nfr-runs/<run-id>` after validating the identifier, resolved path, directory type, and symlink status. Setup/cleanup are outside the measurement interval. DB-backed seeding remains blocked until a disposable local API/database and explicit test-only credentials are provided.

## Run metadata — Phase 1 checkpoint

| Field | Value |
| --- | --- |
| Base commit SHA | `9aba1f54112559544922d93fb7dff040bb78f794` (`origin/develop` at branch creation) |
| Run ID | `tcg753-phase1-seedcheck`; `tcg753-security-local`; `tcg753-attacks-local`; `tcg753-fe-local`; `tcg753-lighthouse-local`; `tcg753-resources-local`; `tcg753-db-local` |
| Measured source SHA | Phase 1 base `9aba1f54112559544922d93fb7dff040bb78f794`; FE checkpoint before resource phase `62af68e` |
| Tool versions | Node `v22.20.0`; pnpm `10.6.5` (CI-pinned; invoked with `corepack.cmd` because the PowerShell shim is blocked by execution policy); Vite `8.3.5`; Cypress `16.1.0`; k6 `0.55.0`, Gitleaks `8.21.2`, Semgrep `1.99.0`, Trivy `0.58.1`, ZAP `2.16.0`, Lighthouse `12.2.1`, psql `16.6`, and Docker CLI `27.5.1` are pinned by runners but unavailable/mismatched on this host. |
| Topology | Windows x64 workstation; this repository serves the FE only. Compose exposes web at `localhost:4433`; expected separate API is `localhost:8080` with `/api/v1`. `127.0.0.1:8080` was unreachable. Docker CLI exists but Docker server did not respond. |
| CPU / RAM | AMD Ryzen 5 7535HS, 12 logical CPUs; 16,452,980,736 bytes RAM total, 2,354,327,552 bytes available at discovery. |
| Dataset | 25 synthetic fixture rows for seed/cleanup dry run; 1 local warm-up resource sample; default planned fixture 1,000 rows. No DB dataset. |
| Scope limitation | Backend performance/security/resource tests are blocked by absent local API, DB, and MinIO. Deep ledger/financial reconciliation: **Not Verified (Out of Scope)**. |

## Findings / defects to date

### Phase 2 — k6 performance and capacity

- Added seven configurable profiles in `scripts/nfr/k6/profiles.json` and the loopback-only k6 journey in `scripts/nfr/k6/scenarios.js`; `scripts/nfr/run-k6.mjs` enforces the pinned k6 `0.55.0`, allowlisted target, per-mode timeout, and writes a summary under the ignored `artifacts/nfr/<run-id>/performance/` directory.
- `smoke` is 3 VUs / 5 min; `baseline` is 15 VUs / 15 min; `load` ramps 25 → 50 → 100 VUs and holds at 100 for 15 min; `stress`, `spike`, `soak` (4 h), and `cooldown` use arrival-rate executors and report `dropped_iterations` separately. `--dry-run` shortens scenario durations for validation only and must not be reported as a measurement.
- Read and search thresholds are applied to their tagged requests. The first per-VU request uses `Cache-Control: no-cache` and is tagged cold; subsequent iterations are tagged warm. Authenticated cart reads require a test-only `NFR_AUTH_TOKEN`, otherwise they remain anonymous. Write/report thresholds are frozen in the config/matrix; no mutating checkout/payment or report endpoint is exercised by default to avoid non-disposable side effects.
- Syntax checks: `node --check scripts/nfr/k6/scenarios.js` and `node --check scripts/nfr/run-k6.mjs` **Pass**.
- Live execution (k6 `0.55.0` via pinned Docker image) completed smoke and baseline before either run overlapped another. Smoke: 3 VUs / 5 min, 2,621 iterations, 0 dropped, read p95/p99 184.540/245.171 ms, search p95/p99 224.902/308.586 ms, overall p95/p99 199.238/275.218 ms, unexpected errors 0%. Baseline: 15 VUs / 15 min, 36,953 iterations, 0 dropped, read p95/p99 288.413/516.958 ms, search p95/p99 328.330/589.504 ms, overall p95/p99 303.014/537.532 ms, unexpected errors 0%. The raw k6 summaries mark the threshold booleans false despite these measurements; both runs remain **Blocked pending evaluator discrepancy review**, not Pass. Evidence: `artifacts/nfr/tcg753-vpn-20261112/performance/`.

### Phase 1 — seed/cleanup validation

- Seeded and removed `tcg753-phase1-seedcheck` (25 synthetic rows); setup and cleanup both **Pass**. An attempted public `https://example.com` seed target was rejected with exit code 1, confirming the default allowlist.
- Seed/cleanup perform local filesystem operations only; there is no API or database seed. Both CLIs enforce a 10-second timeout.

### Phase 3 — security and privacy

- Added pinned scanner runner `scripts/nfr/security/run-scans.mjs`: Gitleaks `8.21.2`, Semgrep `1.99.0`, Trivy `0.58.1`, and ZAP image `ghcr.io/zaproxy/zaproxy:2.16.0`. Each host scan has a 900 s timeout; ZAP is target-guarded and runs a 5-minute baseline scan. Raw JSON goes only to ignored `artifacts/nfr/<run-id>/security/`.
- Added `scripts/nfr/security/attack-probes.mjs`, loopback-only with a 5 s per-request timeout. It checks anonymous profile/seller/admin access, injection/XSS query handling, actuator/metrics/Swagger/debug exposure, CORS, basic response headers, and obvious token/secret leakage. It records response bodies by byte count only, never their contents.
- Live Dev Gateway probes: anonymous profile, seller, and admin endpoints returned 401; an untrusted CORS preflight returned 403. API responses included `X-Content-Type-Options: nosniff`; HSTS and CSP were absent on sampled responses. Actuator/Swagger/metrics/debug paths through the Gateway returned the same HTML fallback, so direct endpoint exposure remains unverified. Evidence: `artifacts/nfr/tcg753-vpn-20261112/security/attack-probes.json`. IDOR, JWT replay, CSRF, authenticated role boundaries, upload ownership, and rate-limit checks remain **Blocked** because no disposable identities/tokens were available.
- Live static scans: Gitleaks reported four redacted generic-api-key candidates for triage; Trivy reported 1 Critical, 17 High, 25 Medium, and 6 Low dependency findings plus a High root-user finding in each Dockerfile. Semgrep did not produce a report within the bounded run, and ZAP did not complete. Evidence: `artifacts/nfr/tcg753-vpn-20261112/security/gitleaks.json`, `trivy-fs.json`. These scanner findings are not yet triaged as confirmed exploitable defects.

### Phase 4 — frontend performance, accessibility, and compatibility

- Added `scripts/nfr/run-lighthouse.mjs` and `scripts/nfr/fe/config.json`. The plan is 8 production-preview pages × 3 runs with frozen budgets LCP ≤2.5 s, CLS ≤0.10, TBT ≤200 ms as a documented lab proxy for interaction latency; Lighthouse JSON reports include JS transfer size.
- Added Cypress `16.1.0` spec `src/test/cypress/e2e/nfr/tcg-753-nfr.cy.ts`: 3 visits per page, screenshots, LCP/CLS/interaction observer metrics, repeated API URL count, keyboard labels/focus, mobile overflow/touch targets, local API 401/403/429/5xx shell, and a manual WCAG checklist. The harness rejects remote browser requests; the UI target itself must be loopback.
- Test source: TypeScript check **Pass**; runner and Lighthouse script syntax checks **Pass**. Production build with `VITE_API_BASE_URL=http://127.0.0.1:8080` and CI-pinned pnpm `10.6.5`: **Pass**. `pnpm lint`: **Pass** with one existing React Compiler warning in `src/features/account/components/EditProfileDialog.tsx`.
- Cypress `16.1.0` / Electron 146 headless against the loopback production preview ran: **11 passing, 0 failing**; all 24 planned page-run samples were collected. An earlier label assertion incorrectly rejected valid native `<label>` associations because it checked the Cypress runner's `HTMLInputElement` realm; the checker now resolves `element.labels` and `aria-labelledby` text correctly. Evidence: `artifacts/nfr/tcg753-fe-local/frontend/cypress.log`, screenshots, and `summary.json`.
- Live run used listing `90` from the Gateway API, loaded the local production build, and completed 24 Cypress page captures. Cypress recorded 23/24 LCP values and 24/24 interaction values unavailable, and the aggregate failed. Lighthouse completed 3 runs for each of 8 pages: all 24 LCP values breached 2.5 s; CLS breached 0.10 in 13/24 runs. Lighthouse TBT exceeded the 200 ms lab proxy in 14/24 runs; TBT is a lab proxy only, not a measured interaction latency. Evidence: `artifacts/nfr/tcg753-vpn-20261112/frontend/summary.json`, `measurements.json`, and `artifacts/nfr/tcg753-vpn-20261112/lighthouse/run.json`.
- axe-core 4.10.3 scanned all eight pages: one Serious `aria-prohibited-attr` violation on Home and none Critical/Serious on the other seven pages. Full keyboard journey, 200% zoom, visual focus, and screen-reader announcements remain **Not Verified**. Evidence: `artifacts/nfr/tcg753-vpn-20261112/frontend/axe-status.json` and `manual-a11y-checklist.json`.
- An initial local build attempt was blocked by stale/missing pnpm package links. After reinstalling with CI-pinned pnpm `10.6.5`, the production build passed with a loopback API base; no remote API target was used.
- Raw run logs/screenshots (when available) are written under ignored `artifacts/nfr/<run-id>/frontend/` and `artifacts/nfr/<run-id>/lighthouse/`.

### Phase 5 — resource efficiency and database analysis

- Added `scripts/nfr/resources/resource-snapshot.mjs` for bounded 5-second HTTP collection of JVM memory/Prometheus metrics, optional MinIO health/cluster metrics, host CPU/memory/process metrics, and pinned Docker stats. It supports warmup/soak-end/cooldown snapshots and time series (up to 240 samples, max 5-hour command timeout; 240 × 60-second intervals cover a 4-hour soak).
- Added PostgreSQL read-only snapshot and slow-query files (`pg-stat-snapshot.sql`, `pg-slow-queries.sql`) plus `explain-analyze.mjs`. PostgreSQL host is loopback by default; only exact allowlisted `.test`/`.localhost` hosts are accepted. EXPLAIN runs in a read-only transaction with a 10-second server statement timeout and accepts only one SELECT/WITH query file inside this repository. API schema/migrations are absent, so no synthetic schema query is invented.
- Added `analyze-resources.mjs`; it requires warmup, soak-end, and cooldown files and reports `Blocked` if any are missing. Missing JVM/DB/MinIO/container telemetry never counts as a threshold pass.
- Live direct Actuator `http://100.86.49.143:8080/actuator` and MinIO `http://100.86.61.35:9000` timed out. JVM/GC/thread/CPU and MinIO service snapshots are **Blocked**. PostgreSQL TCP to `100.86.49.143:5432` failed, `psql` and DB credential keys were unavailable; no connection, seed, EXPLAIN, or `pg_stat_statements` query ran. Evidence: `artifacts/nfr/tcg753-vpn-20261112/resources/warmup.json` and `postgres.json`.
- Resource phase comparison: **Blocked**; soak-end/cooldown samples were not possible without local services. Deep ledger/financial reconciliation remains **Not Verified (Out of Scope)**.

### Final verification

- CI-pinned pnpm full Vitest suite: **Pass — 201 test files, 1,383 tests** (0 failed). Existing expected i18n-missing-parameter and Base UI button warnings were emitted; no unhandled errors.
- `pnpm lint`: **Pass** (0 errors, 1 existing React Compiler warning in `EditProfileDialog.tsx`).
- `pnpm build`: **Pass** with `VITE_API_BASE_URL=https://pegasus-dev.gameinwza.com`. No production application code or business logic changed; only NFR test scripts and reports were updated.
- Overall TCG-753 result: **Fail** from measured frontend LCP and axe findings. k6 threshold flags, Semgrep, direct Actuator/MinIO/PostgreSQL telemetry, authenticated security scenarios, and long soak remain **Blocked** or incomplete; none are represented as passes.

## Standalone CLI runbook

All measurement commands are local-only by default and have per-request/process timeouts. Keep setup and cleanup outside timed runs. Start a disposable local API/DB/MinIO and production preview before execution; set `VITE_API_BASE_URL=http://127.0.0.1:8080/api/v1` at build time so the built frontend cannot call a deployed API. Never set `NFR_TARGET`, `NFR_UI_TARGET`, `NFR_MINIO_TARGET`, or `PGHOST` to a production host.

```powershell
node scripts/nfr/seed-data.mjs --run-id tcg753-local --records 1000 --target http://127.0.0.1:8080
node scripts/nfr/run-k6.mjs smoke --dry-run
node scripts/nfr/security/run-scans.mjs
node scripts/nfr/security/attack-probes.mjs
node scripts/nfr/run-lighthouse.mjs
node scripts/nfr/run-fe-nfr.mjs
$env:NFR_RUN_ID = 'tcg753-local'; $env:NFR_RESOURCE_PHASE = 'warmup'; node scripts/nfr/resources/resource-snapshot.mjs
$env:NFR_RESOURCE_PHASE = 'soak-end'; node scripts/nfr/resources/resource-snapshot.mjs
$env:NFR_RESOURCE_PHASE = 'cooldown'; node scripts/nfr/resources/resource-snapshot.mjs
node scripts/nfr/resources/explain-analyze.mjs
node scripts/nfr/resources/analyze-resources.mjs tcg753-local
node scripts/nfr/cleanup-data.mjs tcg753-local
```

The 4-hour soak and destructive/authenticated security probes require a separately provisioned test-only topology and throwaway fixtures. The setup utility is intentionally offline and only generates synthetic files; it does not seed API/DB entities by itself.

No application defect was verified in this run; an initial label failure was a test false positive and was corrected to resolve native label associations. No production files were changed. Remaining execution gaps are environment blockers, not passes: the local API and disposable DB/MinIO/JVM are unavailable, Docker daemon is unavailable, and pinned NFR tools are not installed. Secrets or unredacted PII must not be committed; raw scanner output stays under ignored `artifacts/nfr/`.
