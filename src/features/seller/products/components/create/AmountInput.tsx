import { useState } from "react";

import { Input } from "@/components/ui/input";

import { groupThousands, sanitizeNumberInput } from "../../product-create.form";

type AmountInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  /** false = จำนวนเต็มเท่านั้น เช่น จำนวนใบ */
  allowDecimal?: boolean;
};

/**
 * ช่องกรอกตัวเลข — ระหว่างพิมพ์เป็นตัวเลขล้วน พอออกจากช่องแสดงคอมมาคั่นหลักพัน
 * ตามดีไซน์ ("1,290") ไม่จัดรูปแบบระหว่างพิมพ์เพราะเคอร์เซอร์จะกระโดด
 */
export function AmountInput({
  value,
  onValueChange,
  allowDecimal = true,
  onFocus,
  onBlur,
  ...props
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Input
      {...props}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={isFocused ? value : groupThousands(value)}
      onChange={(event) =>
        onValueChange(sanitizeNumberInput(event.target.value, allowDecimal))
      }
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
    />
  );
}
