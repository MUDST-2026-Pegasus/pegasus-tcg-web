import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { RootLayout } from "@/components/layout/RootLayout";

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("renders child routes via Outlet and includes ScrollRestoration", () => {
    const router = createMemoryRouter([
      {
        element: <RootLayout />,
        children: [
          {
            path: "/",
            element: <div data-testid="child-page">Home Page Content</div>,
          },
        ],
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(screen.getByTestId("child-page")).toBeInTheDocument();
    expect(screen.getByText("Home Page Content")).toBeInTheDocument();
  });
});
