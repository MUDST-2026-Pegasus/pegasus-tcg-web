import { cn } from "@/lib/utils";

/**
 * ข้อความใต้ช่อง (S3-E) — บรรทัดแรกเป็นหัวข้อ บรรทัดที่เหลือเป็นคำอธิบาย
 * ข้อความมาจาก `issueMessage` ใน auction-form.schema
 */
export function AuctionFieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  const [title, ...detail] = message.split("\n");
  return (
    <div role="alert" className={cn("flex flex-col gap-0.5 text-xs", className)}>
      <p className="font-medium text-destructive">{title}</p>
      {detail.length > 0 ? <p className="text-destructive/80">{detail.join(" ")}</p> : null}
    </div>
  );
}
