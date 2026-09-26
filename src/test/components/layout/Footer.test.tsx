import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders the PEGASUS title", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText("PEGASUS")).toBeInTheDocument();
  });

  it("renders all footer links", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    const links = [
      "Terms of Service",
      "Privacy Policy",
      "Shipping Info",
      "Authenticity Guarantee",
      "Contact Us",
    ];

    for (const link of links) {
      expect(screen.getByText(link)).toBeInTheDocument();
    }
  });

  it("renders copyright notice", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText(/2026 PEGASUS TCG\. ALL RIGHTS RESERVED\./)).toBeInTheDocument();
  });
});
