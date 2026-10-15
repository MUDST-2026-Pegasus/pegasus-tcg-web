import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { AdminActivityLogPage } from "@/features/admin/pages/AdminActivityLogPage";

describe("AdminActivityLogPage", () => {
  it("renders activity log page placeholder", () => {
    renderWithProviders(<AdminActivityLogPage />, { route: "/admin/activity-log" });

    expect(screen.getByText("บันทึกกิจกรรม")).toBeInTheDocument();
    expect(screen.getByText(/432:6476/)).toBeInTheDocument();
  });
});
