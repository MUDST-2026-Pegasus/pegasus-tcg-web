import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { AboutPage } from "@/features/about/pages/AboutPage";
import { TermsOfServicePage } from "@/features/legal/pages/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/features/legal/pages/PrivacyPolicyPage";

describe("Legal and About Pages", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe("TermsOfServicePage", () => {
    it("renders Terms of Service heading and core policy sections", () => {
      render(
        <MemoryRouter>
          <TermsOfServicePage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { level: 1, name: /Terms of Service/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Introduction/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Accounts and Registration/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Products and Pricing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Payment and Billing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Shipping and Returns/i })
      ).toBeInTheDocument();
    });

    it("updates active section highlight when clicking a sidebar item", async () => {
      render(
        <MemoryRouter>
          <TermsOfServicePage />
        </MemoryRouter>
      );

      const introButton = screen.getByRole("button", { name: /01.*Introduction/i });
      const accountsButton = screen.getByRole("button", { name: /02.*Accounts and Registration/i });

      expect(introButton).toHaveAttribute("data-active", "true");
      expect(accountsButton).toHaveAttribute("data-active", "false");

      await userEvent.click(accountsButton);

      expect(introButton).toHaveAttribute("data-active", "false");
      expect(accountsButton).toHaveAttribute("data-active", "true");
    });
  });

  describe("PrivacyPolicyPage", () => {
    it("renders Privacy Policy heading and collection disclosures", () => {
      render(
        <MemoryRouter>
          <PrivacyPolicyPage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { level: 1, name: /Privacy Policy/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Information We Collect/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /How We Use Your Information/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Process and fulfill orders/i)).toBeInTheDocument();
      expect(screen.getByText(/Prevent fraud and protect system security/i)).toBeInTheDocument();
    });

    it("updates active section highlight when clicking a sidebar item", async () => {
      render(
        <MemoryRouter>
          <PrivacyPolicyPage />
        </MemoryRouter>
      );

      const infoButton = screen.getByRole("button", { name: /01.*Information We Collect/i });
      const usageButton = screen.getByRole("button", { name: /02.*How We Use Your Information/i });

      expect(infoButton).toHaveAttribute("data-active", "true");
      expect(usageButton).toHaveAttribute("data-active", "false");

      await userEvent.click(usageButton);

      expect(infoButton).toHaveAttribute("data-active", "false");
      expect(usageButton).toHaveAttribute("data-active", "true");
    });
  });

  describe("AboutPage", () => {
    it("renders About Us mission, community tagline, and team section", () => {
      render(
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      );

      expect(
        screen.getByRole("heading", { level: 1, name: /Empowering the TCG Community/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pegasus TCG is the premier destination for collectors/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Our Story/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /Meet the Team/i })
      ).toBeInTheDocument();
    });
  });
});
