import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import { createTestQueryClient } from "../utils";
import { clearSession, saveSession } from "@/lib/api/session";

describe("Address Book Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    saveSession({ accessToken: "test-access", expiresIn: 3600 });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearSession(false);
  });

  it("adds a new address and closes dialog on success", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => JSON.stringify({
        success: true,
        data: {
          id: "addr-1",
          label: "หน้าแรก",
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
    expect(screen.getByText("เพิ่มที่อยู่ใหม่")).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText("ชื่อที่อยู่"), "หน้าแรก");
    await user.type(screen.getByLabelText("ชื่อผู้รับ"), "Yugi Muto");
    await user.type(screen.getByLabelText("เบอร์โทรศัพท์"), "0891234567");
    await user.type(screen.getByLabelText("ที่อยู่บรรทัดที่ 1"), "123 Card Shop");
    await user.type(screen.getByLabelText("ที่อยู่บรรทัดที่ 2"), "Domino City");
    await user.type(screen.getByLabelText("ตำบล / แขวง"), "Downtown");
    await user.type(screen.getByLabelText("อำเภอ / เขต"), "Central");
    await user.type(screen.getByLabelText("จังหวัด"), "Tokyo");
    await user.type(screen.getByLabelText("รหัสไปรษณีย์"), "10110");
    await user.click(screen.getByRole("checkbox", { name: "ใช้เป็นที่อยู่จัดส่งหลัก" }));

    // Submit form
    await user.click(screen.getByRole("button", { name: "เพิ่มที่อยู่" }));

    // Verify API called
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/addresses"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            label: "หน้าแรก",
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
