// cypress/e2e/02-seller-admin-flow.cy.ts
// E2E Test Flow 2: Seller KYC & Admin Verification Flow
// Flow: ผู้ขายยื่น KYC → Admin login ตรวจเอกสารและอนุมัติ

describe("E2E Flow 2: Seller KYC & Admin Approval Flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Prevent Navbar /cart query from 401 unauthorizing the mock session
    cy.intercept("GET", "**/api/v1/cart", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          items: [],
          itemsSubtotal: 0,
          totalQuantity: 0,
          currency: "THB",
        },
      },
    }).as("getCartNav");
  });

  it("1. Candidate Seller: visits Become a Seller page and views KYC form", () => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 2,
          email: "somchai.seller@example.com",
          username: "somchai_seller",
          displayName: "Somchai Cards Shop",
          roles: ["BUYER"],
        },
      },
    }).as("meCandidate");

    cy.intercept("GET", "**/api/v1/sellers/me/verifications", {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as("getVerificationsEmpty");

    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: "mock-candidate-token", expiresIn: 3600 } } } });

    cy.visit("/become-a-seller");

    cy.wait("@getVerificationsEmpty");
    cy.contains(/สมัครเป็นผู้ขาย/i).should("be.visible");
    cy.get('input[name="legalFirstName"]').should("exist");
    cy.get('input[name="legalLastName"]').should("exist");
    cy.get('input[name="bankAccountNumber"]').should("exist");
  });

  it("2. KYC Submission: fills legal details and submits application", () => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 2,
          email: "somchai.seller@example.com",
          username: "somchai_seller",
          displayName: "Somchai Cards Shop",
          roles: ["BUYER"],
        },
      },
    }).as("meCandidate");

    cy.intercept("GET", "**/api/v1/sellers/me/verifications", {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as("getVerificationsEmpty");

    cy.intercept("POST", "**/api/v1/uploads/presign", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          uploadUrl: "https://minio.example.com/mock-upload",
          objectKey: "verifications/bankbook-mock-key.jpg",
          expiresIn: 900,
        },
      },
    }).as("presignUpload");

    cy.intercept("PUT", "https://minio.example.com/mock-upload*", {
      statusCode: 200,
      body: "",
    }).as("s3Upload");

    cy.intercept("POST", "**/api/v1/sellers/me/verifications", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 1,
          userId: 2,
          legalFirstName: "Somchai",
          legalLastName: "Rakdee",
          bankCode: "KBANK",
          bankName: "Kasikornbank",
          bankAccountNumber: "0123456789",
          status: "SUBMITTED",
          submittedAt: "2026-10-15T00:00:00Z",
        },
      },
    }).as("submitVerification");

    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: "mock-candidate-token", expiresIn: 3600 } } } });

    cy.visit("/become-a-seller");

    cy.wait("@getVerificationsEmpty");

    // Fill KYC form fields
    cy.get('input[name="legalFirstName"]').type("Somchai");
    cy.get('input[name="legalLastName"]').type("Rakdee");
    cy.get('input[name="bankAccountNumber"]').type("0123456789");

    // Select Bank
    cy.get("#bankCode").click({ force: true });
    cy.contains('[role="option"]', /กสิกรไทย|Kasikorn/i).click({ force: true });

    // Upload mock bankbook image
    cy.get("input#bankBookImageKey").selectFile(
      {
        contents: Cypress.Buffer.from("mock bankbook content"),
        fileName: "bankbook.jpg",
        mimeType: "image/jpeg",
      },
      { force: true }
    );

    cy.wait("@presignUpload");
    cy.wait("@s3Upload");

    // Accept terms
    cy.get("#acceptTerms").click({ force: true });

    // Submit form
    cy.get('button[type="submit"]').should("not.be.disabled").click();
    cy.wait("@submitVerification");
    cy.contains(/ส่งคำขอเรียบร้อยแล้ว|ข้อมูลที่ส่งไป|คำขอ/i).should("be.visible");
  });

  it("3. Verification Status View: displays submitted status card while awaiting approval", () => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 2,
          email: "somchai.seller@example.com",
          username: "somchai_seller",
          displayName: "Somchai Cards Shop",
          roles: ["BUYER"],
        },
      },
    }).as("meCandidate");

    cy.intercept("GET", "**/api/v1/sellers/me/verifications", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            userId: 2,
            legalFirstName: "Somchai",
            legalLastName: "Rakdee",
            bankCode: "KBANK",
            bankName: "Kasikornbank",
            bankAccountNumber: "012-3-45678-9",
            status: "SUBMITTED",
            submittedAt: "2026-10-15T00:00:00Z",
          },
        ],
      },
    }).as("getVerificationsSubmitted");

    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: "mock-candidate-token", expiresIn: 3600 } } } });

    cy.visit("/become-a-seller");

    cy.wait("@getVerificationsSubmitted");
    cy.contains(/ส่งคำขอเรียบร้อยแล้ว|ข้อมูลที่ส่งไป|คำขอ/i).should("be.visible");
    cy.contains(/Somchai Rakdee/i).should("exist");
  });

  it("4. Admin Review: admin views pending seller verification queue", () => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: "admin@example.com",
          username: "admin_user",
          displayName: "Platform Admin",
          roles: ["ADMIN"],
        },
      },
    }).as("meAdmin");

    cy.intercept("GET", "**/api/v1/admin/verifications*", (req) => {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      if (status === "SUBMITTED") {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              items: [
                {
                  id: 1,
                  userId: 2,
                  username: "somchai_seller",
                  legalFirstName: "Somchai",
                  legalLastName: "Rakdee",
                  bankCode: "KBANK",
                  bankName: "Kasikornbank",
                  bankAccountNumber: "012-3-45678-9",
                  status: "SUBMITTED",
                  submittedAt: "2026-10-15T00:00:00Z",
                },
              ],
              totalItems: 1,
              totalPages: 1,
              total: 1,
              page: 0,
              size: 20,
              pageSize: 20,
            },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              items: [],
              totalItems: 0,
              totalPages: 0,
              total: 0,
              page: 0,
              size: 20,
              pageSize: 20,
            },
          },
        });
      }
    }).as("getQueue");

    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: "mock-admin-token", expiresIn: 3600 } } } });

    cy.visit("/admin/sellers");

    cy.wait("@getQueue");
    cy.contains(/อนุมัติผู้ขาย/i).should("be.visible");
    cy.contains(/Somchai Rakdee|somchai_seller/i).should("be.visible");
  });

  it("5. Admin Approval: admin inspects and approves verification", () => {
    const mockSubmittedVerification = {
      id: 1,
      sellerProfileId: 10,
      userId: 2,
      username: "somchai_seller",
      legalFirstName: "Somchai",
      legalLastName: "Rakdee",
      bankCode: "KBANK",
      bankName: "Kasikornbank",
      bankAccountNumber: "0123456789",
      bankBookImageKey: "verifications/bankbook.jpg",
      bankBookImageUrl: null,
      status: "SUBMITTED",
      submittedAt: "2026-10-15T00:00:00Z",
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      sellerAvatarUrl: null,
    };

    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          email: "admin@example.com",
          username: "admin_user",
          displayName: "Platform Admin",
          roles: ["ADMIN"],
        },
      },
    }).as("meAdmin");

    cy.intercept("GET", "**/api/v1/admin/verifications*", (req) => {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      if (status === "SUBMITTED") {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              items: [mockSubmittedVerification],
              totalItems: 1,
              totalPages: 1,
              total: 1,
              page: 0,
              size: 20,
              pageSize: 20,
            },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              items: [],
              totalItems: 0,
              totalPages: 0,
              total: 0,
              page: 0,
              size: 20,
              pageSize: 20,
            },
          },
        });
      }
    }).as("getQueue");

    cy.intercept("POST", "**/api/v1/admin/verifications/1/start-review", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockSubmittedVerification,
          status: "UNDER_REVIEW",
          reviewedBy: 1,
          reviewedAt: "2026-10-15T01:00:00Z",
        },
      },
    }).as("startReview");

    cy.intercept("POST", "**/api/v1/admin/verifications/1/approve", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...mockSubmittedVerification,
          status: "APPROVED",
          reviewedBy: 1,
          reviewedAt: "2026-10-15T01:05:00Z",
        },
      },
    }).as("approveVerification");

    cy.intercept("POST", "**/api/v1/auth/refresh", { statusCode: 200, body: { success: true, data: { tokens: { accessToken: "mock-admin-token", expiresIn: 3600 } } } });

    cy.visit("/admin/sellers");

    cy.wait("@getQueue");
    cy.contains(/Somchai Rakdee/i).should("be.visible").click();
    cy.wait("@startReview");

    cy.contains("button", "อนุมัติเปิดร้าน").should("be.visible").click();
    cy.wait("@approveVerification");
    cy.contains(/อนุมัติแล้ว/i).should("be.visible");
  });
});
