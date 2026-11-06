import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ELIGIBLE_UNIT_PAGE_FIXTURE } from "@/features/auction/auction.fixture";
import { emptyAuctionForm } from "@/features/seller/auctions/auction-form.schema";
import { CloseTimePicker } from "@/features/seller/auctions/components/CloseTimePicker";
import { ConfirmOpenAuctionDialog } from "@/features/seller/auctions/components/ConfirmOpenAuctionDialog";

/** ศ. 30 ต.ค. 2026 14:00 เวลาไทย */
const NOW = Date.parse("2026-10-30T14:00:00+07:00");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CloseTimePicker shortcuts", () => {
  it.each([
    ["+6 ชม.", "2026-10-30", "20:00"],
    ["+1 วัน", "2026-10-31", "14:00"],
    ["+3 วัน", "2026-11-02", "14:00"],
    ["+7 วัน", "2026-11-06", "14:00"],
  ])("%s sets the date and time from now", async (label, date, time) => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CloseTimePicker date="" time="" now={NOW} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: label }));

    expect(onChange).toHaveBeenCalledWith({ date, time });
  });

  it("shows when the auction closes and how long that is", () => {
    render(<CloseTimePicker date="2026-11-02" time="21:00" now={NOW} onChange={() => {}} />);
    expect(screen.getByText(/ปิด จ\. 2 พ\.ย\. 2026 เวลา 21:00 น\. \(อีก 3 วัน 7 ชม\.\)/)).toBeInTheDocument();
  });

  it("normalises a typed time on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CloseTimePicker date="2026-11-02" time="21:00" now={NOW} onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "เวลาปิดประมูล" });
    await user.clear(input);
    await user.type(input, "2115");
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith({ date: "2026-11-02", time: "21:15" });
  });
});

describe("ConfirmOpenAuctionDialog", () => {
  const unit = ELIGIBLE_UNIT_PAGE_FIXTURE.page.items[0];
  const values = {
    ...emptyAuctionForm(),
    unitUid: unit.unitUid,
    startingPrice: "1000",
    bidIncrement: "50",
    closeDate: "2026-11-02",
    closeTime: "21:00",
    buyNowEnabled: true,
    buyNowPrice: "1800",
  };

  function renderDialog(onConfirm = vi.fn()) {
    render(
      <ConfirmOpenAuctionDialog open onOpenChange={() => {}} unit={unit} values={values} now={NOW} pending={false} onConfirm={onConfirm} />,
    );
    return onConfirm;
  }

  it("summarises the auction", () => {
    renderDialog();
    expect(screen.getByRole("heading", { name: "เปิดประมูลการ์ดใบนี้?" })).toBeInTheDocument();
    expect(screen.getByText("฿1,000")).toBeInTheDocument();
    expect(screen.getByText("+฿50")).toBeInTheDocument();
    expect(screen.getByText("จ. 2 พ.ย. 2026 21:00 (อีก 3 วัน 7 ชม.)")).toBeInTheDocument();
    expect(screen.getByText("฿1,800 (จนกว่าจะมีบิดแรก)")).toBeInTheDocument();
    expect(screen.getByText("5% เท่าการขายปกติ")).toBeInTheDocument();
  });

  it("cannot open the auction until the seller ticks the checkbox", async () => {
    const user = userEvent.setup();
    const onConfirm = renderDialog();
    const open = screen.getByRole("button", { name: "เปิดประมูล" });

    expect(open).toBeDisabled();
    await user.click(open);
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox", { name: "ฉันเข้าใจว่าเมื่อมีผู้บิดแล้ว จะยกเลิกการประมูลไม่ได้" }));
    expect(open).toBeEnabled();
    await user.click(open);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
