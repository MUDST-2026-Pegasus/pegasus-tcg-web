import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { publicRoutes } from "@/app/routes/public.routes";
import { createTestQueryClient } from "@/test/utils";

describe("public 404 route", () => {
  it("renders the not found page inside the public layout and follows its links", async () => {
    const router = createMemoryRouter([publicRoutes], { initialEntries: ["/abc"] });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "ไม่พบหน้าที่คุณกำลังหา" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.queryByText("ยังไม่ได้ทำหน้านี้")).not.toBeInTheDocument();
    expect(document.title).toContain("ไม่พบหน้านี้");
    for (const [name, href] of [
      ["กลับหน้าแรก", "/"],
      ["ดูสินค้าทั้งหมด", "/products"],
      ["Pokémon", "/pokemon"],
      ["One Piece", "/one-piece"],
      ["ตะกร้าสินค้า", "/cart"],
      ["เกี่ยวกับเรา", "/about"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }

    const search = screen.getByRole("searchbox", { name: "ค้นหาการ์ด สินค้า หรือร้านค้า" });
    await userEvent.type(search, "   ");
    await userEvent.keyboard("{Enter}");
    expect(router.state.location.pathname).toBe("/abc");

    await userEvent.clear(search);
    await userEvent.type(search, "  Pikachu card  {Enter}");
    await waitFor(() => expect(router.state.location.pathname).toBe("/search"));
    expect(router.state.location.search).toBe("?q=Pikachu%20card");
  });
});
