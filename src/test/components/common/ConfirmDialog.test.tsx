import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const base = { open: true, onOpenChange: vi.fn(), title: "ลบรายการ", confirmLabel: "ลบ", onConfirm: vi.fn() };

describe("ConfirmDialog", () => {
  it("confirms without closing itself", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...base} onConfirm={onConfirm} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: "ลบ" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes on cancel", async () => {
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...base} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(onOpenChange.mock.calls[0][0]).toBe(false);
  });

  it("locks both buttons and ignores Escape while pending", async () => {
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...base} isPending onOpenChange={onOpenChange} />);
    expect(screen.getByRole("button", { name: /ลบ/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ยกเลิก" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows the error", () => {
    render(<ConfirmDialog {...base} error="ลบไม่สำเร็จ" />);
    expect(screen.getByText("ลบไม่สำเร็จ")).toBeInTheDocument();
  });
});
