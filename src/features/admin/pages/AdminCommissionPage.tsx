import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getErrorMessage, isApiError } from "@/lib/api";
import { useCategoryList, useGameList } from "@/features/catalog/catalog.queries";
import { CommissionCalcCard } from "@/features/admin/components/CommissionCalcCard";
import { CommissionCategoryList } from "@/features/admin/components/CommissionCategoryList";
import { CommissionDefaultRateCard } from "@/features/admin/components/CommissionDefaultRateCard";
import { CommissionImpactCard } from "@/features/admin/components/CommissionImpactCard";
import { CommissionRulesCard } from "@/features/admin/components/CommissionRulesCard";
import type { CommissionCategory } from "@/features/admin/admin.types";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { CommissionRuleInput } from "@/features/finance/after-sales.types";

const blank = (): CommissionRuleInput => ({ scope: "GLOBAL", gameId: null, categoryId: null,
  sellerProfileId: null, ratePercent: 0, fixedFee: 0, minFee: null, maxFee: null,
  priority: 0, effectiveFrom: new Date().toISOString(), effectiveTo: null, active: true });
type RuleDraft = Omit<CommissionRuleInput, "ratePercent" | "fixedFee" | "minFee" | "maxFee" | "priority"> & {
  ratePercent: string; fixedFee: string; minFee: string; maxFee: string; priority: string;
};
const blankDraft = (): RuleDraft => ({ ...blank(), ratePercent: "", fixedFee: "", minFee: "", maxFee: "", priority: "" });
const toDraft = (rule: CommissionRuleInput): RuleDraft => ({
  scope: rule.scope, gameId: rule.gameId, categoryId: rule.categoryId, sellerProfileId: rule.sellerProfileId,
  ratePercent: String(rule.ratePercent), fixedFee: String(rule.fixedFee),
  minFee: rule.minFee == null ? "" : String(rule.minFee), maxFee: rule.maxFee == null ? "" : String(rule.maxFee),
  priority: String(rule.priority), effectiveFrom: rule.effectiveFrom, effectiveTo: rule.effectiveTo, active: rule.active,
});
const optionalNumber = (value: string) => value === "" ? null : Number(value);
const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatRate = (value: number) => Number.isInteger(value) ? value.toFixed(1) : String(value);
const examplePrice = 1290;
const feeFor = (rule: Pick<CommissionRuleInput, "ratePercent" | "fixedFee" | "minFee" | "maxFee">, price: number) => {
  const fee = price * Number(rule.ratePercent) / 100 + Number(rule.fixedFee);
  return Math.min(rule.maxFee ?? Infinity, Math.max(rule.minFee ?? 0, fee));
};
const localDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function AdminCommissionPage() {
  const cache = useQueryClient();
  const rules = useQuery({ queryKey: ["finance", "commission-rules"], queryFn: afterSalesApi.commissionRules });
  const setting = useQuery({ queryKey: ["finance", "default-commission-rate"], queryFn: afterSalesApi.defaultCommissionRate });
  const games = useGameList();
  const categories = useCategoryList();
  const [selected, setSelected] = useState<number | null>(null);
  const [form, setForm] = useState<RuleDraft>(blankDraft);
  const [busy, setBusy] = useState(false);
  const [globalRate, setGlobalRate] = useState("");
  const [categoryRates, setCategoryRates] = useState<Record<string, { rate: string; useCustom: boolean }>>({});
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
  const findTargetRule = (scope: "GAME" | "CATEGORY", targetId: number) => targetRules.find((rule) =>
    rule.scope === scope && (scope === "GAME" ? rule.gameId : rule.categoryId) === targetId);
  useEffect(() => {
    if (rules.isSuccess && setting.isSuccess) setGlobalRate(formatRate(savedRate));
  }, [rules.isSuccess, setting.isSuccess, savedRate]);
  useEffect(() => {
    if (!rules.isSuccess || !games.isSuccess) return;
    const draft: Record<string, { rate: string; useCustom: boolean }> = {};
    for (const game of games.data) {
      const rule = targetRules.find((item) => item.scope === "GAME" && item.gameId === game.id);
      draft[`GAME:${game.id}`] = { rate: formatRate(Number(rule?.ratePercent ?? savedRate)), useCustom: !!rule?.active };
    }
    for (const rule of targetRules.filter((item) => item.scope === "CATEGORY" && item.categoryId != null)) {
      draft[`CATEGORY:${rule.categoryId}`] = { rate: formatRate(Number(rule.ratePercent)), useCustom: !!rule.active };
    }
    setCategoryRates(draft);
  }, [rules.data, rules.isSuccess, games.data, games.isSuccess, savedRate]);
  async function edit(id: number) {
    setBusy(true);
    try { const current = await afterSalesApi.commissionRule(id); setSelected(id); setForm(toDraft(current)); }
    catch (error) { toast.add({ type: "error", title: "โหลดรายละเอียดไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }
  const update = <K extends keyof RuleDraft>(key: K, value: RuleDraft[K]) => setForm((old) => ({ ...old, [key]: value }));
  const refresh = async () => { await Promise.all([
    cache.invalidateQueries({ queryKey: ["finance", "commission-rules"] }),
    cache.invalidateQueries({ queryKey: ["finance", "default-commission-rate"] }),
  ]); };

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

  async function save() {
    const ratePercent = Number(form.ratePercent || 0);
    const fixedFee = Number(form.fixedFee || 0);
    const minFee = optionalNumber(form.minFee);
    const maxFee = optionalNumber(form.maxFee);
    const priority = Number(form.priority || 0);
    const validMoney = (text: string) => text === "" || /^\d{1,12}(?:\.\d{1,2})?$/.test(text);
    if (!validRate(form.ratePercent || "0") || !validMoney(form.fixedFee)
      || !validMoney(form.minFee) || !validMoney(form.maxFee)
      || (minFee != null && maxFee != null && minFee > maxFee)
      || !Number.isInteger(priority) || priority < -32768 || priority > 32767
      || (form.scope === "GAME" && form.gameId == null)
      || (form.scope === "CATEGORY" && form.categoryId == null)
      || (form.scope === "SELLER" && form.sellerProfileId == null)
      || (form.effectiveTo != null && new Date(form.effectiveFrom) >= new Date(form.effectiveTo))) {
      toast.add({ type: "error", title: "กรุณาตรวจข้อมูลกฎ", description: "เลือกเกมหรือหมวดหมู่ และตรวจอัตรา ค่าธรรมเนียม ลำดับความสำคัญ และวันที่" });
      return;
    }
    const input: CommissionRuleInput = { ...form, ratePercent, fixedFee, minFee, maxFee, priority };
    setBusy(true);
    try {
      if (selected === null) await afterSalesApi.createCommissionRule(input);
      else await afterSalesApi.updateCommissionRule(selected, input);
      await refresh(); setSelected(null); setForm(blankDraft());
      toast.add({ type: "success", title: "บันทึกกฎค่าคอมมิชชันแล้ว" });
    } catch (error) { toast.add({ type: "error", title: "บันทึกไม่สำเร็จ", description: getErrorMessage(error, "กรุณาตรวจข้อมูล") }); }
    finally { setBusy(false); }
  }
  async function deactivate(id: number) {
    if (!window.confirm(`ปิดใช้งานกฎ #${id}?`)) return;
    setBusy(true);
    try { await afterSalesApi.deactivateCommissionRule(id); await refresh(); toast.add({ type: "success", title: "ปิดใช้งานแล้ว" }); }
    catch (error) { toast.add({ type: "error", title: "ปิดใช้งานไม่สำเร็จ", description: getErrorMessage(error, "กรุณาลองอีกครั้ง") }); }
    finally { setBusy(false); }
  }

  const previewRate = Number(globalRate) || 0;
  const previewRule = { ratePercent: previewRate, fixedFee: currentGlobal?.fixedFee ?? 0,
    minFee: currentGlobal?.minFee ?? null, maxFee: currentGlobal?.maxFee ?? null };
  const previewFee = feeFor(previewRule, examplePrice);
  const rowItems: CommissionCategory[] = rows.map((row) => {
    const rule = findTargetRule(row.scope, row.targetId);
    const draft = categoryRates[row.id];
    const useCustom = draft?.useCustom ?? !!rule?.active;
    return { id: row.id, name: row.name, description: row.description, useCustom,
      rate: useCustom ? draft?.rate ?? formatRate(Number(rule?.ratePercent ?? savedRate)) : formatRate(savedRate),
      customLabel: "ตั้งค่าเฉพาะ",
      defaultLabel: "ใช้ค่าเริ่มต้น" };
  });
  const openAdvanced = () => {
    setSelected(null);
    setForm({ ...blankDraft(), scope: "CATEGORY" });
    const advanced = document.getElementById("commission-advanced") as HTMLDetailsElement | null;
    if (advanced) { advanced.open = true; advanced.scrollIntoView({ behavior: "smooth" }); }
  };
  const loadingError = rules.error ?? setting.error;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#090b0c]">ค่าคอมมิชชั่น</h1>
        <p className="text-[13px] text-[#67787c]">กำหนดอัตราค่าธรรมเนียมที่แพลตฟอร์มเก็บจากผู้ขายในแต่ละหมวดหมู่</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled title="ระบบยังไม่มี API ประวัติการแก้ไขค่าคอมมิชชั่น">ดูประวัติการแก้ไข</Button>
        <Button disabled={busy || !hasChanges} onClick={() => void saveSettings()}>บันทึกการตั้งค่า</Button></div>
    </div>
    {(rules.isPending || setting.isPending || games.isPending || categories.isPending) && <p>กำลังโหลดการตั้งค่าค่าคอมมิชชั่น...</p>}
    {(rules.isError || setting.isError || games.isError || categories.isError) && <p role="alert" className="text-destructive">
      {isApiError(loadingError) && loadingError.status === 403
        ? "บัญชีนี้ไม่มีสิทธิ์ ADMIN สำหรับการตั้งค่าค่าคอมมิชชั่น" : "โหลดการตั้งค่าค่าคอมมิชชั่นไม่สำเร็จ"}
      <Button variant="outline" onClick={() => { void rules.refetch(); void setting.refetch(); void games.refetch(); void categories.refetch(); }}>ลองอีกครั้ง</Button>
    </p>}
    {rules.isSuccess && setting.isSuccess && games.isSuccess && categories.isSuccess && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <CommissionDefaultRateCard title="อัตราเริ่มต้นทั้งแพลตฟอร์ม" description="ใช้กับทุกหมวดหมู่ที่ไม่ได้ตั้งค่าเฉพาะไว้"
          value={globalRate} minLabel="0%" maxLabel="15%" recommendedLabel="แนะนำ 3–7%" max={15}
          onChange={setGlobalRate} />
        <CommissionCategoryList title="อัตราเฉพาะหมวดหมู่" description="เปิดสวิตช์เพื่อกำหนดอัตราแยกจากค่าเริ่มต้น"
          addLabel="+ เพิ่มหมวดหมู่" items={rowItems} onAdd={openAdvanced}
          onToggle={(id, checked) => setCategoryRates((old) => ({ ...old, [id]: { rate: old[id]?.rate ?? formatRate(savedRate), useCustom: checked } }))}
          onRateChange={(id, rate) => setCategoryRates((old) => ({ ...old, [id]: { rate, useCustom: old[id]?.useCustom ?? true } }))} />
      </div>
      <div className="space-y-4">
        <CommissionCalcCard title="ตัวอย่างการคำนวณ" rows={[
          { id: "price", label: "ราคาขาย", value: `฿${examplePrice.toLocaleString("th-TH")}` },
          { id: "commission", label: `ค่าคอมมิชชั่น (${previewRate.toFixed(1)}%)`, value: `− ${money(examplePrice * previewRate / 100)}` },
          { id: "fixed", label: "ค่าธรรมเนียมคงที่", value: `− ${money(Number(previewRule.fixedFee))}` },
          ...(previewFee !== examplePrice * previewRate / 100 + Number(previewRule.fixedFee)
            ? [{ id: "limit", label: "ปรับตามขั้นต่ำ/ขั้นสูง", value: money(previewFee) }] : []),
        ]} totalLabel="ผู้ขายได้รับ" totalValue={money(examplePrice - previewFee)} />
        <CommissionRulesCard title="กฎการเก็บค่าธรรมเนียม" items={[
          { id: "on-success", label: "เก็บเมื่อคำสั่งซื้อสำเร็จ", active: true },
          { id: "exclude-shipping", label: "ยกเว้นค่าส่ง", active: true },
          { id: "refund-on-cancel", label: "คืนค่าธรรมเนียมเมื่อยกเลิก", active: true },
          { id: "buyer-pays", label: "เก็บกับผู้ซื้อแทนผู้ขาย", active: false },
        ]} />
        <p className="px-1 text-xs text-muted-foreground">กฎเหล่านี้กำหนดโดยระบบ ยังเปลี่ยนจากหน้านี้ไม่ได้</p>
        <CommissionImpactCard title="ผลกระทบต่อผู้ขาย" description="อัตราใหม่มีผลกับคำสั่งซื้อที่สร้างหลังบันทึก และไม่เปลี่ยนยอดของคำสั่งซื้อเดิม" />
      </div>
    </div>}
    <details id="commission-advanced" className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-semibold">กฎเพิ่มเติมและการตั้งค่าขั้นสูง</summary><div className="mt-4 space-y-5">
    <Card><CardHeader><CardTitle>กฎปัจจุบัน</CardTitle></CardHeader><CardContent className="space-y-3">
      {rules.isPending && <p>กำลังโหลด...</p>}
      {rules.isError && <p role="alert">{isApiError(rules.error) && rules.error.status === 403
        ? "เซสชันนี้ไม่มีสิทธิ์ ADMIN สำหรับ API กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ หากยังพบปัญหาให้ตรวจ role ของบัญชี"
        : `โหลดกฎไม่สำเร็จ: ${getErrorMessage(rules.error, "กรุณาลองอีกครั้ง")}`} <Button variant="outline" onClick={() => void rules.refetch()}>ลองอีกครั้ง</Button></p>}
      {rules.data?.length === 0 && <p>ยังไม่มีกฎ</p>}
      {rules.data?.map((rule) => <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
        <div><strong>#{rule.id} · {rule.scope}</strong> {rule.scope !== "GLOBAL" && `#${rule.gameId ?? rule.categoryId ?? rule.sellerProfileId}`} · {rule.ratePercent}% + ฿{rule.fixedFee} · ลำดับ {rule.priority} · {rule.active ? "ใช้งาน" : "ปิดใช้งาน"}</div>
        <div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => void edit(rule.id)}>ดู/แก้ไข</Button>{rule.active && <Button variant="destructive" disabled={busy} onClick={() => void deactivate(rule.id)}>ปิดใช้งาน</Button>}</div>
      </div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{selected === null ? "เพิ่มกฎ" : `แก้ไขกฎ #${selected}`}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1">ขอบเขต<select className="w-full rounded border p-2" value={form.scope} onChange={(e) => { const scope = e.target.value as CommissionRuleInput["scope"]; setForm((old) => ({ ...old, scope, gameId: null, categoryId: null, sellerProfileId: null })); }}><option>GLOBAL</option><option>GAME</option><option>CATEGORY</option><option>SELLER</option></select></label>
      {form.scope === "GAME" && <label className="space-y-1">เกม
        <select className="w-full rounded border p-2" value={form.gameId ?? ""} onChange={(e) => update("gameId", optionalNumber(e.target.value))}>
          <option value="">เลือกเกม</option>
          {form.gameId != null && !games.data?.some((game) => game.id === form.gameId) && <option value={form.gameId}>เกมเดิม #{form.gameId}</option>}
          {games.data?.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}
        </select>
      </label>}
      {form.scope === "CATEGORY" && <label className="space-y-1">หมวดหมู่
        <select className="w-full rounded border p-2" value={form.categoryId ?? ""} onChange={(e) => update("categoryId", optionalNumber(e.target.value))}>
          <option value="">เลือกหมวดหมู่</option>
          {form.categoryId != null && !categories.data?.some((category) => category.id === form.categoryId) && <option value={form.categoryId}>หมวดหมู่เดิม #{form.categoryId}</option>}
          {categories.data?.map((category) => <option key={category.id} value={category.id}>
            {games.data?.find((game) => game.id === category.gameId)?.name ?? "ทุกเกม"} · {category.name}
          </option>)}
        </select>
      </label>}
      {form.scope === "SELLER" && <label className="space-y-1">Seller profile ID<Input type="number" min="1" value={form.sellerProfileId ?? ""} onChange={(e) => update("sellerProfileId", optionalNumber(e.target.value))} /></label>}
      <label className="space-y-1">อัตรา (%)<Input type="number" min="0" max="100" step="0.001" placeholder="0" value={form.ratePercent} onChange={(e) => update("ratePercent", e.target.value)} /></label>
      <label className="space-y-1">ค่าธรรมเนียมคงที่ (บาท)<Input type="number" min="0" step="0.01" placeholder="0" value={form.fixedFee} onChange={(e) => update("fixedFee", e.target.value)} /></label>
      <label className="space-y-1">ขั้นต่ำ (บาท)<Input type="number" min="0" step="0.01" value={form.minFee} onChange={(e) => update("minFee", e.target.value)} /></label>
      <label className="space-y-1">ขั้นสูง (บาท)<Input type="number" min="0" step="0.01" value={form.maxFee} onChange={(e) => update("maxFee", e.target.value)} /></label>
      <label className="space-y-1">ลำดับความสำคัญ<Input type="number" step="1" placeholder="0" value={form.priority} onChange={(e) => update("priority", e.target.value)} /></label>
      <label className="space-y-1">เริ่มมีผล<Input type="datetime-local" value={localDateTime(form.effectiveFrom)} onChange={(e) => update("effectiveFrom", new Date(e.target.value).toISOString())} /></label>
      <label className="space-y-1">สิ้นสุด<Input type="datetime-local" value={form.effectiveTo ? localDateTime(form.effectiveTo) : ""} onChange={(e) => update("effectiveTo", e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />เปิดใช้งาน</label>
      <div className="flex gap-2 sm:col-span-2"><Button disabled={busy} onClick={() => void save()}>{selected === null ? "สร้างกฎ" : "บันทึก"}</Button>{selected !== null && <Button variant="outline" onClick={() => { setSelected(null); setForm(blankDraft()); }}>ยกเลิก</Button>}</div>
    </CardContent></Card>
    </div></details>
  </div>;
}
