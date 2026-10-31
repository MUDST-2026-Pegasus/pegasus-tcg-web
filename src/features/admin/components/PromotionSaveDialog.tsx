import { ArrowRight, CircleCheck, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  FIELD_LABEL,
  type ScopeNames,
  budgetFormula,
  budgetLabel,
  campaignBudget,
  discountCapLabel,
  formatFieldValue,
  formatPeriod,
  formatPromoDateTime,
  limitLabel,
  minSpendLabel,
  scopeLabel,
} from "../promotions.format";
import { changedPromotionFields, toPromotionInput } from "../promotions.schema";
import type { AdminPromotion, AdminPromotionInput } from "../promotions.types";
import { PromotionDialog } from "./PromotionDialog";

type PromotionSaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AdminPromotion;
  /** ค่าที่จะส่ง (ผ่าน `toPromotionPayload` แล้ว) */
  input: AdminPromotionInput;
  scopeNames: ScopeNames;
  pending: boolean;
  onConfirm: () => void;
};

/** "เปิดใช้โค้ด …?" ตอนสร้าง และ "บันทึกการเปลี่ยนแปลง?" ตอนแก้ (Figma PRM-M1) */
export function PromotionSaveDialog(props: PromotionSaveDialogProps) {
  return props.existing ? <EditDialog {...props} existing={props.existing} /> : <CreateDialog {...props} />;
}

function CreateDialog({ open, onOpenChange, input, scopeNames, pending, onConfirm }: PromotionSaveDialogProps) {
  const cap = discountCapLabel(input);
  const audience =
    input.visibility === "PRIVATE"
      ? "ผู้ซื้อกรอกรหัสเพื่อรับส่วนลดได้"
      : input.claimable
        ? "ผู้ซื้อจะเห็นและเก็บโค้ดได้"
        : "ผู้ซื้อจะเห็นโค้ดตอนชำระเงิน";
  const distribution = input.claimable
    ? `${limitLabel(input.claimLimit)} ใบ · ${input.featuredOnHome ? `หน้าแรก ลำดับ ${input.homeSort == null ? "ต่อท้าย" : input.homeSort + 1}` : "ไม่ขึ้นหน้าแรก"}`
    : "ใช้รหัสโดยตรง";

  return (
    <PromotionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="info"
      icon={<CircleCheck />}
      title={`เปิดใช้โค้ด ${input.code}?`}
      description={`${audience}ตั้งแต่ ${formatPromoDateTime(input.startsAt)} · Pegasus เป็นผู้ออกส่วนลด ร้านได้เงินเต็ม`}
      footerNote="หลังมีคนใช้ แก้ประเภท/มูลค่าไม่ได้"
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button disabled={pending} onClick={onConfirm}>
            เปิดใช้โค้ด
          </Button>
        </>
      }
    >
      <div className="promotion-confirm-summary">
        <p>
          <span>ส่วนลด</span>
          <strong>
            {input.discountType === "FREE_SHIPPING"
              ? `ส่งฟรี ${cap}`
              : input.discountType === "PERCENT"
                ? `${input.discountValue}%${cap !== "—" ? ` ${cap}` : ""}`
                : formatFieldValue("discountValue", input, scopeNames)}
          </strong>
        </p>
        <p>
          <span>เงื่อนไข</span>
          <strong>
            {minSpendLabel(input.minSpend)} · {scopeLabel({ ...input, ownerType: "PLATFORM" }, scopeNames)}
            {input.newBuyerOnly ? " · ผู้ซื้อใหม่" : ""}
          </strong>
        </p>
        <p>
          <span>ระยะเวลา</span>
          <strong>{formatPeriod(input.startsAt, input.endsAt)}</strong>
        </p>
        <p>
          <span>สิทธิ์ใช้</span>
          <strong>
            {limitLabel(input.usageLimitTotal)} สิทธิ์ · {input.usageLimitPerUser} ครั้ง/คน
          </strong>
        </p>
        <p>
          <span>การแจก</span>
          <strong>{distribution}</strong>
        </p>
        <p className="promotion-confirm-budget">
          <span>งบสูงสุด ({budgetFormula(input)})</span>
          <strong>{budgetLabel(input)}</strong>
        </p>
      </div>
    </PromotionDialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  existing,
  input,
  scopeNames,
  pending,
  onConfirm,
}: PromotionSaveDialogProps & { existing: AdminPromotion }) {
  const before = toPromotionInput(existing);
  const changed = changedPromotionFields(existing, input);
  const oldBudget = campaignBudget(before);
  const newBudget = campaignBudget(input);

  return (
    <PromotionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="info"
      icon={<Pencil />}
      title="บันทึกการเปลี่ยนแปลง?"
      description={`${existing.code} ถูกใช้แล้ว ${existing.usedCount.toLocaleString("th-TH")} ครั้ง · ผู้ที่เก็บไว้ ${existing.claimedCount.toLocaleString("th-TH")} คนจะเห็นข้อมูลใหม่ทันที`}
      footerNote="บันทึกใน Activity Log"
      actions={
        <>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button disabled={pending || changed.length === 0} onClick={onConfirm}>
            บันทึก
          </Button>
        </>
      }
    >
      {changed.length === 0 ? (
        <p className="promotion-info-box">ยังไม่มีข้อมูลที่เปลี่ยนแปลง</p>
      ) : (
        <dl className="promotion-diff">
          {changed.map((key) => (
            <div key={key}>
              <dt>{FIELD_LABEL[key]}</dt>
              <dd>
                <span className="promotion-diff-old">{formatFieldValue(key, before, scopeNames)}</span>
                <ArrowRight aria-label="เป็น" className="size-3.5 shrink-0 text-muted-foreground" />
                <strong>{formatFieldValue(key, input, scopeNames)}</strong>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {changed.length > 0 && oldBudget !== newBudget ? (
        <p className="promotion-diff-budget">
          <span>งบสูงสุดใหม่</span>
          <strong>{budgetLabel(input)}</strong>
        </p>
      ) : null}
    </PromotionDialog>
  );
}
