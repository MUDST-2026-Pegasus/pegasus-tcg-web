import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { useSellerProfile } from "@/features/seller/shared/seller.queries";
import { useSellerPromotions, useSellerPromotionSummary } from "../promotions.queries";
import type { PromotionStatus, SellerPromotion } from "../promotions.types";
import { PromotionKpiRow } from "./PromotionKpiRow";
import { SellerPromotionCard, type PromotionAction } from "./SellerPromotionCard";
import { SellerPromotionActionDialog } from "./SellerPromotionActionDialog";
import { SellerPromotionForm } from "./SellerPromotionFormDialog";
import { SellerRedemptionSheet } from "./SellerRedemptionSheet";
import { SellerPromotionPagination } from "./SellerPromotionPagination";

const tabs: Array<[PromotionStatus | "ALL", string]> = [
  ["ALL", "ทั้งหมด"], ["ACTIVE", "ใช้งานอยู่"], ["SCHEDULED", "ตั้งเวลาไว้"],
  ["PAUSED", "หยุดชั่วคราว"], ["EXPIRED", "หมดอายุ"], ["USED_UP", "สิทธิ์เต็ม"],
];

export function SellerPromotionsContent({
  status, page, onStatusChange, onPageChange,
}: {
  status: PromotionStatus | "ALL";
  page: number;
  onStatusChange: (status: PromotionStatus | "ALL") => void;
  onPageChange: (page: number) => void;
}) {
  const profile = useSellerProfile();
  const verified = profile.data?.status === "VERIFIED";
  const list = useSellerPromotions(status, page);
  const summary = useSellerPromotionSummary();
  const [editing, setEditing] = useState<SellerPromotion | "new" | null>(null);
  const [action, setAction] = useState<PromotionAction | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<SellerPromotion | null>(null);
  const [redemptionPage, setRedemptionPage] = useState(0);
  const counts = list.data?.statusCounts;
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <main className="grid w-full min-w-0 content-start gap-5 text-foreground">
      <header className="flex flex-wrap items-end justify-between gap-4 [&_h1]:text-2xl [&_h1]:font-extrabold [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground">
        <div>
          <h1>โค้ดส่วนลดร้าน</h1>
          <p>สร้างโค้ดลดราคาสินค้าในร้านคุณ ร้านเป็นผู้ออกส่วนลดเอง</p>
        </div>
        <Button disabled={!verified} onClick={() => setEditing("new")}>
          <Plus className="size-4" />สร้างโค้ดร้าน
        </Button>
      </header>
      <PromotionKpiRow summary={summary.data} total={total} />
      <Alert className="border-sky-200 bg-sky-50 text-sky-800">
        <Info className="size-4" />
        <AlertDescription>
          ลูกค้าใช้โค้ดร้านได้ร้านละ 1 โค้ด และใช้ร่วมกับโค้ด Pegasus ได้ · ส่วนลดจากโค้ด Pegasus
          ไม่หักจากรายได้ร้าน — Pegasus จ่ายส่วนต่างให้ตอนปล่อยเงิน · คอมมิชชั่นคิดจากยอดหลังหักโค้ดร้าน
        </AlertDescription>
      </Alert>
      <Tabs value={status} onValueChange={(value) => onStatusChange(value as PromotionStatus | "ALL")}
        className="min-w-0">
        <TabsList className="max-w-full justify-start overflow-x-auto rounded-lg">
          {tabs.map(([value, label]) => (
            <TabsTrigger value={value} key={value} className="shrink-0 text-xs">
              {label} <span className="text-muted-foreground">{value === "ALL" ? total : counts?.[value] ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QueryBoundary query={list} errorTitle="โหลดโค้ดไม่สำเร็จ"
        isEmpty={(data) => data.page.items.length === 0}
        empty={<EmptyState title="ยังไม่มีโค้ดในหมวดนี้" className="min-h-48" />}>
        {(data) => (
          <>
            <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,430px),1fr))]">
              {data.page.items.map((code) => (
                <SellerPromotionCard key={code.id} code={code} verified={verified}
                  onEdit={() => setEditing(code)} onAction={setAction}
                  onRedemptions={() => { setRedemptionPage(0); setRedemptionCode(code); }} />
              ))}
            </div>
            <SellerPromotionPagination page={page} totalPages={data.page.totalPages}
              onPageChange={onPageChange} label="หน้ารายการโค้ด" />
          </>
        )}
      </QueryBoundary>
      <SellerPromotionForm key={editing === "new" ? "new" : editing?.id ?? "closed"}
        existing={editing === "new" ? undefined : editing || undefined}
        open={editing !== null} verified={verified} onClose={() => setEditing(null)} />
      <SellerPromotionActionDialog action={action} onClose={() => setAction(null)} onAction={setAction} />
      <SellerRedemptionSheet promotion={redemptionCode} page={redemptionPage}
        onPageChange={setRedemptionPage} onClose={() => setRedemptionCode(null)} />
    </main>
  );
}
