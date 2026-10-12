import { useLayoutEffect, useRef } from "react";

import { Input } from "@/components/ui/input";

import { groupThousands, sanitizeNumberInput } from "../products.format";

type AmountInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange" | "ref"
> & {
  /** ตัวเลขล้วนไม่มีคอมมา เช่น "8800" */
  value: string;
  onValueChange: (value: string) => void;
  /** false = จำนวนเต็มเท่านั้น เช่น จำนวนใบ */
  allowDecimal?: boolean;
};

/**
 * ช่องกรอกตัวเลขที่คั่นหลักพันให้ตลอด ("8,800") ตามดีไซน์
 *
 * ทุกครั้งที่พิมพ์ คอมมาถูกจัดใหม่และเคอร์เซอร์จะเด้งไปท้ายช่อง จึงจำไว้ว่าหน้าเคอร์เซอร์
 * มีตัวเลขกี่ตัว แล้ววางเคอร์เซอร์กลับหลังตัวเลขตัวนั้นหลัง render
 */
export function AmountInput({
  value,
  onValueChange,
  allowDecimal = true,
  ...props
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);
  const displayValue = groupThousands(value);

  // ไม่ใส่ dependency — ต้องวางเคอร์เซอร์คืนแม้พิมพ์ตัวที่ถูกกรองทิ้งจนค่าไม่เปลี่ยน
  useLayoutEffect(() => {
    const input = inputRef.current;
    const digits = caretDigits.current;
    if (!input || digits === null || document.activeElement !== input) return;
    caretDigits.current = null;

    let position = 0;
    let seen = 0;
    while (position < displayValue.length && seen < digits) {
      if (displayValue[position] !== ",") seen += 1;
      position += 1;
    }
    input.setSelectionRange(position, position);
  });

  return (
    <Input
      {...props}
      ref={inputRef}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={displayValue}
      onChange={(event) => {
        const { value: typed, selectionStart } = event.target;
        const beforeCaret = typed.slice(0, selectionStart ?? typed.length);
        caretDigits.current = sanitizeNumberInput(
          beforeCaret,
          allowDecimal,
        ).length;
        onValueChange(sanitizeNumberInput(typed, allowDecimal));
      }}
    />
  );
}
