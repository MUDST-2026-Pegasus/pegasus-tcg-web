import { useState } from "react";
import { Inbox } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { hasErrorCode } from "@/lib/api";
import { useTranslate } from "@/lib/i18n";

import {
  useApproveVerification,
  useRefetchVerification,
  useStartReview,
  useVerificationCounts,
  useVerificationQueue,
} from "../verification.queries";
import {
  VERIFICATION_STATUS_META,
  verificationErrorMessage,
} from "../verification.format";
import type { Verification, VerificationStatus } from "../verification.types";
import { RejectVerificationDialog } from "./RejectVerificationDialog";
import { SellerApprovalStats } from "./SellerApprovalStats";
import { SellerDetailPanel } from "./SellerDetailPanel";
import { SellerQueueList } from "./SellerQueueList";
import { SellerQueueSkeleton } from "./SellerQueueSkeleton";

const PAGE_SIZE = 20;

/**
 * หน้า "อนุมัติผู้ขาย" — ADM-03 · ต่อ `/admin/verifications` (queue / start-review /
 * approve / reject) การอนุมัติคือจุดเดียวที่ให้สิทธิ์ SELLER
 *
 * มาตรฐาน data layer (FND-01) เหมือน `features/account` — ข้อมูลมาจาก hook,
 * loading/error/empty ใช้ `QueryBoundary`, ทุก mutation invalidate ให้เอง
 *
 * PII (ชื่อจริง, เลขบัญชี) อยู่ใน state ในหน่วยความจำเท่านั้น ไม่ลง log / URL /
 * localStorage — การเลือกใบใช้ state ไม่ใช่ route param
 */
export function AdminSellerApprovalContent() {
  const { t } = useTranslate("admin");
  const [activeStatus, setActiveStatus] =
    useState<VerificationStatus>("SUBMITTED");
  const [page, setPage] = useState(0);
  /** เก็บทั้งก้อน ไม่ใช่แค่ id เพราะพอตัดสินแล้วใบจะหลุดจากคิวปัจจุบัน */
  const [selected, setSelected] = useState<Verification | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { user } = useAuth();
  const counts = useVerificationCounts();
  const queue = useVerificationQueue(activeStatus, page, PAGE_SIZE);

  const startReview = useStartReview();
  const approve = useApproveVerification();
  const refetchVerification = useRefetchVerification();

  /** ผลที่กลับมาช้า ห้ามทับใบที่ผู้ใช้สลับไปเปิดแล้ว */
  const replaceSelected = (updated: Verification) =>
    setSelected((current) => (current?.id === updated.id ? updated : current));

  const handleTabChange = (status: VerificationStatus) => {
    setActiveStatus(status);
    setPage(0);
    setSelected(null);
  };

  const handleSelect = (verification: Verification) => {
    setSelected(verification);

    // เปิดใบที่ยัง SUBMITTED = จองมาตรวจทันที (กันแอดมินสองคนตรวจใบเดียวกัน)
    if (verification.status === "SUBMITTED") {
      startReview.mutate(verification.id, {
        onSuccess: replaceSelected,
        onError: async (error) => {
          toast.add({
            type: "error",
            title: t("sellers.toast.claimErrorTitle", "รับคำขอมาตรวจไม่สำเร็จ"),
            description: verificationErrorMessage(
              error,
              t(
                "sellers.toast.claimErrorFallback",
                "คำขอนี้อาจถูกรับหรือถูกตัดสินไปแล้ว ลองรีเฟรชคิว",
              ),
            ),
          });
          // คิวในมือเราเก่ากว่าของจริง — คนอื่นจองไปก่อน ไปหาในคิว "กำลังตรวจ"
          // มาโชว์ว่าใครจองไว้ แทนที่จะค้างหน้าจอ error
          if (hasErrorCode(error, "VERIFICATION_ALREADY_DECIDED")) {
            const claimed = await refetchVerification(
              verification.id,
              "UNDER_REVIEW",
            ).catch(() => null);
            if (claimed) {
              replaceSelected(claimed);
            }
          }
        },
      });
    }
  };

  const handleImageExpired = async () => {
    if (!selected) {
      return;
    }
    const fresh = await refetchVerification(selected.id, selected.status);
    if (fresh) {
      replaceSelected(fresh);
    }
  };

  const handleApprove = () => {
    if (!selected) {
      return;
    }
    approve.mutate(selected.id, {
      onSuccess: (updated) => {
        replaceSelected(updated);
        toast.add({
          type: "success",
          title: t("sellers.toast.approveSuccessTitle", "อนุมัติแล้ว"),
          description: t(
            "sellers.toast.approveSuccessDesc",
            "ผู้ขายรายนี้ได้สิทธิ์เปิดร้านบนแพลตฟอร์มแล้ว",
          ),
        });
      },
      onError: (error) =>
        toast.add({
          type: "error",
          title: t("sellers.toast.approveErrorTitle", "อนุมัติไม่สำเร็จ"),
          description: verificationErrorMessage(error, t("actions.retry", "ลองใหม่", { ns: "common" })),
        }),
    });
  };

  const totalPages = queue.data?.totalPages ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
          {t("sellers.pageTitle", "อนุมัติผู้ขาย")}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {t(
            "sellers.pageDesc",
            "ตรวจสอบชื่อและบัญชีธนาคารก่อนอนุญาตให้เปิดร้านค้าบนแพลตฟอร์ม",
          )}
        </p>
      </div>

      <SellerApprovalStats
        counts={counts.counts}
        active={activeStatus}
        onSelect={handleTabChange}
        isLoading={counts.isPending}
      />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
          <QueryBoundary
            query={queue}
            loading={<SellerQueueSkeleton />}
            errorTitle={t("sellers.queue.loadErrorTitle", "โหลดคิวคำขอไม่สำเร็จ")}
            errorMessage={t("sellers.queue.loadErrorDesc", "ตรวจสอบการเชื่อมต่อแล้วลองใหม่")}
            isEmpty={(data) => data.items.length === 0}
            empty={
              <EmptyState
                icon={Inbox}
                title={t("sellers.queue.emptyTitle", "ไม่มีคำขอในสถานะ \"{status}\"", {
                  status: VERIFICATION_STATUS_META[activeStatus].label,
                })}
                description={t(
                  "sellers.queue.emptyDesc",
                  "เมื่อมีคำขอเข้ามา จะแสดงที่นี่โดยเรียงเก่าสุดก่อน",
                )}
              />
            }
          >
            {(data) => (
              <>
                <SellerQueueList
                  status={activeStatus}
                  count={counts.counts[activeStatus]}
                  verifications={data.items}
                  activeId={selected?.id ?? null}
                  currentAdminId={user?.id}
                  onSelect={handleSelect}
                  viewingLabel={t("sellers.queue.viewingBadge", "กำลังดู")}
                  sortLabel={t("sellers.queue.sortOldest", "เรียงตาม: เก่าสุด")}
                />

                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md px-2.5"
                      disabled={page <= 0 || queue.isFetching}
                      onClick={() => setPage((current) => Math.max(0, current - 1))}
                    >
                      {t("actions.previous", "ก่อนหน้า", { ns: "common" })}
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                      {t("sellers.pagination.pageIndicator", "หน้า {current} จาก {total}", {
                        current: page + 1,
                        total: totalPages,
                      })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md px-2.5"
                      disabled={page + 1 >= totalPages || queue.isFetching}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      {t("actions.next", "ถัดไป", { ns: "common" })}
                    </Button>
                  </div>
                )}
              </>
            )}
          </QueryBoundary>
        </div>

        {selected ? (
          <SellerDetailPanel
            key={selected.id}
            verification={selected}
            currentAdminId={user?.id}
            startReview={{
              isPending: startReview.isPending,
              isError: startReview.isError,
              error: startReview.error,
            }}
            isApproving={approve.isPending}
            onApprove={handleApprove}
            onRejectClick={() => setRejectOpen(true)}
            onImageExpired={handleImageExpired}
          />
        ) : (
          <div className="flex w-full min-w-0 flex-1 items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              {t("sellers.detail.emptyPrompt", "เลือกคำขอจากคิวทางซ้ายเพื่อดูรายละเอียดและตัดสิน")}
            </p>
          </div>
        )}
      </div>

      <RejectVerificationDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        verification={selected}
        onRejected={replaceSelected}
      />
    </div>
  );
}
