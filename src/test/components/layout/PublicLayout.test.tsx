import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet" />,
  };
});

vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar" />,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer" />,
}));

describe("PublicLayout", () => {
  it("renders Navbar, Outlet and Footer in order", () => {
    const { container } = render(
      <BrowserRouter>
        <PublicLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    const children = container.firstElementChild?.children;
    expect(children?.[0].tagName.toLowerCase()).toBe("nav"); // Navbar
    expect(children?.[1].tagName.toLowerCase()).toBe("main"); // Main wrapping outlet
    expect(children?.[2].tagName.toLowerCase()).toBe("footer"); // Footer
  });
});
