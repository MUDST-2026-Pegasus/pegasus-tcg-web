import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { publicRoutes } from "@/app/routes/public.routes";
import { createTestQueryClient } from "@/test/utils";

describe("old /store route", () => {
  it("sends links to the removed store page on to the seller's public store", async () => {
    const router = createMemoryRouter([publicRoutes], { initialEntries: ["/store/pegasus_official"] });
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(router.state.location.pathname).toBe("/u/pegasus_official"));
  });
});
