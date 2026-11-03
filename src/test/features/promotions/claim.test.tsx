import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { toast } from "@/components/ui/toast";
import * as authQueries from "@/features/auth/auth.queries";
import { ClaimTicket } from "@/features/promotions/ClaimTicket";
import { ClaimTicketRail } from "@/features/promotions/ClaimTicketRail";
import { PendingClaimRunner } from "@/features/promotions/PendingClaimRunner";
import { claimApi } from "@/features/promotions/claim.api";
import {
  authRedirectTarget,
  claimAuthUrl,
  rememberPendingClaim,
  safeNextPath,
} from "@/features/promotions/claim-redirect";
import { isExpiringSoon } from "@/features/promotions/claim.format";
import type { ClaimableCode, ClaimResult } from "@/features/promotions/claim.types";
import { ApiError } from "@/lib/api";
import { createTestQueryClient, render } from "@/test/utils";

const pegasus10: ClaimableCode = {
  id: 41,
  code: "PEGASUS10",
  name: "ลด 10% ทุกเกม",
  description: null,
  ownerType: "PLATFORM",
  shop: null,
  discountType: "PERCENT",
  discountValue: 10,
  maxDiscount: 200,
  minSpend: 500,
  endsAt: "2026-11-30T16:59:59Z",
  claimRequired: true,
  remainingClaims: 80,
  claimed: false,
};

const shopCode: ClaimableCode = {
  ...pegasus10,
  id: 42,
  code: "CVBKK100",
  name: "ลด ฿100 สินค้าในร้าน",
  ownerType: "SELLER",
  shop: { sellerProfileId: 6, name: "CardVault BKK", username: "cardvaultbkk" },
  discountType: "FIXED",
  discountValue: 100,
  maxDiscount: null,
  minSpend: 2000,
};

const result = (alreadyClaimed: boolean): ClaimResult => ({
  claim: { id: 9, promotionId: 41, code: "PEGASUS10", source: "HOME", claimedAt: "2026-11-02T00:00:00Z" },
  alreadyClaimed,
});

function signedIn(isAuthenticated: boolean) {
  vi.spyOn(authQueries, "useAuth").mockReturnValue({
    isAuthenticated,
    isLoading: false,
    user: isAuthenticated ? { id: 7, username: "buyer" } : null,
    roles: [],
    hasRole: () => false,
  } as unknown as ReturnType<typeof authQueries.useAuth>);
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}{location.search}</p>;
}

function renderRail(codes: ClaimableCode[], route = "/") {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="*" element={<><ClaimTicketRail codes={codes} source="HOME" /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ClaimTicket", () => {
  it.each([
    { state: "claimable", code: pegasus10, button: "เก็บโค้ด PEGASUS10", note: "เหลือ 80 สิทธิ์" },
    { state: "claimed", code: { ...pegasus10, claimed: true }, button: "เก็บแล้ว", note: "ใช้ได้ในตะกร้า" },
    { state: "sold out", code: { ...pegasus10, remainingClaims: 0 }, button: "หมดแล้ว", note: "ถูกเก็บครบแล้ว" },
  ])("shows the $state state", ({ code, button, note }) => {
    render(<ClaimTicket promotion={code} onClaim={vi.fn()} />);
    expect(screen.getByRole("button", { name: button })).toBeInTheDocument();
    expect(screen.getByText(note)).toBeInTheDocument();
  });

  it("labels Pegasus and shop codes and shows unlimited codes", () => {
    render(
      <>
        <ClaimTicket promotion={{ ...pegasus10, remainingClaims: null }} />
        <ClaimTicket promotion={shopCode} />
      </>,
    );
    expect(screen.getByText("PEGASUS")).toBeInTheDocument();
    expect(screen.getByText("สูงสุด ฿200")).toBeInTheDocument();
    expect(screen.getByText("ไม่จำกัดจำนวน")).toBeInTheDocument();
    expect(screen.getByText("SHOP")).toBeInTheDocument();
    expect(screen.getByText("CardVault BKK")).toBeInTheDocument();
    expect(screen.getByText("ขั้นต่ำ ฿2,000 จากร้านนี้")).toBeInTheDocument();
  });

  it("hides the button for a shop looking at its own codes", () => {
    render(<ClaimTicket promotion={shopCode} hideAction onClaim={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /เก็บโค้ด/ })).not.toBeInTheDocument();
  });

  it("opens terms from the ticket without the claim button doing it too", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    const onOpenTerms = vi.fn();
    render(<ClaimTicket promotion={pegasus10} onClaim={onClaim} onOpenTerms={onOpenTerms} />);
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด PEGASUS10" }));
    expect(onClaim).toHaveBeenCalledOnce();
    expect(onOpenTerms).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "เงื่อนไขโค้ด PEGASUS10" }));
    expect(onOpenTerms).toHaveBeenCalledOnce();
  });
});

describe("ClaimTicketRail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
  });

  it("puts collected codes last", () => {
    signedIn(true);
    renderRail([{ ...pegasus10, claimed: true }, shopCode]);
    const codes = within(screen.getByRole("list", { name: "โค้ดส่วนลด" })).getAllByRole("listitem");
    expect(codes[0]).toHaveTextContent("ลด ฿100 สินค้าในร้าน");
    expect(codes[1]).toHaveTextContent("ลด 10% ทุกเกม");
  });

  it("marks a code as collected straight away", async () => {
    const user = userEvent.setup();
    signedIn(true);
    let resolve!: (value: ClaimResult) => void;
    vi.spyOn(claimApi, "claim").mockReturnValue(new Promise((done) => { resolve = done; }));
    const client = createTestQueryClient();
    client.setQueryData(["promotions", "featured", 7], [pegasus10]);
    function FromCache() {
      const codes = client.getQueryData<ClaimableCode[]>(["promotions", "featured", 7]) ?? [];
      return <ClaimTicketRail codes={codes} source="HOME" />;
    }
    const { rerender } = render(
      <QueryClientProvider client={client}><MemoryRouter><FromCache /></MemoryRouter></QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "เก็บโค้ด PEGASUS10" }));
    rerender(<QueryClientProvider client={client}><MemoryRouter><FromCache /></MemoryRouter></QueryClientProvider>);
    expect(client.getQueryData<ClaimableCode[]>(["promotions", "featured", 7])?.[0].claimed).toBe(true);
    expect(claimApi.claim).toHaveBeenCalledWith(41, "HOME");
    resolve(result(false));
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "เก็บ PEGASUS10 แล้ว · ใช้ได้ในตะกร้า" })));
  });

  it("treats collecting twice as success (alreadyClaimed)", async () => {
    const user = userEvent.setup();
    signedIn(true);
    vi.spyOn(claimApi, "claim").mockResolvedValue(result(true));
    renderRail([pegasus10]);
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด PEGASUS10" }));
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "เก็บ PEGASUS10 ไว้แล้ว · ใช้ได้ในตะกร้า" })));
  });

  it("toasts when every copy is gone", async () => {
    const user = userEvent.setup();
    signedIn(true);
    vi.spyOn(claimApi, "claim").mockRejectedValue(
      new ApiError({ status: 409, code: "PROMO_CLAIM_FULL", message: "full" }));
    renderRail([pegasus10]);
    await user.click(screen.getByRole("button", { name: "เก็บโค้ด PEGASUS10" }));
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", title: "โค้ดนี้ถูกเก็บครบแล้ว" })));
  });

  it("asks a guest to sign in and sends them back to collect the code", async () => {
    const user = userEvent.setup();
    signedIn(false);
    const claim = vi.spyOn(claimApi, "claim");
    renderRail([pegasus10], "/u/cardvaultbkk?tab=reviews");

    await user.click(screen.getByRole("button", { name: "เก็บโค้ด PEGASUS10" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("เข้าสู่ระบบเพื่อเก็บโค้ด")).toBeInTheDocument();
    // Buttons rendered as router links.
    expect(within(dialog).getByText("เข้าสู่ระบบ", { selector: "a" })).toHaveAttribute(
      "href", "/login?next=%2Fu%2Fcardvaultbkk%3Ftab%3Dreviews&claim=41");
    expect(within(dialog).getByText("สมัครสมาชิก", { selector: "a" })).toHaveAttribute(
      "href", "/register?next=%2Fu%2Fcardvaultbkk%3Ftab%3Dreviews&claim=41");
    expect(claim).not.toHaveBeenCalled();
  });
});

describe("sign-in to claim", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.spyOn(toast, "add").mockImplementation(vi.fn());
  });

  it("only follows same-site next paths", () => {
    expect(safeNextPath("/u/shop?tab=reviews")).toBe("/u/shop?tab=reviews");
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(authRedirectTarget("?next=%2Fcart", null)).toBe("/cart");
    expect(authRedirectTarget("?next=https%3A%2F%2Fevil.example", { from: { pathname: "/account/orders" } }))
      .toBe("/account/orders");
    expect(claimAuthUrl("/login", "/", 41)).toBe("/login?next=%2F&claim=41");
  });

  it("collects the remembered code once the buyer is back and signed in", async () => {
    signedIn(true);
    const claim = vi.spyOn(claimApi, "claim").mockResolvedValue(result(false));
    rememberPendingClaim("?next=%2F&claim=41");
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter><PendingClaimRunner /></MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(claim).toHaveBeenCalledWith(41, undefined));
    expect(claim).toHaveBeenCalledOnce();
    await waitFor(() => expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: "เก็บ PEGASUS10 แล้ว · ใช้ได้ในตะกร้า" })));
  });

  it("does nothing for a guest", () => {
    signedIn(false);
    const claim = vi.spyOn(claimApi, "claim");
    rememberPendingClaim("?claim=41");
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter><PendingClaimRunner /></MemoryRouter>
      </QueryClientProvider>,
    );
    expect(claim).not.toHaveBeenCalled();
  });
});

describe("isExpiringSoon", () => {
  const now = Date.parse("2026-11-02T00:00:00Z");
  it.each([
    ["2026-11-04T23:00:00Z", true],
    ["2026-11-05T00:00:00Z", true],
    ["2026-11-06T00:00:01Z", false],
    ["2026-11-01T00:00:00Z", false],
  ])("%s → %s", (endsAt, soon) => {
    expect(isExpiringSoon(endsAt, now)).toBe(soon);
  });
});
