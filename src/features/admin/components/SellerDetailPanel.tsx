import { CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { SellerAvatar } from "@/features/admin/components/SellerAvatar";
import { cn } from "@/lib/utils";

import {
  avatarAccentFor,
  formatApplicationNumber,
  formatBankAccount,
  formatThaiDateTime,
  initialsFor,
  legalName,
  VERIFICATION_STATUS_META,
  verificationErrorMessage,
} from "../verification.format";
import type { Verification } from "../verification.types";
import { BankBookImage } from "./BankBookImage";

type SellerDetailPanelProps = {
  verification: Verification;
  /** userId ของแอดมินที่เปิดหน้านี้ ใช้แยกว่าใบ UNDER_REVIEW เป็นของเราหรือของคนอื่น */
  currentAdminId: number | undefined;
  /** สถานะการยิง start-review ตอนเพิ่งเปิดใบ SUBMITTED */
  startReview: { isPending: boolean; isError: boolean; error: unknown };
  isApproving: boolean;
  onApprove: () => void;
  onRejectClick: () => void;
  /** รูปสมุดบัญชีโหลดไม่ขึ้น — ให้หน้าหลักดึงใบนี้ใหม่เพื่อเอา signed URL ตัวใหม่ */
  onImageExpired: () => Promise<unknown>;
};

/**
 * คอลัมน์ขวา — รายละเอียดคำขอที่เลือก + รูปสมุดบัญชี + แถบปุ่มตัดสินใจ
 *
 * ผู้เรียกใส่ `key={verification.id}` ให้ state ภายใน (เช่น "ตัดสินแทน") รีเซ็ตทุกครั้ง
 * ที่เปลี่ยนใบ
 */
export function SellerDetailPanel(props: SellerDetailPanelProps) {
  const { verification, currentAdminId, onImageExpired } = props;
  const meta = VERIFICATION_STATUS_META[verification.status];

  // backend ไม่เก็บบัตรประชาชน/เซลฟี่โดยตั้งใจ มีแค่ชื่อ บัญชี และรูปหน้าสมุดบัญชี
  // — ดู `verification.types.ts`
  const details: { label: string; value: string }[] = [
    { label: "ชื่อ-นามสกุล (ตามบัญชี)", value: legalName(verification) },
    {
      label: "ธนาคาร",
      value: `${verification.bankName} · ${verification.bankCode}`,
    },
    {
      label: "เลขบัญชีธนาคาร",
      value: formatBankAccount(verification.bankAccountNumber),
    },
    { label: "รหัสโปรไฟล์ผู้ขาย", value: `#${verification.sellerProfileId}` },
  ];

  if (verification.reviewedAt) {
    details.push({
      label: "ตรวจเมื่อ",
      value: formatThaiDateTime(verification.reviewedAt),
    });
  }
  if (verification.reviewedBy !== null) {
    details.push({
      label: "ผู้ตรวจ (admin)",
      value: reviewerLabel(verification.reviewedBy, currentAdminId),
    });
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
      <Card className="gap-5 rounded-xl border border-border p-5 shadow-none ring-0">
        {/* ชื่อผู้สมัคร + สถานะ + เลขคำขอ/วันที่ยื่น */}
        <div className="flex items-center gap-3.5">
          <SellerAvatar
            initials={initialsFor(verification)}
            accent={avatarAccentFor(verification)}
            className="size-[52px]"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-[-0.3px] text-foreground">
                {legalName(verification)}
              </h2>
              <Badge
                className={cn(
                  "h-5 rounded-full px-2 text-[11px] font-medium",
                  meta.badgeClass,
                )}
              >
                {meta.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatApplicationNumber(verification)} · ยื่นเมื่อ{" "}
              {formatThaiDateTime(verification.submittedAt)}
            </p>
          </div>
        </div>

        {/* ดีไซน์ใช้เส้นคั่นสั้น 240px ต้องใส่ ! ทับ data-horizontal:w-full ของ ui/separator */}
        <Separator className="w-60! bg-[#eef1f2]" />

        <div className="grid grid-cols-1 gap-y-[18px] sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-[5px] pr-4">
              <span className="text-[11px] text-[#9aa5ad]">{detail.label}</span>
              <span className="text-[13px] font-medium text-foreground">
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] text-[#9aa5ad]">
            รูปหน้าสมุดบัญชี / หน้าแอปธนาคาร
          </span>
          <BankBookImage
            url={verification.bankBookImageUrl}
            onExpired={onImageExpired}
          />
        </div>

        <p className="text-[11px] text-[#9aa5ad]">
          ข้อมูลนี้เป็นข้อมูลส่วนบุคคล ใช้เพื่อการตรวจสอบเท่านั้น
        </p>
      </Card>

      {/* แถบตัดสินใจ — เปลี่ยนตามสถานะของคำขอ */}
      <Card className="flex-row flex-wrap items-center gap-3 rounded-xl border border-border px-5 py-4 shadow-none ring-0">
        <DecisionArea {...props} />
      </Card>
    </div>
  );
}

function reviewerLabel(
  reviewedBy: number,
  currentAdminId: number | undefined,
): string {
  return reviewedBy === currentAdminId ? "คุณ" : `แอดมิน #${reviewedBy}`;
}

function DecisionArea({
  verification,
  currentAdminId,
  startReview,
  isApproving,
  onApprove,
  onRejectClick,
}: SellerDetailPanelProps) {
  // ใบที่คนอื่นจองไว้ ซ่อนปุ่มไว้ก่อน แต่ยังให้ "ตัดสินแทน" ได้ — backend ไม่มีทางปล่อย
  // ใบที่จองแล้ว ถ้าคนจองหายไป ใบนั้นจะค้างตลอดถ้าไม่มีทางนี้
  const [takingOver, setTakingOver] = useState(false);

  switch (verification.status) {
    case "SUBMITTED":
      // ปกติจะอยู่สถานะนี้แค่แวบเดียว เพราะเปิดใบแล้วยิง start-review ทันที
      if (startReview.isError) {
        return (
          <Alert variant="destructive" className="border-0 p-0">
            <AlertTitle>รับคำขอมาตรวจไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {verificationErrorMessage(
                startReview.error,
                "คำขอนี้อาจถูกแอดมินคนอื่นรับไปแล้ว หรือถูกตัดสินไปแล้ว ลองรีเฟรชคิว",
              )}
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Spinner className="size-4" /> กำลังรับคำขอนี้มาตรวจ...
        </p>
      );

    case "UNDER_REVIEW":
      if (
        verification.reviewedBy !== null &&
        verification.reviewedBy !== currentAdminId &&
        !takingOver
      ) {
        return (
          <>
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <Lock className="mt-0.5 size-4 shrink-0 text-[#0058bc]" />
              <div className="flex flex-col gap-[3px]">
                <p className="text-[13px] font-semibold text-foreground">
                  {reviewerLabel(verification.reviewedBy, currentAdminId)}{" "}
                  กำลังตรวจคำขอนี้อยู่
                </p>
                <p className="text-[11px] text-muted-foreground">
                  เลือกใบอื่นในคิวได้เลย กดตัดสินแทนเฉพาะตอนแน่ใจว่าคนเดิมไม่ได้ตรวจต่อแล้ว
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-md px-2.5"
              onClick={() => setTakingOver(true)}
            >
              ตัดสินแทน
            </Button>
          </>
        );
      }
      return (
        <>
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <p className="text-[13px] font-semibold text-foreground">
              ผลการตรวจสอบ
            </p>
            <p className="text-[11px] text-muted-foreground">
              ตรวจชื่อบัญชีให้ตรงกับชื่อจริงก่อนกดอนุมัติ — การอนุมัติจะให้สิทธิ์ผู้ขายทันที
            </p>
          </div>

          <Button
            variant="destructive"
            className="rounded-md bg-destructive px-2.5 text-white hover:bg-destructive/90"
            disabled={isApproving}
            onClick={onRejectClick}
          >
            ปฏิเสธคำขอ
          </Button>
          <Button
            className="rounded-md px-2.5"
            disabled={isApproving}
            onClick={onApprove}
          >
            {isApproving && <Spinner data-icon="inline-start" />}
            อนุมัติเปิดร้าน
          </Button>
        </>
      );

    case "APPROVED":
      return (
        <div className="flex items-center gap-2.5 text-[13px] font-medium text-[#12805c]">
          <CheckCircle2 className="size-[18px]" />
          อนุมัติแล้ว — ผู้ขายได้สิทธิ์เปิดร้านบนแพลตฟอร์ม
        </div>
      );

    case "REJECTED":
      return (
        <div className="flex w-full flex-col gap-1.5">
          <p className="text-[13px] font-semibold text-[#d0342c]">
            ปฏิเสธคำขอแล้ว
          </p>
          <p className="text-[12px] text-muted-foreground">
            เหตุผล: {verification.rejectionReason ?? "—"}
          </p>
        </div>
      );
  }
}
