import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { getErrorMessage, isApiError } from "@/lib/api";
import { useCategoryList, useGameList } from "@/features/catalog/catalog.queries";
import { feeBreakdown } from "@/features/admin/commission-rule.form";
import { CommissionCalcCard } from "@/features/admin/components/CommissionCalcCard";
import { CommissionCategoryList } from "@/features/admin/components/CommissionCategoryList";
import { CommissionDefaultRateCard } from "@/features/admin/components/CommissionDefaultRateCard";
import { CommissionImpactCard } from "@/features/admin/components/CommissionImpactCard";
import { CommissionRuleDialog, type CommissionRuleDialogRequest } from "@/features/admin/components/CommissionRuleDialog";
import { CommissionRulesCard } from "@/features/admin/components/CommissionRulesCard";
import type { CommissionCategory } from "@/features/admin/admin.types";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { CommissionRuleInput } from "@/features/finance/after-sales.types";

const blank = (): CommissionRuleInput => ({ scope: "GLOBAL", gameId: null, categoryId: null,
  sellerProfileId: null, ratePercent: 0, fixedFee: 0, minFee: null, maxFee: null,
  priority: 0, effectiveFrom: new Date().toISOString(), effectiveTo: null, active: true });
const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatRate = (value: number) => Number.isInteger(value) ? value.toFixed(1) : String(value);
const examplePrice = 1290;

export function AdminCommissionPage() {
  const cache = useQueryClient();
  const rules = useQuery({ queryKey: ["finance", "commission-rules"], queryFn: afterSalesApi.commissionRules });
  const setting = useQuery({ queryKey: ["finance", "default-commission-rate"], queryFn: afterSalesApi.defaultCommissionRate });
  const games = useGameList();
  const categories = useCategoryList();
  const [busy, setBusy] = useState(false);
  const [globalRateDraft, setGlobalRate] = useState<string | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, { rate: string; useCustom: boolean }>>({});
  // ปิดแล้ว unmount ทิ้ง เปิดรอบใหม่ฟอร์มข้างในจึงเริ่มจาก request ล่าสุดเสมอ
  const [ruleDialog, setRuleDialog] = useState<CommissionRuleDialogRequest | null>(null);
  const openRuleDialog = setRuleDialog;
  const currentGlobal = rules.data?.find((rule) => rule.scope === "GLOBAL" && rule.active);
  const fallbackRate = Number(setting.data?.value?.replaceAll('"', "") ?? 0);
  const savedRate = Number(currentGlobal?.ratePercent ?? fallbackRate);
  const targetRules = rules.data?.filter((rule) => rule.scope === "GAME" || rule.scope === "CATEGORY") ?? [];
  const rows = [
    ...(games.data ?? []).map((game) => ({ id: `GAME:${game.id}`, name: game.name, description: "การ์ดและสินค้าของเกมนี้", scope: "GAME" as const, targetId: game.id })),
    ...targetRules.filter((rule) => rule.scope === "CATEGORY" && rule.categoryId != null)
      .filter((rule, index, all) => all.findIndex((item) => item.categoryId === rule.categoryId) === index)
      .map((rule) => { const category = categories.data?.find((item) => item.id === rule.categoryId); return {
        id: `CATEGORY:${rule.categoryId}`, name: category?.name ?? `หมวดหมู่ #${rule.categoryId}`,
        description: category?.gameId ? games.data?.find((game) => game.id === category.gameId)?.name ?? "หมวดหมู่สินค้า" : "ทุกเกม",
        scope: "CATEGORY" as const, targetId: rule.categoryId!,
      }; }),
  ];
  // เป้าหมายเดียวมีได้หลายกฎ — ให้กฎที่เปิดอยู่มาก่อน แล้วค่อยกฎใหม่สุด (API เรียง id มากไปน้อยแล้ว)
  const findTargetRule = (scope: "GAME" | "CATEGORY", targetId: number) => {
    const matches = targetRules.filter((rule) => rule.scope === scope && (scope === "GAME" ? rule.gameId : rule.categoryId) === targetId);
    return matches.find((rule) => rule.active) ?? matches[0];
  };
  const globalRate = globalRateDraft ?? (rules.isSuccess && setting.isSuccess ? formatRate(savedRate) : "");
  const savedCategoryRates: Record<string, { rate: string; useCustom: boolean }> = {};
  if (rules.isSuccess && games.isSuccess) {
    for (const row of rows) {
      const rule = findTargetRule(row.scope, row.targetId);
      savedCategoryRates[row.id] = { rate: formatRate(Number(rule?.ratePercent ?? savedRate)), useCustom: !!rule?.active };
    }
  }
  const categoryRates = { ...savedCategoryRates, ...categoryDrafts };
  const invalidate = () => Promise.all([
    cache.invalidateQueries({ queryKey: ["finance", "commission-rules"] }),
    cache.invalidateQueries({ queryKey: ["finance", "default-commission-rate"] }),
  ]);
  const refresh = async () => { await invalidate(); setGlobalRate(null); setCategoryDrafts({}); };

  const validRate = (text: string) => text.trim() !== "" && Number.isFinite(Number(text))
    && Number(text) >= 0 && Number(text) <= 100 && /^\d+(?:\.\d{1,3})?$/.test(text.trim());
  const rowChanged = (row: typeof rows[number]) => {
    const draft = categoryRates[row.id];
    if (!draft) return false;
    const rule = findTargetRule(row.scope, row.targetId);
    return draft.useCustom !== !!rule?.active || (draft.useCustom && Number(draft.rate) !== Number(rule?.ratePercent ?? savedRate));
  };
  const hasChanges = (globalRate !== "" && Number(globalRate) !== savedRate) || rows.some(rowChanged);
  async function saveSettings() {
    if (!validRate(globalRate) || rows.some((row) => categoryRates[row.id]?.useCustom && !validRate(categoryRates[row.id].rate))) {
      toast.add({ type: "error", title: "อัตราต้องอยู่ระหว่าง 0–100% และมีทศนิยมไม่เกิน 3 ตำแหน่ง" });
      return;
    }
    setBusy(true);
    try {
      if (Number(globalRate) !== savedRate) {
        if (currentGlobal) {
          const { id, ...input } = currentGlobal;
          await afterSalesApi.updateCommissionRule(id, { ...input, ratePercent: Number(globalRate) });
        } else await afterSalesApi.updateDefaultCommissionRate(Number(globalRate));
      }
      for (const row of rows.filter(rowChanged)) {
        const draft = categoryRates[row.id];
        const rule = findTargetRule(row.scope, row.targetId);
        if (rule) {
          const { id, ...input } = rule;
          await afterSalesApi.updateCommissionRule(id, { ...input, active: draft.useCustom, ratePercent: Number(draft.rate) });
        } else if (draft.useCustom) {
          await afterSalesApi.createCommissionRule({ ...blank(), scope: row.scope,
            gameId: row.scope === "GAME" ? row.targetId : null,
            categoryId: row.scope === "CATEGORY" ? row.targetId : null,
            ratePercent: Number(draft.rate) });
        }
      }
      await refresh();
      toast.add({ type: "success", title: "บันทึกการตั้งค่าค่าคอมมิชชั่นแล้ว" });
    } catch (error) {
      toast.add({ type: "error", title: "บันทึกไม่ครบทุกอัตรา", description: getErrorMessage(error, "กรุณาตรวจรายการแล้วลองอีกครั้ง") });
      await refresh();
    } finally { setBusy(false); }
  }

  const previewRate = Number(globalRate) || 0;
  const previewFixed = Number(currentGlobal?.fixedFee ?? 0);
  const preview = feeBreakdown(examplePrice, { ratePercent: Math.min(100, previewRate), fixedFee: previewFixed,
    minFee: currentGlobal?.minFee ?? null, maxFee: currentGlobal?.maxFee ?? null });
  const rowItems: CommissionCategory[] = rows.map((row) => {
    const rule = findTargetRule(row.scope, row.targetId);
    const draft = categoryRates[row.id];
    const useCustom = draft?.useCustom ?? !!rule?.active;
    return { id: row.id, name: row.name, description: row.description, useCustom,
      rate: useCustom ? draft?.rate ?? formatRate(Number(rule?.ratePercent ?? savedRate)) : formatRate(savedRate),
      customLabel: "ตั้งค่าเฉพาะ",
      defaultLabel: "ใช้ค่าเริ่มต้น" };
  });
  const editRow = (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const rule = findTargetRule(row.scope, row.targetId);
    openRuleDialog(rule ? { view: "form", rule } : { view: "form", rule: null, preset: {
      scope: row.scope, gameId: row.scope === "GAME" ? row.targetId : null,
      categoryId: row.scope === "CATEGORY" ? row.targetId : null,
      ratePercent: categoryRates[row.id]?.rate ?? formatRate(savedRate),
    } });
  };
  const loadingError = rules.error ?? setting.error;
  const ready = rules.isSuccess && setting.isSuccess && games.isSuccess && categories.isSuccess;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1"><h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#090b0c]">ค่าคอมมิชชั่น</h1>
        <p className="text-[13px] text-[#67787c]">กำหนดอัตราค่าธรรมเนียมที่แพลตฟอร์มเก็บจากผู้ขายในแต่ละหมวดหมู่</p></div>
      <div className="flex gap-2"><Button variant="outline" className="rounded-md px-2.5" disabled title="ระบบยังไม่มี API ประวัติการแก้ไขค่าคอมมิชชั่น">ดูประวัติการแก้ไข</Button>
        <Button className="rounded-md px-2.5" disabled={busy || !hasChanges} onClick={() => void saveSettings()}>บันทึกการตั้งค่า</Button></div>
    </div>
    {(rules.isPending || setting.isPending || games.isPending || categories.isPending) && <div role="status" aria-busy="true" aria-label="กำลังโหลดการตั้งค่าค่าคอมมิชชั่น" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4"><PanelSkeleton rows={1} /><PanelSkeleton rows={4} /></div>
      <div className="space-y-4"><PanelSkeleton rows={2} /><PanelSkeleton rows={2} /></div>
    </div>}
    {(rules.isError || setting.isError || games.isError || categories.isError) && <p role="alert" className="text-destructive">
      {isApiError(loadingError) && loadingError.status === 403
        ? "บัญชีนี้ไม่มีสิทธิ์ ADMIN สำหรับการตั้งค่าค่าคอมมิชชั่น" : "โหลดการตั้งค่าค่าคอมมิชชั่นไม่สำเร็จ"}
      <Button variant="outline" onClick={() => { void rules.refetch(); void setting.refetch(); void games.refetch(); void categories.refetch(); }}>ลองอีกครั้ง</Button>
    </p>}
    {ready && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <CommissionDefaultRateCard title="อัตราเริ่มต้นทั้งแพลตฟอร์ม" description="ใช้กับทุกหมวดหมู่ที่ไม่ได้ตั้งค่าเฉพาะไว้"
          value={globalRate} minLabel="0%" maxLabel="15%" recommendedLabel="แนะนำ 3–7%" max={15}
          onChange={setGlobalRate} />
        <CommissionCategoryList title="อัตราเฉพาะหมวดหมู่" description="เปิดสวิตช์เพื่อกำหนดอัตราแยกจากค่าเริ่มต้น"
          addLabel="+ เพิ่มหมวดหมู่" items={rowItems}
          onAdd={() => openRuleDialog({ view: "form", rule: null, preset: { ratePercent: formatRate(savedRate) } })}
          onEdit={editRow}
          manageLabel={`จัดการกฎทั้งหมด (${rules.data.filter((rule) => rule.active).length} ที่เปิดอยู่)`}
          onManage={() => openRuleDialog({ view: "list" })}
          onToggle={(id, checked) => setCategoryDrafts((old) => ({ ...old, [id]: { rate: (old[id] ?? savedCategoryRates[id])?.rate ?? formatRate(savedRate), useCustom: checked } }))}
          onRateChange={(id, rate) => setCategoryDrafts((old) => ({ ...old, [id]: { rate, useCustom: (old[id] ?? savedCategoryRates[id])?.useCustom ?? true } }))} />
      </div>
      <div className="space-y-4">
        <CommissionCalcCard title="ตัวอย่างการคำนวณ" rows={[
          { id: "price", label: "ราคาขาย", value: `฿${examplePrice.toLocaleString("th-TH")}` },
          { id: "commission", label: `ค่าคอมมิชชั่น (${previewRate.toFixed(1)}%)`, value: `− ${money(preview.percentPart)}` },
          { id: "fixed", label: "ค่าธรรมเนียมคงที่", value: `− ${money(preview.fixedFee)}` },
          ...(preview.clamped ? [{ id: "limit", label: "ปรับตามขั้นต่ำ/ขั้นสูง", value: money(preview.fee) }] : []),
        ]} totalLabel="ผู้ขายได้รับ" totalValue={money(preview.sellerNet)} />
        <CommissionRulesCard title="กฎการเก็บค่าธรรมเนียม" items={[
          { id: "on-success", label: "เก็บเมื่อคำสั่งซื้อสำเร็จ", active: true },
          { id: "exclude-shipping", label: "ยกเว้นค่าส่ง", active: true },
          { id: "refund-on-cancel", label: "คืนค่าธรรมเนียมเมื่อยกเลิก", active: true },
          { id: "buyer-pays", label: "เก็บกับผู้ซื้อแทนผู้ขาย", active: false },
        ]} />
        <CommissionImpactCard title="ผลกระทบต่อผู้ขาย" description="การขึ้นอัตราจะมีผลกับคำสั่งซื้อใหม่เท่านั้น คำสั่งซื้อเดิมยังใช้อัตราตอนสั่งซื้อ" />
      </div>
    </div>}
    {ready && ruleDialog && <CommissionRuleDialog open request={ruleDialog}
      onOpenChange={(open) => { if (!open) setRuleDialog(null); }}
      rules={rules.data} games={games.data} categories={categories.data} onChanged={invalidate} />}
  </div>;
}
