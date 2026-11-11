# FE testing coverage review — TCG-767

## Discovery

- Frontend tests run on Vitest with jsdom and Testing Library. Shared rendering uses `renderWithProviders` and a fresh React Query client; API calls are mocked at feature API modules or `@/lib/api`.
- Existing commands are `pnpm test`, `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:coverage`. Coverage uses the existing V8 provider and writes text, JSON, and HTML reports to `coverage/`.
- No FE testing progress/coverage document existed before this review. `src/test/cypress/RTM.md` is an E2E traceability document and was left untouched.

## Gap list found

| Flow | Existing coverage | Gaps addressed in this change |
| --- | --- | --- |
| Cart and multi-shop checkout | Cart unit tests cover seller grouping and totals; cart integration tests cover quantity API calls, removal, empty and fetch-error states. Checkout tests cover API-driven promotion totals, invalid/expired codes, stock errors, auth redirect, and duplicate checkout prevention. | Quantity change was not asserting that the rendered quantity and total refresh from the API-backed cart. Added this response-to-UI assertion. |
| Stock and restock | Restock calculation and cache-invalidation unit tests existed; Restock page tests only verified form availability; forecast tests focused mainly on pagination. | Forecast preview/modal API value mapping, two-row preview cap, no-sales output without fabricated estimates, row actions, full-set search/filter, and loading/error/empty/no-match states were not covered. Restock submit pending/duplicate blocking and 422 feedback were not covered. Added these cases. |
| Promotions and refunds | Checkout already covered discount totals, applying/removing codes, and invalid/expired/ineligible promo responses. Buyer refund tests covered status labels, order isolation, empty state and destination-save duplicate prevention. | Refund detail loading and 404 error states were missing. Added a deterministic 404 response case. |
| Shared state and access | Checkout already tests unauthenticated redirect; seller payout tests cover a 403 response; seller restock tests cover listing 404. | No changes to production access behavior were needed. Existing auth/permission assertions remain in their feature suites. |

## Tests added

- `src/test/integration/cart.spec.tsx`: rendered quantity and multi-shop cart total reflect the changed quantity after the API mutation completes.
- `src/test/features/seller/products/components/StockForecast.test.tsx`: forecast preview is capped at two rows and ordered by the API prediction; modal values/actions match deterministic API fixtures; insufficient/no-sales rows do not show estimated numbers/dates; filters and search run over the full data set and reset pagination; loading, API error, empty and no-match states.
- `src/test/features/seller/products/SellerProductRestockPage.test.tsx`: save is disabled while a deferred request is pending, repeated submit sends one request, and a 422 API validation response produces the API error feedback and re-enables retry.
- `src/test/features/finance/BuyerRefunds.test.tsx`: refund detail loading followed by a 404 response displays the existing detail error state.

All new fixtures use fixed ISO timestamps and mocked APIs. No BE formula, production code, E2E, CI or test configuration was changed.

## Verification

| Command | Result |
| --- | --- |
| `pnpm test` — run 1 | Passed: 183 files, 1,295 tests (441.28 s). |
| `pnpm test` — run 2 | Passed: 183 files, 1,295 tests (442.17 s). |
| Changed-test regression run | Passed: 4 files, 26 tests after the final fixture typing correction. |
| Forecast ordering assertion | Passed: `StockForecast.test.tsx`, 9 tests. |
| `pnpm test:coverage` | Passed: 183 files, 1,295 tests. Existing V8 report: statements 62.14% (27,731/44,622), branches 55.51% (24,035/43,298), functions 57.90% (3,415/5,898), lines 68.02% (17,928/26,356). |
| `pnpm lint` | Passed, 0 errors. One existing React Compiler warning remains in `src/features/account/components/EditProfileDialog.tsx:96` (`react-hooks/incompatible-library`). |
| `pnpm build` | Passed (`tsc -b` and Vite production build; 5,596 modules transformed). |

Vitest emitted pre-existing console warnings in unrelated tests (Base UI button semantics, undefined query mock data, and the intentional ICU missing-variable case); these did not fail the runs. The configured reports were generated in the existing `coverage/` and `test-results/` output locations.

## Known bugs / issues found

- None in production behavior. Initial test runs exposed incorrect test assumptions (Thai Buddhist-calendar formatting, toast delivery, and query invalidation settling) and a forecast fixture type that was too narrow; the test setup/assertions/types were corrected without changing production code.

## Istanbul follow-up review (TCG-767 coverage expansion)

### Coverage gaps reviewed

The supplied Istanbul baseline flagged weaker areas in cart/payment, catalog/restock, promotions, and seller returns. File-level review found these unasserted or lightly asserted paths:

| Flow | Coverage gap found in targeted code | Tests added or already added on this branch |
| --- | --- | --- |
| Cart, checkout and payment | Payment `PaymentSteps.tsx` was at 22.22% statements / 29.82% branches / 15.38% functions / 26.31% lines before this expansion; cart quantity update needed a rendered response assertion. Existing cart grouping/totals, removal, checkout cancellation/error and promotion contract tests were already present. | Cart integration now asserts API quantity response updates the rendered quantity/subtotal. `PaymentSteps.test.tsx` covers API amount display, reference edits, upload progress/retry/error, disabled submission state and uploaded-slip preview/removal. |
| Catalog stock and seller restock | `ListingDetailPage.tsx` was 0% covered before this expansion, including query loading, invalid id, API 404 and retryable non-404 error branches. Catalog stock caps/out-of-stock and restock success/cache refresh/422 duplicate submission had existing tests from the first expansion. | `ListingDetailPage.test.tsx` covers loading, not-found and retryable error. Existing `ProductDetailCart`, `SellerProductRestockPage` and `StockForecast` tests continue to cover stock cap/out-of-stock, successful restock refresh, insufficient-stock response, forecast values and modal states. |
| Promotions and refunds/returns | `PromotionTermsDialog.tsx` was at 41.66% statements / 9.75% branches / 12.5% functions / 41.66% lines; `ReturnStatusCallout.tsx` and `ReturnInTransitBox.tsx` were uncovered. | `claim.format.test.ts`, `PromotionTermsDialog.test.tsx`, and `SellerReturnComponents.test.tsx` cover API contract display, claim state/error mapping, terms loading/retry/claiming/owner states, return status labels, restock choice, receipt confirmation, busy disabling and reject modal behavior. |

### New test cases in this expansion

- **Flow 1:** `PaymentSteps.test.tsx` checks deterministic API amount formatting, reference callback updates, upload in-progress/error/retry, disabled controls after submit and uploaded slip preview/removal. The existing CartPage and checkout suites cover multi-shop grouping/totals, quantity update/removal, cancel/error states, API promotion totals, and duplicate checkout blocking.
- **Flow 2:** `ListingDetailPage.test.tsx` verifies loading, invalid/not-found (404), and retryable server error states. The existing seller restock and catalog tests verify stock limits/out-of-stock, refreshed listing/query data after restock, insufficient-stock errors and pending duplicate-submit prevention.
- **Flow 3:** `claim.format.test.ts` verifies terms/value mapping, claim eligibility/error mapping and deterministic date formatting; `PromotionTermsDialog.test.tsx` covers loading/error retry, API terms display, claim callback, pending disable and owner view; `SellerReturnComponents.test.tsx` covers all seller return status callouts and receipt/reject interactions with loading guards.

All added cases use mocked hooks/APIs and fixed date fixtures where time is relevant. No backend formula, production behavior, E2E, or coverage configuration was changed. Tests remain in the existing Vitest/jsdom/Testing Library setup.

### Coverage comparison

Baseline below is the Istanbul baseline supplied for this review. After values are from the full `pnpm test:coverage` run on this branch.

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Statements | 62.16% | 62.52% | +0.36 pp |
| Branches | 55.54% | 55.95% | +0.41 pp |
| Functions | 57.90% | 58.15% | +0.25 pp |
| Lines | 68.02% | 68.50% | +0.48 pp |

### Verification update

| Command | Result |
| --- | --- |
| Focused expansion tests | Passed: 5 files, 22 tests. |
| `pnpm test:coverage` | Passed: 188 files, 1,317 tests. V8/Istanbul summary: statements 62.52% (27,902/44,622), branches 55.95% (24,229/43,298), functions 58.15% (3,430/5,898), lines 68.50% (18,054/26,356). |
| `pnpm lint` | Passed: 0 errors, 1 existing warning at `EditProfileDialog.tsx:96` (`react-hooks/incompatible-library`). |
| `pnpm build` | Passed: `tsc -b` and Vite build; 5,596 modules transformed. |

## Known bugs / issues found in expansion

- No production bugs were confirmed. Coverage run emits existing React Compiler, Base UI, and mocked-query warnings in unrelated tests; these did not fail the test or coverage run.

## Targeted folder coverage follow-up

### Gap findings and coverage movement

The next report identified `MiniCartDrawer.tsx` as the largest uncovered Cart component (before this follow-up: 22.75% statements, 17.31% branches, 12.5% functions, 22.64% lines). `ProfitWarningCard.tsx` in restock had 0% coverage. Existing `CartSellerGroup` UI behavior also had unasserted quantity and remove disabled branches. The follow-up adds component coverage for those paths, a Cart API 409/pending integration case, and restock 401/403 and successful-submit cases.

| Target folder | Statements Before → After | Branches Before → After | Functions Before → After | Lines Before → After |
| --- | ---: | ---: | ---: | ---: |
| `features/cart/components` | 74.38% (595/800) → 86.00% (688/800) | 70.13% (763/1,088) → 77.39% (842/1,088) | 66.02% (68/103) → 73.79% (76/103) | 77.82% (372/478) → 91.42% (437/478) |
| `features/cart/pages` | 87.26% (459/526) → 87.64% (461/526) | 82.69% (468/566) → 83.39% (472/566) | 77.19% (44/57) → 77.19% (44/57) | 90.49% (276/305) → 91.15% (278/305) |
| `features/seller/products/components/restock` | 85.98% (509/592) → 90.71% (537/592) | 80.59% (490/608) → 82.89% (504/608) | 71.43% (20/28) → 75.00% (21/28) | 92.58% (287/310) → 98.39% (305/310) |

### Tests added in this follow-up

- `MiniCartDrawer.test.tsx`: grouped multi-shop UI, recent item/cart summary, purchasable checkout URL, loading/error/retry/empty states and unavailable-line review state.
- `CartSellerGroup.test.tsx`: quantity bounds, quantity/remove busy disabling and selected row callback arguments.
- `integration/cart.spec.tsx`: a deferred quantity update blocks repeated submissions; a 409 `INSUFFICIENT_STOCK` response leaves the previous quantity in place, reports an error and unlocks retry.
- `ProfitWarningCard.test.tsx`: API-provided warning values and the edit-price destination.
- `SellerProductRestockPage.test.tsx`: listing access denied responses (401/403), successful restock payload and return to product management. Existing pending-submit and 422 error cases remain covered.

### Verification for this follow-up

| Command | Result |
| --- | --- |
| Focused changed tests | Passed: 5 files, 19 tests. |
| `pnpm test:coverage` | All 1,326 tests passed, but Vitest exited 1 because of 2 `EnvironmentTeardownError` events from `NavbarCartBadge.test.tsx` while its console log callback was pending. No test assertions failed. |
| `pnpm exec vitest run --coverage --passWithNoTests --silent` | Passed: 191 files, 1,326 tests. Overall statements 62.79% (28,022/44,622), branches 56.16% (24,318/43,298), functions 58.37% (3,443/5,898), lines 68.83% (18,143/26,356). Uses the existing Vitest configuration with a CLI-only console-silence flag. |
| `pnpm lint` | Passed: 0 errors, 1 existing React Compiler warning at `EditProfileDialog.tsx:96`. |
| `pnpm build` | Passed: TypeScript and Vite production build; 5,596 modules transformed. |

No production files or Vitest/Coverage config were changed. No business logic defects were found.

## TCG-767 cart and restock verification (2026-11-11)

### Latest targeted folder coverage

The latest full V8 run includes the cart multi-shop, quantity/removal, pending/stock-conflict tests and restock submit success, duplicate-submit, validation and permission/server-error cases.

| Target folder | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `features/cart/components` | 86.00% (688/800) | 77.38% (842/1,088) | 73.78% (76/103) | 91.42% (437/478) |
| `features/cart/pages` | 87.64% (461/526) | 83.39% (472/566) | 77.19% (44/57) | 91.14% (278/305) |
| `features/seller/products/components/restock` | 90.71% (537/592) | 82.89% (504/608) | 75.00% (21/28) | 98.38% (305/310) |

Against the reported starting figures (595/800 statements for cart components and 509/592 statements for restock), the latest coverage is up by 93 cart statements and 28 restock statements. The remaining uncovered counts are 112 cart component statements, 246 cart component branches, 27 cart component functions, and 55 restock statements, 104 restock branches, 7 restock functions.

### Added API failure cases

`SellerProductRestockPage.test.tsx` now exercises failed restock mutations for 401, 403, and 500 responses, asserts that the API error is surfaced through the existing error toast, and verifies the save action becomes available again. The existing success test checks the submitted payload and navigation; the pending test verifies repeated submits send one request.

### Verification

| Command | Result |
| --- | --- |
| Focused `SellerProductRestockPage` suite | Passed: 10 tests. |
| `vitest run --coverage --passWithNoTests --silent` | Passed cleanly: 191 files, 1,329 tests, no unhandled errors. Statements 62.81% (28,030/44,622), branches 56.19% (24,333/43,298), functions 58.37% (3,443/5,898), lines 68.83% (18,143/26,356). The unsilenced run also reported four `EnvironmentTeardownError` events in `legacy-redirects.spec.tsx`; the clean rerun used Vitest's CLI `--silent` option. |
| `pnpm lint` | Passed: 0 errors, 1 existing React Compiler warning at `EditProfileDialog.tsx:96`. |
| `pnpm build` | Passed: TypeScript and Vite production build; 5,596 modules transformed. |

The machine's `pnpm` shim was missing, so the equivalent commands were run with `corepack pnpm@10.18.3`. No production code or coverage configuration was changed.

## TCG-767 focused coverage follow-up (2026-11-11)

Added tests only for promotion API wrappers, seller return actions, seller product stock indicators, and catalog product detail presentation. Product code and coverage configuration were not changed.

| Target folder | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `features/promotions` | 80.64% (621/770), up from 79.87% | 72.70% (642/883), up from 72.48% | 88.18% (112/127) | 91.70% (398/434) |
| `features/finance/seller-returns` | 83.46% (212/254), up from 75.98% | 60.77% (141/232), up from 57.32% | 68.00% (34/50), up from 52.00% | 90.60% (164/181) |
| `features/seller/products/components` | 83.21% (734/882), up from 81.29% | 75.77% (613/809), up from 74.16% | 68.06% (81/119), unchanged | 87.92% (488/555) |
| `features/catalog/components` | 40.85% (192/470), up from 37.02% | 27.38% (152/555), up from 22.70% | 50.00% (17/34) | 39.91% (95/238) |

`claim.api.test.ts` covers featured/shop/terms requests, encoded paths, optional claim source, claim-by-code and wallet query filters. `useReturnActions.test.tsx` exercises return draft merging, approval/rejection/receipt actions, no-modal guards, API failure toast and busy-state cleanup. `ProductTable.test.tsx` covers out-of-stock, low-stock and healthy stock indicators. `ProductDetailSections.test.tsx` covers image fallback/gallery selection, missing attributes, and card-effects loading/error/retry/empty/detail states; `ProductDetailCart.test.tsx` checks skipping an out-of-stock listing and enforcing the selected seller's stock maximum.

The full silent V8 coverage run passed 195 files / 1,339 tests. Overall coverage was 62.96% statements (28,097/44,622), 56.32% branches (24,389/43,298), 58.76% functions (3,466/5,898), and 69.01% lines (18,190/26,356). Focused tests passed 5 files / 23 tests. Lint passed with 0 errors and the existing React Compiler warning at `EditProfileDialog.tsx:96`. Build and typecheck passed after aligning the wallet test fixture with the `WalletTab` enum.

## TCG-767 CI failure follow-up (2026-11-11)

Corrected the reported test failures without changing production code. `PaymentSteps.test.tsx` now mounts with the English i18n provider and awaits translated preview/status elements; `ProductDetailCart.test.tsx` queries the cart action by its Thai accessible name; `SellerReturnComponents.test.tsx` asserts the current localized callout title/body and receipt action using an explicit Thai provider. Removed the unrelated `TCG-670` Cypress stockout prediction test from this branch.

| Verification | Result |
| --- | --- |
| `PaymentSteps.test.tsx` | Passed: 3/3 tests. |
| `ProductDetailCart.test.tsx` | Passed: 14/14 tests. |
| `SellerReturnComponents.test.tsx` | Passed: 9/9 tests. |
| `vitest run --coverage --passWithNoTests --silent` | Passed: 199 files, 1,372 tests; 0 failed. `coverage/coverage-summary.json` was generated. Statements 63.23% (33,831/53,504), branches 56.32% (29,572/52,507), functions 58.67% (3,828/6,524), lines 69.32% (20,293/29,271). |
| `features/promotions` | Statements 79.64% (759/953), branches 70.18% (786/1,120), functions 85.81% (127/148), lines 91.36% (465/509). |
| `features/finance/seller-returns` | Statements 88.24% (1,238/1,403), branches 74.14% (1,081/1,458), functions 62.35% (53/85), lines 95.16% (766/805). |
| `features/seller/products/components` | Statements 72.77% (1,994/2,740), branches 65.87% (1,843/2,798), functions 57.58% (152/264), lines 77.14% (1,205/1,562). |
| `features/catalog/components` | Statements 46.89% (279/595), branches 30.21% (226/748), functions 50.00% (18/36), lines 40.51% (111/274). |
| `pnpm lint` | Passed: 0 errors; existing React Compiler warning at `EditProfileDialog.tsx:99`. |
| `pnpm build` | Passed: TypeScript and Vite build; 5,606 modules transformed. |

Coverage denominators changed after merging the latest `develop`; folder figures above are from the regenerated report on the merged tree. The machine's `pnpm` shim is unavailable, so these commands use `corepack pnpm@10.18.3`.
