import { act, render, waitFor } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PageTitleSync } from "@/components/layout/PageTitleSync";
import { usePageTitle } from "@/hooks/use-page-title";

function Detail({ name }: { name?: string }) {
  usePageTitle(name);
  return null;
}

function setup(name?: string) {
  const router = createMemoryRouter(
    [{
      element: <><PageTitleSync /><Outlet /></>,
      children: [
        { path: "cart", handle: { title: "ตะกร้าสินค้า" }, element: null },
        { path: "p", handle: { title: "สินค้า" }, element: <Detail name={name} /> },
        { path: "plain", element: null },
      ],
    }],
    { initialEntries: ["/cart"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("page title", () => {
  it("uses handle title, override, then clears override on leave", async () => {
    const router = setup("Pikachu");
    await waitFor(() => expect(document.title).toBe("ตะกร้าสินค้า | Pegasus TCG"));
    await act(() => router.navigate("/p"));
    expect(document.title).toBe("Pikachu | Pegasus TCG");
    await act(() => router.navigate("/plain"));
    expect(document.title).toBe("Pegasus TCG");
    await act(() => router.navigate(-1));
    expect(document.title).toBe("Pikachu | Pegasus TCG");
  });

  it("falls back to handle title while data is loading", async () => {
    const router = setup(undefined);
    await act(() => router.navigate("/p"));
    expect(document.title).toBe("สินค้า | Pegasus TCG");
  });
});
