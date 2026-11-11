import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/utils";

import { AboutPage } from "@/features/about/pages/AboutPage";
import { TermsOfServicePage } from "@/features/legal/pages/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/features/legal/pages/PrivacyPolicyPage";

describe("Legal and About Pages", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe("TermsOfServicePage", () => {
    it("renders Thai Terms of Service by default with core sections and governing clause", async () => {
      renderWithProviders(<TermsOfServicePage />);

      expect(
        screen.getByRole("heading", { level: 1, name: /ข้อกำหนดการใช้บริการ/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/ศูนย์ข้อมูลกฎหมาย/i)).toBeInTheDocument();

      // Lazy loaded content
      expect(
        await screen.findByRole("heading", { level: 2, name: /01.*บทนำ/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /02.*บัญชีผู้ใช้และการลงทะเบียน/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /03.*สินค้าและราคา/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /04.*การชำระเงินและการเรียกเก็บเงิน/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /05.*การจัดส่งและการคืนสินค้า/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /06.*การประมูล/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /07.*ข้อจำกัดความรับผิด/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /08.*ภาษาที่ใช้บังคับ/i })
      ).toBeInTheDocument();

      // Governing language clause
      expect(
        screen.getByText(/หากฉบับภาษาไทยและภาษาอังกฤษขัดแย้งกัน ให้ถือฉบับภาษาไทยเป็นหลัก/i)
      ).toBeInTheDocument();
    });

    it("renders English Terms of Service when language is en", async () => {
      renderWithProviders(<TermsOfServicePage />, { language: "en" });

      expect(
        screen.getByRole("heading", { level: 1, name: /Terms of Service/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/LEGAL CENTER/i)).toBeInTheDocument();

      // Lazy loaded content
      expect(
        await screen.findByRole("heading", { level: 2, name: /01.*Introduction/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /02.*Accounts and Registration/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /03.*Products and Pricing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /04.*Payment and Billing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /05.*Shipping and Returns/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /06.*Auctions/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /07.*Limitation of Liability/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /08.*Governing Language/i })
      ).toBeInTheDocument();

      // Governing language clause in English
      expect(
        screen.getByText(/the Thai version shall prevail/i)
      ).toBeInTheDocument();
    });

    it("updates active section highlight when clicking a sidebar item", async () => {
      renderWithProviders(<TermsOfServicePage />);

      const introButton = await screen.findByRole("button", { name: /01.*บทนำ/i });
      const accountsButton = screen.getByRole("button", { name: /02.*บัญชีผู้ใช้และการลงทะเบียน/i });

      expect(introButton).toHaveAttribute("data-active", "true");
      expect(accountsButton).toHaveAttribute("data-active", "false");

      await userEvent.click(accountsButton);

      expect(introButton).toHaveAttribute("data-active", "false");
      expect(accountsButton).toHaveAttribute("data-active", "true");
    });
  });

  describe("PrivacyPolicyPage", () => {
    it("renders Thai Privacy Policy by default with disclosures and governing clause", async () => {
      renderWithProviders(<PrivacyPolicyPage />);

      expect(
        screen.getByRole("heading", { level: 1, name: /นโยบายความเป็นส่วนตัว/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/ศูนย์ข้อมูลกฎหมาย/i)).toBeInTheDocument();

      // Lazy loaded content
      expect(
        await screen.findByRole("heading", { level: 2, name: /01.*ข้อมูลที่เราจัดเก็บ/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /02.*วิธีการใช้ข้อมูลของคุณ/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /03.*การเปิดเผยข้อมูล/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /04.*ความปลอดภัยของข้อมูล/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /05.*สิทธิของคุณ/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /06.*ติดต่อเรา/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /07.*ภาษาที่ใช้บังคับ/i })
      ).toBeInTheDocument();

      expect(screen.getByText(/ดำเนินการและจัดส่งคำสั่งซื้อ/i)).toBeInTheDocument();
      expect(screen.getByText(/ป้องกันการฉ้อโกงและรักษาความปลอดภัยของระบบ/i)).toBeInTheDocument();
      expect(
        screen.getByText(/หากฉบับภาษาไทยและภาษาอังกฤษขัดแย้งกัน ให้ถือฉบับภาษาไทยเป็นหลัก/i)
      ).toBeInTheDocument();
    });

    it("renders English Privacy Policy when language is en", async () => {
      renderWithProviders(<PrivacyPolicyPage />, { language: "en" });

      expect(
        screen.getByRole("heading", { level: 1, name: /Privacy Policy/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/LEGAL CENTER/i)).toBeInTheDocument();

      // Lazy loaded content
      expect(
        await screen.findByRole("heading", { level: 2, name: /01.*Information We Collect/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /02.*How We Use Your Information/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /03.*Information Sharing/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /04.*Data Security/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /05.*Your Rights/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /06.*Contact Us/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /07.*Governing Language/i })
      ).toBeInTheDocument();

      expect(screen.getByText(/Process and fulfill orders/i)).toBeInTheDocument();
      expect(screen.getByText(/Prevent fraud and protect system security/i)).toBeInTheDocument();
      expect(
        screen.getByText(/the Thai version shall prevail/i)
      ).toBeInTheDocument();
    });

    it("updates active section highlight when clicking a sidebar item", async () => {
      renderWithProviders(<PrivacyPolicyPage />);

      const infoButton = await screen.findByRole("button", { name: /01.*ข้อมูลที่เราจัดเก็บ/i });
      const usageButton = screen.getByRole("button", { name: /02.*วิธีการใช้ข้อมูลของคุณ/i });

      expect(infoButton).toHaveAttribute("data-active", "true");
      expect(usageButton).toHaveAttribute("data-active", "false");

      await userEvent.click(usageButton);

      expect(infoButton).toHaveAttribute("data-active", "false");
      expect(usageButton).toHaveAttribute("data-active", "true");
    });
  });

  describe("AboutPage", () => {
    it("renders About Us mission, community tagline, and team section", () => {
      renderWithProviders(<AboutPage />);

      expect(
        screen.getByRole("heading", { level: 1, name: /เติบโตไปด้วยกันกับชุมชน TCG/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Pegasus TCG คือพื้นที่สำหรับนักสะสม/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /เรื่องราวของเรา/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: /พบกับทีมงาน/i })
      ).toBeInTheDocument();
    });
  });
});
