import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangePicker, type DateRangeValue } from "@/components/common/DateRangePicker";

function Harness({ initial, spy, ...rest }: { initial: DateRangeValue; spy: (v: DateRangeValue) => void; min?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <DateRangePicker
      aria-label="ช่วงวัน"
      value={value}
      onChange={(next) => {
        setValue(next);
        spy(next);
      }}
      {...rest}
    />
  );
}

const day = (n: number) => within(screen.getByRole("grid")).getByRole("button", { name: new RegExp(`\\b${n}\\b`) });

describe("DateRangePicker", () => {
  it("shows the placeholder when empty", () => {
    render(<Harness initial={{ from: "", to: "" }} spy={vi.fn()} />);
    expect(screen.getByRole("button", { name: "ช่วงวัน" })).toHaveTextContent("เลือกช่วงวัน");
  });

  it("labels a range in Thai", () => {
    render(<Harness initial={{ from: "2026-01-05", to: "2026-01-10" }} spy={vi.fn()} />);
    expect(screen.getByRole("button", { name: "ช่วงวัน" })).toHaveTextContent(/5 ม\.ค\. 2569.*10 ม\.ค\. 2569/);
  });

  it("extends a range to the clicked day as local YYYY-MM-DD", async () => {
    const spy = vi.fn();
    render(<Harness initial={{ from: "2026-01-05", to: "2026-01-05" }} spy={spy} />);
    await userEvent.click(screen.getByRole("button", { name: "ช่วงวัน" }));
    await userEvent.click(day(20));
    expect(spy).toHaveBeenLastCalledWith({ from: "2026-01-05", to: "2026-01-20" });
  });

  it("clears the range", async () => {
    const spy = vi.fn();
    render(<Harness initial={{ from: "2026-01-05", to: "2026-01-10" }} spy={spy} />);
    await userEvent.click(screen.getByRole("button", { name: "ช่วงวัน" }));
    await userEvent.click(screen.getByRole("button", { name: "ล้าง" }));
    expect(spy).toHaveBeenLastCalledWith({ from: "", to: "" });
  });
});
