import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import { env } from "@/lib/env";

describe("Address Book Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a new address and closes dialog on success", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        success: true,
        data: {
          id: "addr-1",
          label: "Home",
          recipientName: "Yugi Muto",
          phone: "0891234567",
          line1: "123 Card Shop",
          line2: "Domino City",
          subdistrict: "Downtown",
          district: "Central",
          province: "Tokyo",
          postalCode: "10110",
          defaultShipping: true,
        }
      }),
      json: async () => ({
        success: true,
        data: {
          id: "addr-1",
          label: "Home",
          recipientName: "Yugi Muto",
          phone: "0891234567",
          line1: "123 Card Shop",
          line2: "Domino City",
          subdistrict: "Downtown",
          district: "Central",
          province: "Tokyo",
          postalCode: "10110",
          defaultShipping: true,
        }
      })
    } as unknown as Response);

    const onOpenChange = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <AddressFormDialog open={true} onOpenChange={onOpenChange} />
      </QueryClientProvider>
    );

    // Wait for dialog to open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add New Address")).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/label/i), "Home");
    await user.type(screen.getByLabelText(/recipient name/i), "Yugi Muto");
    await user.type(screen.getByLabelText(/phone number/i), "0891234567");
    await user.type(screen.getByLabelText(/address line 1/i), "123 Card Shop");
    await user.type(screen.getByLabelText(/address line 2/i), "Domino City");
    await user.type(screen.getByLabelText(/subdistrict/i), "Downtown");
    await user.type(screen.getByLabelText(/^district/i), "Central");
    await user.type(screen.getByLabelText(/province/i), "Tokyo");
    await user.type(screen.getByLabelText(/postal code/i), "10110");
    await user.click(screen.getByRole("checkbox", { name: /default shipping address/i }));

    // Submit form
    await user.click(screen.getByRole("button", { name: /add address/i }));

    // Verify API called
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/addresses"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            label: "Home",
            recipientName: "Yugi Muto",
            phone: "0891234567",
            line1: "123 Card Shop",
            line2: "Domino City",
            subdistrict: "Downtown",
            district: "Central",
            province: "Tokyo",
            postalCode: "10110",
            countryCode: "TH",
            defaultShipping: true,
            defaultBilling: false,
          }),
        })
      );
    });

    // Verify dialog was requested to close
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
