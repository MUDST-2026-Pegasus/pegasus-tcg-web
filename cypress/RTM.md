# Requirements Traceability Matrix (RTM)

**Project:** Pegasus TCG Web (`pegasus-tcg-web`)  
**Feature Branch:** `feat/TCG-392-component-and-e2e-testing`  
**Status:** **Implemented & Verified**  
**Frameworks:** Vitest + React Testing Library (Component Tests), Cypress (E2E Automation)

---

## 1. Scope & Verification Overview

| Module / Scope | Target Component / Route | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Multi-Seller Cart Math** | `CartSummary.tsx` | Vitest Component Test | **Implemented** |
| **PromptPay 5-Min Timer & Slip Validation** | `PromptPayModal.tsx` | Vitest Component Test | **Implemented** |
| **Buyer Complete Journey** | Register → Login → Catalog → Cart → Checkout → Purchase | Cypress E2E Flow 1 | **Implemented** |
| **Seller KYC & Admin Approval** | Become Seller → KYC Form → Status View → Admin Queue → Approval | Cypress E2E Flow 2 | **Implemented** |

---

## 2. Component Tests Specification

### 2.1 CartSummary (`src/test/features/cart/CartSummary.test.tsx`)
Verifies subtotal, multi-seller item grouping, shipping fee split calculation, and grand total.

| ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `TC-CART-01` | Multi-seller cart items subtotal calculation | Sum of `currentPrice * quantity` across distinct sellers (e.g., ฿250 + ฿500 = ฿750) | **Implemented** |
| `TC-CART-02` | Multi-seller shipping fee split (฿50 / shop) | 2 sellers = ฿100, 3 sellers = ฿150 correctly separated and billed | **Implemented** |
| `TC-CART-03` | Single-seller order subtotal and single shipping | 1 seller = ฿50 shipping fee; subtotal matches single item price | **Implemented** |
| `TC-CART-04` | Multiple items from same seller consolidated shipping | 3 items from Shop A = 1 × ฿50 shipping fee (฿50 total shipping) | **Implemented** |
| `TC-CART-05` | Grand total computation accuracy | Grand Total = Subtotal + Total Shipping Split without discrepancies | **Implemented** |
| `TC-CART-06` | Quantity and price update reactivity | Subtotal and grand total dynamically recalculate on prop changes | **Implemented** |
| `TC-CART-07` | Zero items / empty cart state | Renders ฿0 subtotal and disables proceed action safely | **Implemented** |
| `TC-CART-08` | Loading / disabled state handling | Disables checkout submission during pending operations | **Implemented** |

---

### 2.2 PromptPayModal (`src/test/features/payment/PromptPayModal.test.tsx`)
Verifies PromptPay QR code rendering, 5-minute countdown to expired state with fake timers, and slip file MIME/size validation.

| ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| `TC-PAY-01` | Initial render & QR code display | Modal displays PromptPay title, formatted amount (฿300.00), and QR canvas/image | **Implemented** |
| `TC-PAY-02` | 5-minute countdown clock tick | Time ticks down every second using `vi.useFakeTimers()` (05:00 → 04:59 → ...) | **Implemented** |
| `TC-PAY-03` | Expired state transition at 00:00 | When countdown reaches 00:00, QR disappears and UI indicates "QR Code Expired" | **Implemented** |
| `TC-PAY-04` | Valid slip MIME upload (`image/jpeg`, `image/png`) | Accepts `.jpg` and `.png` file uploads and enables submit button | **Implemented** |
| `TC-PAY-05` | Valid slip MIME upload (`application/pdf`) | Accepts `.pdf` upload without validation error | **Implemented** |
| `TC-PAY-06` | Invalid MIME rejection | Rejects invalid MIME types (`image/gif`, `text/plain`, `video/mp4`) with error | **Implemented** |
| `TC-PAY-07` | Slip file size limit enforcement (<= 5MB) | Files > 5MB are rejected with "File size exceeds 5MB limit" message | **Implemented** |
| `TC-PAY-08` | Submission event callback | Submits valid slip file and reference code to callback handler | **Implemented** |

---

## 3. Cypress E2E Automation Specifications

### 3.1 Flow 1: Buyer Complete Journey (`cypress/e2e/01-buyer-journey.cy.ts` & `QA/e2e/01-buyer-journey.cy.ts`)

| Scenario # | Step Description | Verified Assertion | Status |
| :---: | :--- | :--- | :--- |
| **1** | **Buyer Registration** | Fills username, email, displayName, password, accepts terms, submits registration, redirects to application | **Implemented** |
| **2** | **Buyer Login** | Logs in with valid credentials, obtains auth session tokens, redirects to landing page | **Implemented** |
| **3** | **Catalog & Search** | Browses product catalog, verifies card listings with prices and details | **Implemented** |
| **4** | **Product Detail & Add to Cart** | Navigates to product detail page (`/products/pikachu-ex-025-187`), adds card listing to shopping cart | **Implemented** |
| **5** | **Shopping Cart Multi-Seller Math** | Views cart with multi-seller items (Shop A: ฿250, Shop B: ฿500), verifies Subtotal ฿750, Shipping ฿100, Total ฿850 | **Implemented** |
| **6** | **Checkout & Place Order** | Enters `/checkout?items=101`, validates default shipping address, selects payment, submits order, navigates to `/payment` | **Implemented** |

---

### 3.2 Flow 2: Seller KYC & Admin Verification Flow (`cypress/e2e/02-seller-admin-flow.cy.ts` & `QA/e2e/02-seller-admin-flow.cy.ts`)

| Scenario # | Step Description | Verified Assertion | Status |
| :---: | :--- | :--- | :--- |
| **1** | **Candidate Seller Visit** | Authenticated candidate accesses `/become-a-seller`, views KYC introductory header and form | **Implemented** |
| **2** | **KYC Submission** | Fills Legal First/Last Name, Bank Account, selects Bank, uploads bankbook image, accepts terms, submits verification | **Implemented** |
| **3** | **Verification Status View** | Submitting user views pending verification status card ("ส่งคำขอเรียบร้อยแล้ว", masked account, review SLA) | **Implemented** |
| **4** | **Admin Queue Review** | Admin user accesses `/admin/sellers`, verifies applicant in pending verification queue with counts | **Implemented** |
| **5** | **Admin Inspection & Approval** | Admin inspects verification details, executes start review / approval workflow | **Implemented** |

---

## 4. Test Execution Summary

| Test Suite | Spec File | Total Tests | Passed | Failed |
| :--- | :--- | :---: | :---: | :---: |
| Vitest (Cart) | `src/test/features/cart/CartSummary.test.tsx` | 8 | 8 | 0 |
| Vitest (Payment) | `src/test/features/payment/PromptPayModal.test.tsx` | 8 | 8 | 0 |
| Cypress E2E (Flow 1) | `cypress/e2e/01-buyer-journey.cy.ts` | 6 | 6 | 0 |
| Cypress E2E (Flow 2) | `cypress/e2e/02-seller-admin-flow.cy.ts` | 5 | 5 | 0 |
| **Total** | **4 Suites** | **27** | **27** | **0** |

All tests pass 100% with 0 failures. No application source code was modified.
