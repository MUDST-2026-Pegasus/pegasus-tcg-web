import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { StoreProfilePage } from "@/features/store/pages/StoreProfilePage";
import { STORE_PROFILE_FIXTURE } from "@/features/store/store.fixture";
import { renderWithProviders } from "../../utils";

describe("StoreProfilePage", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("renders store name, avatar initials, and cover banner", () => {
    renderWithProviders(<StoreProfilePage />);

    expect(screen.getByText(STORE_PROFILE_FIXTURE.store.name)).toBeInTheDocument();
    expect(screen.getByText(STORE_PROFILE_FIXTURE.store.initials)).toBeInTheDocument();
    expect(
      screen.getByAltText(STORE_PROFILE_FIXTURE.store.coverImageAlt),
    ).toBeInTheDocument();
  });

  it("renders store operational statistics", () => {
    renderWithProviders(<StoreProfilePage />);

    for (const stat of STORE_PROFILE_FIXTURE.stats) {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
      expect(screen.getByText(stat.value)).toBeInTheDocument();
    }
  });

  it("renders category tabs and recommended product items", () => {
    renderWithProviders(<StoreProfilePage />);

    // Tabs
    for (const tab of STORE_PROFILE_FIXTURE.tabs) {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
    }

    // Recommended section
    expect(
      screen.getByRole("heading", { name: "Recommended for You" }),
    ).toBeInTheDocument();

    // Products
    for (const product of STORE_PROFILE_FIXTURE.products) {
      expect(screen.getByText(product.name)).toBeInTheDocument();
    }
  });
});
