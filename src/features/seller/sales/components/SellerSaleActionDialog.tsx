import { CirclePause, CirclePlay, Pause, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PromotionDialog } from "@/features/admin/components/PromotionDialog";
import { PROMOTION_DANGER_BUTTON } from "@/features/admin/promotions.styles";
import { hasErrorCode } from "@/lib/api";

import { sellerSaleErrorMessage } from "../sales.format";
import { useSellerSaleAction } from "../sales.queries";
import type { SellerSale } from "../sales.types";

export type SellerSaleActionKind = "pause" | "resume" | "end" | "delete" | "admin-paused";
export type SellerSaleActionState = { kind: SellerSaleActionKind; sale: SellerSale };

/** ช่องทางติดต่อทีมงานจากโมดัล "ทีมงานหยุด" */
const SUPPORT_HREF = "mailto:support@pegasus-tcg.com";

/** Figma SAL-M1 (Seller): จบก่อนกำหนด · ทีมงานหยุด (INFO ไม่มีปุ่มเปิด) · ลบ · หยุด/เปิดเอง */
export function SellerSaleActionDialog({
  action,
  onChange,
}: {
  action: SellerSaleActionState | null;
  onChange: (action: SellerSaleActionState | null) => void;
}) {
  const mutation = useSellerSaleAction();
  if (!action) return null;
  const { kind, sale } = action;
  const close = () => onChange(null);

  const run = (verb: "pause" | "resume" | "end" | "delete", success: string, failure: string) =>
    mutation.mutate(
      { id: sale.id, kind: verb },
      {
        onSuccess: () => {
          toast.add({ title: success, type: "success" });
          close();
        },
        onError: (error) => {
          if (verb === "resume" && hasErrorCode(error, "SALE_PAUSED")) {
            onChange({ kind: "admin-paused", sale: { ...sale, pausedByAdmin: true } });
            return;
          }
          if (verb === "delete" && hasErrorCode(error, "SALE_IN_USE")) {
            onChange({ kind: "end", sale });
            toast.add({ title: "มีออเดอร์แล้ว ลบไม่ได้ — จบก่อนกำหนดแทน", type: "info" });
            return;
          }
          toast.add({ title: failure, description: sellerSaleErrorMessage(error, "กรุณาลองอีกครั้ง"), type: "error" });
        },
      },
    );

  const pending = mutation.isPending;
  const cancel = (
    <Button variant="outline" disabled={pending} onClick={close}>
      ยกเลิก
    </Button>
  );

  switch (kind) {
    case "end":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="warning"
          icon={<Square />}
          title={`จบ “${sale.name}” ตอนนี้?`}
          description={`${sale.listingCount.toLocaleString("th-TH")} listing กลับเป็นราคาปกติทันที · ขายไปแล้ว ${sale.soldUnits.toLocaleString("th-TH")} ชิ้น ไม่กระทบ`}
          actions={
            <>
              {cancel}
              <Button
                className={PROMOTION_DANGER_BUTTON}
                disabled={pending}
                onClick={() => run("end", `จบ “${sale.name}” แล้ว`, "จบการลดราคาไม่สำเร็จ")}
              >
                จบตอนนี้
              </Button>
            </>
          }
        />
      );
    case "admin-paused":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="info"
          icon={<CirclePause />}
          title={`ทีมงานหยุด “${sale.name}”`}
          description={`เหตุผล: ${sale.pauseReason || "ไม่ได้ระบุ"} · แก้ราคาแล้วขอให้ทีมงานเปิดอีกครั้ง`}
          actions={
            <>
              <Button variant="outline" onClick={close}>
                ปิด
              </Button>
              <Button render={<a href={SUPPORT_HREF} />} nativeButton={false}>
                ติดต่อทีมงาน
              </Button>
            </>
          }
        />
      );
    case "delete":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="danger"
          icon={<Trash2 />}
          title={`ลบ “${sale.name}”?`}
          description={
            sale.status === "SCHEDULED"
              ? "ยังไม่เริ่มและยังไม่มีออเดอร์ ลบแล้วกู้คืนไม่ได้"
              : "ยังไม่มีออเดอร์ที่ใช้ราคานี้ ลบแล้วกู้คืนไม่ได้"
          }
          actions={
            <>
              {cancel}
              <Button
                className={PROMOTION_DANGER_BUTTON}
                disabled={pending}
                onClick={() => run("delete", `ลบ “${sale.name}” แล้ว`, "ลบไม่สำเร็จ")}
              >
                ลบ
              </Button>
            </>
          }
        />
      );
    case "pause":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="warning"
          icon={<Pause />}
          title={`หยุด “${sale.name}” ชั่วคราว?`}
          description={`${sale.listingCount.toLocaleString("th-TH")} listing กลับเป็นราคาปกติจนกว่าจะเปิดอีกครั้ง`}
          actions={
            <>
              {cancel}
              <Button disabled={pending} onClick={() => run("pause", `หยุด “${sale.name}” แล้ว`, "หยุดไม่สำเร็จ")}>
                หยุดชั่วคราว
              </Button>
            </>
          }
        />
      );
    case "resume":
      return (
        <PromotionDialog
          open
          onOpenChange={(open) => !open && close()}
          tone="success"
          icon={<CirclePlay />}
          title={`เปิด “${sale.name}” อีกครั้ง?`}
          description="listing ได้ราคาลดกลับภายใน 1 นาที"
          actions={
            <>
              {cancel}
              <Button disabled={pending} onClick={() => run("resume", `เปิด “${sale.name}” แล้ว`, "เปิดไม่สำเร็จ")}>
                เปิดอีกครั้ง
              </Button>
            </>
          }
        />
      );
  }
}
