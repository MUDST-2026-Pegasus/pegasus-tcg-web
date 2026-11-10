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
