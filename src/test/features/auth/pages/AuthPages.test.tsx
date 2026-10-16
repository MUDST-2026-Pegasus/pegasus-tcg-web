import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import {
  AuthPageSkeleton,
  CARD_CONTAINER_CLASS,
  CARD_WIDTH_CLASS,
  LoginPageSkeleton,
  RegisterPageSkeleton,
} from "@/components/common/PageSkeletons";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/auth/components/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form">Login Form Mock</div>,
}));

vi.mock("@/features/auth/components/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form">Register Form Mock</div>,
}));

describe("Auth Pages", () => {
  it("renders LoginPage with header and LoginForm", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByText("Log in to Pegasus")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders RegisterPage with header and RegisterForm", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(screen.getByText("Sign up to continue")).toBeInTheDocument();
    expect(screen.getByText(/To like or purchase an item/i)).toBeInTheDocument();
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });

  describe("Auth Page Skeletons", () => {
    it("exports consistent card width and container classes", () => {
      expect(CARD_WIDTH_CLASS).toBe("w-full max-w-2xl");
      expect(CARD_CONTAINER_CLASS).toContain("max-w-2xl");
      expect(CARD_CONTAINER_CLASS).toContain("rounded-xl");
    });

    it("renders LoginPageSkeleton with accessibility attributes and 220px header", () => {
      const { container } = renderWithProviders(<LoginPageSkeleton />);

      const skeletonCard = screen.getByRole("status", { name: "กำลังโหลดหน้าเข้าสู่ระบบ..." });
      expect(skeletonCard).toBeInTheDocument();
      expect(skeletonCard).toHaveAttribute("aria-busy", "true");
      expect(skeletonCard).toHaveClass("max-w-2xl");

      const header = container.querySelector(".h-\\[220px\\]");
      expect(header).toBeInTheDocument();
    });

    it("renders RegisterPageSkeleton with accessibility attributes and 256px header", () => {
      const { container } = renderWithProviders(<RegisterPageSkeleton />);

      const skeletonCard = screen.getByRole("status", { name: "กำลังโหลดหน้าลงทะเบียน..." });
      expect(skeletonCard).toBeInTheDocument();
      expect(skeletonCard).toHaveAttribute("aria-busy", "true");
      expect(skeletonCard).toHaveClass("max-w-2xl");

      const header = container.querySelector(".h-64");
      expect(header).toBeInTheDocument();
    });

    it("supports AuthPageSkeleton with variant prop", () => {
      const { rerender } = renderWithProviders(<AuthPageSkeleton variant="login" />);
      expect(screen.getByRole("status", { name: "กำลังโหลดหน้าเข้าสู่ระบบ..." })).toBeInTheDocument();

      rerender(<AuthPageSkeleton variant="register" />);
      expect(screen.getByRole("status", { name: "กำลังโหลดหน้าลงทะเบียน..." })).toBeInTheDocument();
    });
  });
});

