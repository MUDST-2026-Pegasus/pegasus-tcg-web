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
