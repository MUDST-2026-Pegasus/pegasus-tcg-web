import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";

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
});
