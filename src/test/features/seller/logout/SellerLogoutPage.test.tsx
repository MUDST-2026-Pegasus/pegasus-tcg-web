import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { SellerLogoutPage } from "@/features/seller/logout/SellerLogoutPage";
import { renderWithProviders } from "@/test/utils";

describe("SellerLogoutPage", () => {
  it("renders page placeholder with title", () => {
    renderWithProviders(<SellerLogoutPage />, { route: "/seller/logout" });

    expect(screen.getByText("ออกจากระบบ")).toBeInTheDocument();
  });
});
