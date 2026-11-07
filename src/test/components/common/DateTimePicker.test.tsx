import { beforeEach } from "vitest";
import { setLanguage } from "@/lib/language";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateTimePicker } from "@/components/common";

function Harness({ initial = "", onChange }: { initial?: string; onChange: (value: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <DateTimePicker
      aria-label="เริ่ม"
      defaultTime="23:59"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

/** ปุ่มวันในปฏิทิน — ชื่อที่อ่านออกเสียงมีปีอยู่ด้วย จึงเทียบจากตัวเลขที่เห็น */
async function dayButton(day: number) {
  const buttons = await screen.findAllByRole("button");
  const match = buttons.find((button) => button.textContent === String(day) && !button.closest("[data-outside]"));
  if (!match) throw new Error(`day ${day} not found`);
  return match;
}

describe("DateTimePicker", () => {
  it("shows the placeholder, then picks a day with the default time and changes the hour", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-11-05T10:30" onChange={onChange} />);

    const trigger = screen.getByRole("button", { name: "เริ่ม" });
    expect(trigger).toHaveTextContent("10:30");

    await user.click(trigger);
    await user.click(await dayButton(12));
    expect(onChange).toHaveBeenLastCalledWith("2026-11-12T10:30");

    await user.click(screen.getByRole("combobox", { name: "ชั่วโมง" }));
    await user.click(await screen.findByRole("option", { name: "08" }));
    expect(onChange).toHaveBeenLastCalledWith("2026-11-12T08:30");
  });

  it("uses the default time for the first pick", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const trigger = screen.getByRole("button", { name: "เริ่ม" });
    expect(trigger).toHaveTextContent("เลือกวันและเวลา");
    await user.click(trigger);
    await user.click(await dayButton(15));
    expect(onChange.mock.lastCall?.[0]).toMatch(/^\d{4}-\d{2}-15T23:59$/);
  });

  it("returns a date-only value in date mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateTimePicker aria-label="วันวางจำหน่าย" mode="date" value="2026-03-01" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "วันวางจำหน่าย" }));
    await user.click(await dayButton(20));
    expect(onChange).toHaveBeenCalledWith("2026-03-20");
    expect(screen.queryByRole("combobox", { name: "ชั่วโมง" })).not.toBeInTheDocument();
  });
});

beforeEach(() => setLanguage("th"));
