import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Pencil, Plus, Power, Trash2, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { getErrorMessage, hasErrorCode, isApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  SCOPE_OPTIONS, STATUS_LABEL, blankDraft, conflictingRules, draftFromRule, draftToInput,
  feeBreakdown, ruleStatus, scopeLabel, validateDraft,
  type RuleDraft, type RuleErrors, type RuleScope, type RuleStatus,
} from "@/features/admin/commission-rule.form";
import type { CategoryDto, GameDto } from "@/features/catalog/catalog.types";
import { afterSalesApi } from "@/features/finance/after-sales.api";
import type { CommissionRule } from "@/features/finance/after-sales.types";

/** popup เปิดได้ 2 แบบ: ดูรายการกฎทั้งหมด หรือเข้าฟอร์มเพิ่ม/แก้ไขกฎทันที */
export type CommissionRuleDialogRequest =
  | { view: "list" }
  | { view: "form"; rule: CommissionRule | null; preset?: Partial<RuleDraft> };

type CommissionRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CommissionRuleDialogRequest;
  rules: CommissionRule[];
  games: GameDto[];
  categories: CategoryDto[];
  /** โหลดกฎใหม่หลังสร้าง/แก้/ปิด/ลบ — ไม่ล้างค่าที่แอดมินพิมพ์ค้างไว้บนหน้า */
  onChanged: () => Promise<unknown>;
};

const SCOPE_RANK: Record<RuleScope, number> = { SELLER: 4, CATEGORY: 3, GAME: 2, GLOBAL: 1 };
const STATUS_RANK: Record<RuleStatus, number> = { ACTIVE: 0, SCHEDULED: 1, EXPIRED: 2, INACTIVE: 3 };
const STATUS_STYLE: Record<RuleStatus, string> = {
  ACTIVE: "bg-[#e6f4ea] text-[#1e7a3c]",
  SCHEDULED: "bg-[#e6f0fb] text-[#0058bc]",
  EXPIRED: "bg-[#eef1f2] text-[#67787c]",
  INACTIVE: "bg-[#eef1f2] text-[#9aa5ad]",
};

const baht = (value: number) =>
  `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
const FIELD = "h-9 rounded-md border-[#e3e7e8] bg-white";
const DECIMAL = /^\d*\.?\d*$/;
const SIGNED_INTEGER = /^-?\d*$/;

function ruleErrorMessage(error: unknown) {
  if (hasErrorCode(error, "GAME_NOT_FOUND")) return "ไม่พบเกมนี้ในระบบแล้ว";
  if (hasErrorCode(error, "CATEGORY_NOT_FOUND")) return "ไม่พบหมวดหมู่นี้ในระบบแล้ว";
  if (hasErrorCode(error, "SELLER_NOT_FOUND")) return "ไม่พบร้านค้ารหัสนี้";
  if (hasErrorCode(error, "COMMISSION_RULE_NOT_FOUND")) return "กฎนี้ไม่มีอยู่ในระบบแล้ว";
  if (hasErrorCode(error, "COMMISSION_RULE_INVALID", "VALIDATION_FAILED")) return "ข้อมูลกฎไม่ถูกต้อง กรุณาตรวจอีกครั้ง";
  if (isApiError(error) && error.status === 403) return "บัญชีนี้ไม่มีสิทธิ์ ADMIN";
  return getErrorMessage(error, "กรุณาลองอีกครั้ง");
}

export function CommissionRuleDialog({
  open, onOpenChange, request, rules, games, categories, onChanged,
}: CommissionRuleDialogProps) {
  const [view, setView] = useState<"list" | "form">(request.view);
  const [editing, setEditing] = useState<CommissionRule | null>(request.view === "form" ? request.rule : null);
  const [draft, setDraft] = useState<RuleDraft>(() => request.view !== "form" ? blankDraft()
    : request.rule ? draftFromRule(request.rule) : { ...blankDraft(), ...request.preset });
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<RuleErrors>({});
  const [busy, setBusy] = useState(false);

  // error จาก backend (เช่นไม่พบร้านค้า) ผูกกับค่าที่ส่งไป — แก้ฟอร์มเมื่อไหร่ก็ล้างทิ้ง
  const changeDraft = (update: (old: RuleDraft) => RuleDraft) => { setServerErrors({}); setDraft(update); };
  const gameName = (id: number | null) => games.find((game) => game.id === id)?.name;
  const categoryLabel = (category: CategoryDto) => `${gameName(category.gameId) ?? "ทุกเกม"} · ${category.name}`;
  const targetName = (rule: Pick<CommissionRule, "scope" | "gameId" | "categoryId" | "sellerProfileId">) => {
    switch (rule.scope) {
      case "GLOBAL": return "ทั้งแพลตฟอร์ม";
      case "GAME": return gameName(rule.gameId) ?? `เกม #${rule.gameId}`;
      case "CATEGORY": {
        const category = categories.find((item) => item.id === rule.categoryId);
        return category ? categoryLabel(category) : `หมวดหมู่ #${rule.categoryId}`;
      }
      case "SELLER": return `ร้านค้า #${rule.sellerProfileId}`;
    }
  };

  function openForm(rule: CommissionRule | null) {
    setEditing(rule);
    setDraft(rule ? draftFromRule(rule) : blankDraft());
    setSubmitted(false);
    setServerErrors({});
    setView("form");
  }

  async function run(action: () => Promise<unknown>, success: string, failure = "บันทึกไม่สำเร็จ") {
    setBusy(true);
    try {
      await action();
      await onChanged();
      toast.add({ type: "success", title: success });
      return true;
    } catch (error) {
      if (hasErrorCode(error, "SELLER_NOT_FOUND")) setServerErrors({ target: "ไม่พบร้านค้ารหัสนี้" });
      toast.add({ type: "error", title: failure, description: ruleErrorMessage(error) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setServerErrors({});
    if (Object.keys(validateDraft(draft)).length > 0) return;
    const input = draftToInput(draft);
    const saved = await run(
      () => editing ? afterSalesApi.updateCommissionRule(editing.id, input) : afterSalesApi.createCommissionRule(input),
      editing ? `บันทึกกฎ #${editing.id} แล้ว` : "เพิ่มกฎค่าคอมมิชชั่นแล้ว",
    );
    if (saved) setView("list");
  }

  const setActive = (rule: CommissionRule, active: boolean) => active
    ? run(() => { const { id, ...input } = rule; return afterSalesApi.updateCommissionRule(id, { ...input, active: true }); },
      `เปิดใช้งานกฎ #${rule.id} แล้ว`)
    : run(() => afterSalesApi.deactivateCommissionRule(rule.id), `ปิดใช้งานกฎ #${rule.id} แล้ว`);
  // ลบถาวร — คำสั่งซื้อเดิมเก็บอัตราและยอดค่าคอมที่คิดไว้ตอนสั่งซื้อ จึงไม่กระทบย้อนหลัง
  const remove = (rule: CommissionRule) =>
    run(() => afterSalesApi.deleteCommissionRule(rule.id), `ลบกฎ #${rule.id} แล้ว`, "ลบไม่สำเร็จ");
  async function removeEditing() {
    if (editing && await remove(editing)) setView("list");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[820px]">
        {view === "list"
          ? <RuleList rules={rules} busy={busy} targetName={targetName} onAdd={() => openForm(null)}
            onEdit={openForm} onSetActive={setActive} onDelete={remove} />
          : <RuleForm draft={draft} setDraft={changeDraft} editing={editing} rules={rules} busy={busy}
            errors={{ ...(submitted ? validateDraft(draft) : {}), ...serverErrors }}
            games={games} categories={categories} categoryLabel={categoryLabel} targetName={targetName}
            onBack={() => setView("list")} onSubmit={submit} onDelete={removeEditing} />}
      </DialogContent>
    </Dialog>
  );
}

/* ── รายการกฎ ──────────────────────────────────────────────────── */

type RuleListProps = {
  rules: CommissionRule[];
  busy: boolean;
  targetName: (rule: CommissionRule) => string;
  onAdd: () => void;
  onEdit: (rule: CommissionRule) => void;
  onSetActive: (rule: CommissionRule, active: boolean) => Promise<boolean>;
  onDelete: (rule: CommissionRule) => Promise<boolean>;
};

type PendingAction = { id: number; action: "deactivate" | "delete" };

function RuleList({ rules, busy, targetName, onAdd, onEdit, onSetActive, onDelete }: RuleListProps) {
  const [scope, setScope] = useState<RuleScope | "ALL">("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const now = new Date();
  const visible = rules
    .filter((rule) => scope === "ALL" || rule.scope === scope)
    .filter((rule) => showInactive || rule.active)
    .sort((a, b) => STATUS_RANK[ruleStatus(a, now)] - STATUS_RANK[ruleStatus(b, now)]
      || SCOPE_RANK[b.scope] - SCOPE_RANK[a.scope] || b.priority - a.priority || b.id - a.id);
  const count = (value: RuleScope | "ALL") =>
    rules.filter((rule) => (value === "ALL" || rule.scope === value) && (showInactive || rule.active)).length;

  return <>
    <div className="flex flex-col gap-1.5 border-b border-[#eef1f2] px-6 pt-6 pb-4 pr-14">
      <DialogTitle className="text-lg font-bold text-[#090b0c]">กฎค่าคอมมิชชั่น</DialogTitle>
      <DialogDescription className="text-xs text-[#67787c]">
        ตอนคิดค่าธรรมเนียม ระบบเลือกกฎที่เจาะจงที่สุด: ผู้ขาย › หมวดหมู่ › เกม › ทั้งแพลตฟอร์ม
        ถ้าขอบเขตเท่ากัน ลำดับความสำคัญมากกว่าชนะ
      </DialogDescription>
    </div>

    <div className="flex flex-wrap items-center gap-2 px-6 py-3">
      <div role="tablist" aria-label="กรองตามขอบเขต" className="flex flex-wrap gap-1.5">
        {(["ALL", ...SCOPE_OPTIONS.map((option) => option.value)] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={scope === value} onClick={() => setScope(value)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              scope === value ? "border-[#090b0c] bg-[#090b0c] text-white" : "border-[#e3e7e8] text-[#414755] hover:bg-[#fafbfb]")}>
            {value === "ALL" ? "ทั้งหมด" : scopeLabel(value)} <span className="opacity-60">{count(value)}</span>
          </button>
        ))}
      </div>
      <label className="ml-auto flex items-center gap-2 text-xs text-[#414755]">
        <Switch size="sm" checked={showInactive} onCheckedChange={setShowInactive} aria-label="แสดงกฎที่ปิดใช้งาน" />
        แสดงกฎที่ปิดใช้งาน
      </label>
      <Button size="sm" className="rounded-md px-2.5" onClick={onAdd}><Plus />เพิ่มกฎ</Button>
    </div>

    <ul className="min-h-[200px] flex-1 overflow-y-auto border-t border-[#eef1f2]" aria-label="รายการกฎค่าคอมมิชชั่น">
      {visible.length === 0 && <li className="px-6 py-10 text-center text-sm text-[#67787c]">
        ยังไม่มีกฎในมุมมองนี้ — ระบบจะใช้อัตราเริ่มต้นทั้งแพลตฟอร์ม
      </li>}
      {visible.map((rule) => {
        const status = ruleStatus(rule, now);
        return (
          <li key={rule.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#eef1f2] px-6 py-3.5 last:border-b-0">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-medium text-[#090b0c]">{targetName(rule)}</span>
                <Badge variant="outline" className="h-[18px] rounded-md px-1.5 text-[10px] text-[#67787c]">{scopeLabel(rule.scope)}</Badge>
                <Badge className={cn("h-[18px] rounded-md px-1.5 text-[10px]", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</Badge>
                <span className="text-[10px] text-[#9aa5ad]">#{rule.id}</span>
              </div>
              <p className="text-xs text-[#414755] tabular-nums">
                <strong className="font-semibold text-[#090b0c]">{rule.ratePercent}%</strong>
                {rule.fixedFee > 0 && <> + {baht(rule.fixedFee)}</>}
                {rule.minFee != null && <> · ขั้นต่ำ {baht(rule.minFee)}</>}
                {rule.maxFee != null && <> · ขั้นสูง {baht(rule.maxFee)}</>}
                {" · "}ลำดับ {rule.priority}
              </p>
              <p className="text-[11px] text-[#9aa5ad]">
                {dateTime(rule.effectiveFrom)} – {rule.effectiveTo ? dateTime(rule.effectiveTo) : "ไม่มีกำหนดสิ้นสุด"}
              </p>
            </div>

            {pending?.id === rule.id
              ? <ConfirmBar busy={busy} onCancel={() => setPending(null)}
                message={pending.action === "delete" ? "ลบกฎนี้ถาวร? กู้คืนไม่ได้" : "ปิดใช้งานกฎนี้?"}
                onConfirm={async () => {
                  const done = pending.action === "delete" ? await onDelete(rule) : await onSetActive(rule, false);
                  if (done) setPending(null);
                }} />
              : <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="rounded-md px-2.5" disabled={busy}
                  aria-label={`แก้ไขกฎ #${rule.id}`} onClick={() => onEdit(rule)}><Pencil />แก้ไข</Button>
                {rule.active
                  ? <Button size="sm" variant="ghost" className="rounded-md px-2.5 text-destructive" disabled={busy}
                    aria-label={`ปิดใช้งานกฎ #${rule.id}`} onClick={() => setPending({ id: rule.id, action: "deactivate" })}><Power />ปิด</Button>
                  : <Button size="sm" variant="ghost" className="rounded-md px-2.5" disabled={busy}
                    aria-label={`เปิดใช้งานกฎ #${rule.id}`} onClick={() => void onSetActive(rule, true)}><Power />เปิด</Button>}
                <Button size="icon-sm" variant="ghost" className="rounded-md text-destructive" disabled={busy}
                  aria-label={`ลบกฎ #${rule.id}`} title="ลบกฎ" onClick={() => setPending({ id: rule.id, action: "delete" })}><Trash2 /></Button>
              </div>}
          </li>
        );
      })}
    </ul>
  </>;
}

/* ── ฟอร์มเพิ่ม/แก้ไข ─────────────────────────────────────────── */

type RuleFormProps = {
  draft: RuleDraft;
  setDraft: (update: (old: RuleDraft) => RuleDraft) => void;
  editing: CommissionRule | null;
  rules: CommissionRule[];
  busy: boolean;
  errors: RuleErrors;
  games: GameDto[];
  categories: CategoryDto[];
  categoryLabel: (category: CategoryDto) => string;
  targetName: (rule: CommissionRule) => string;
  onBack: () => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: () => Promise<void>;
};

function RuleForm({
  draft, setDraft, editing, rules, busy, errors, games, categories, categoryLabel, targetName, onBack, onSubmit, onDelete,
}: RuleFormProps) {
  const id = useId();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [samplePrice, setSamplePrice] = useState("1290");
  const update = <K extends keyof RuleDraft>(key: K, value: RuleDraft[K]) => setDraft((old) => ({ ...old, [key]: value }));
  const typed = (key: keyof RuleDraft, pattern: RegExp) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    if (pattern.test(value)) update(key, value as never);
  };

  const scopeHint = SCOPE_OPTIONS.find((option) => option.value === draft.scope)?.hint;
  const valid = Object.keys(validateDraft(draft)).length === 0;
  const conflicts = valid ? conflictingRules(draftToInput(draft), rules, editing?.id ?? null) : [];
  const price = Number(samplePrice) || 0;
  const preview = feeBreakdown(price, {
    ratePercent: Math.min(100, Number(draft.ratePercent) || 0),
    fixedFee: Number(draft.fixedFee) || 0,
    minFee: draft.minFee === "" ? null : Number(draft.minFee) || 0,
    maxFee: draft.maxFee === "" ? null : Number(draft.maxFee) || 0,
  });
  const gameItems = [
    ...(draft.gameId != null && !games.some((game) => game.id === draft.gameId)
      ? [{ value: String(draft.gameId), label: `เกม #${draft.gameId}` }] : []),
    ...games.map((game) => ({ value: String(game.id), label: game.name })),
  ];
  const categoryItems = [
    ...(draft.categoryId != null && !categories.some((category) => category.id === draft.categoryId)
      ? [{ value: String(draft.categoryId), label: `หมวดหมู่ #${draft.categoryId}` }] : []),
    ...categories.map((category) => ({ value: String(category.id), label: categoryLabel(category) })),
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1.5 border-b border-[#eef1f2] px-6 pt-5 pb-4 pr-14">
        <button type="button" onClick={onBack}
          className="flex w-fit items-center gap-1 text-xs text-[#67787c] hover:text-[#090b0c]">
          <ArrowLeft className="size-3.5" />กฎทั้งหมด
        </button>
        <DialogTitle className="text-lg font-bold text-[#090b0c]">
          {editing ? `แก้ไขกฎ #${editing.id}` : "เพิ่มกฎค่าคอมมิชชั่น"}
        </DialogTitle>
        <DialogDescription className="text-xs text-[#67787c]">
          {editing ? "การแก้ไขมีผลกับคำสั่งซื้อที่สร้างหลังบันทึก คำสั่งซื้อเดิมไม่เปลี่ยน"
            : "กำหนดอัตราแยกให้เกม หมวดหมู่ หรือผู้ขาย ระบบใช้อัตราเริ่มต้นกับส่วนที่ไม่มีกฎ"}
        </DialogDescription>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-6 py-5 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-5">
          <Section title="ใช้กับ">
            <div role="radiogroup" aria-label="ขอบเขต" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCOPE_OPTIONS.map((option) => (
                <button key={option.value} type="button" role="radio" aria-checked={draft.scope === option.value}
                  onClick={() => setDraft((old) => ({ ...old, scope: option.value }))}
                  className={cn("rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    draft.scope === option.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-[#e3e7e8] text-[#414755] hover:bg-[#fafbfb]")}>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#67787c]">{scopeHint}</p>

            {draft.scope === "GAME" && <Field className="gap-1.5" data-invalid={!!errors.target}>
              <FieldLabel htmlFor={`${id}-game`} className="text-xs">เกม</FieldLabel>
              <Select value={draft.gameId == null ? null : String(draft.gameId)} items={gameItems}
                onValueChange={(value) => update("gameId", value == null ? null : Number(value))}>
                <SelectTrigger id={`${id}-game`} aria-invalid={!!errors.target} className={cn(FIELD, "w-full")}>
                  <SelectValue placeholder="เลือกเกม" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}><SelectGroup>
                  {gameItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectGroup></SelectContent>
              </Select>
              <FieldError className="text-xs">{errors.target}</FieldError>
            </Field>}

            {draft.scope === "CATEGORY" && <Field className="gap-1.5" data-invalid={!!errors.target}>
              <FieldLabel htmlFor={`${id}-category`} className="text-xs">หมวดหมู่</FieldLabel>
              <Select value={draft.categoryId == null ? null : String(draft.categoryId)} items={categoryItems}
                onValueChange={(value) => update("categoryId", value == null ? null : Number(value))}>
                <SelectTrigger id={`${id}-category`} aria-invalid={!!errors.target} className={cn(FIELD, "w-full")}>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}><SelectGroup>
                  {categoryItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectGroup></SelectContent>
              </Select>
              <FieldError className="text-xs">{errors.target}</FieldError>
            </Field>}

            {draft.scope === "SELLER" && <Field className="gap-1.5" data-invalid={!!errors.target}>
              <FieldLabel htmlFor={`${id}-seller`} className="text-xs">รหัสร้านค้า (seller profile ID)</FieldLabel>
              <InputGroup className={FIELD}>
                <InputGroupAddon><InputGroupText>#</InputGroupText></InputGroupAddon>
                <InputGroupInput id={`${id}-seller`} inputMode="numeric" placeholder="เช่น 12" aria-invalid={!!errors.target}
                  value={draft.sellerProfileId} onChange={typed("sellerProfileId", /^\d*$/)} />
              </InputGroup>
              <FieldDescription className="text-[11px]">ดูรหัสได้จากหน้าคำสั่งซื้อหรือหน้าอนุมัติผู้ขาย</FieldDescription>
              <FieldError className="text-xs">{errors.target}</FieldError>
            </Field>}
          </Section>

          <Section title="อัตราและค่าธรรมเนียม">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id={`${id}-rate`} label="อัตราค่าคอมมิชชั่น" suffix="%" placeholder="เช่น 5.0"
                value={draft.ratePercent} onChange={typed("ratePercent", DECIMAL)} error={errors.ratePercent}
                hint="0–100% ทศนิยมได้ 3 ตำแหน่ง" />
              <NumberField id={`${id}-fixed`} label="ค่าธรรมเนียมคงที่ต่อคำสั่งซื้อ" prefix="฿" placeholder="0.00"
                value={draft.fixedFee} onChange={typed("fixedFee", DECIMAL)} error={errors.fixedFee}
                hint="บวกเพิ่มจากส่วนเปอร์เซ็นต์ เว้นว่าง = 0" />
              <NumberField id={`${id}-min`} label="เก็บขั้นต่ำ" prefix="฿" placeholder="ไม่กำหนด"
                value={draft.minFee} onChange={typed("minFee", DECIMAL)} error={errors.minFee} />
              <NumberField id={`${id}-max`} label="เก็บสูงสุด" prefix="฿" placeholder="ไม่กำหนด"
                value={draft.maxFee} onChange={typed("maxFee", DECIMAL)} error={errors.maxFee} />
            </div>
          </Section>

          <Section title="ช่วงเวลาและลำดับ">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-1.5" data-invalid={!!errors.effectiveFrom}>
                <FieldLabel htmlFor={`${id}-from`} className="text-xs">เริ่มมีผล</FieldLabel>
                <InputGroup className={FIELD}><InputGroupInput id={`${id}-from`} type="datetime-local"
                  aria-invalid={!!errors.effectiveFrom} value={draft.effectiveFrom}
                  onChange={(event) => update("effectiveFrom", event.target.value)} /></InputGroup>
                <FieldError className="text-xs">{errors.effectiveFrom}</FieldError>
              </Field>
              <Field className="gap-1.5" data-invalid={!!errors.effectiveTo}>
                <FieldLabel htmlFor={`${id}-to`} className="text-xs">สิ้นสุด</FieldLabel>
                <InputGroup className={FIELD}><InputGroupInput id={`${id}-to`} type="datetime-local"
                  aria-invalid={!!errors.effectiveTo} value={draft.effectiveTo}
                  onChange={(event) => update("effectiveTo", event.target.value)} /></InputGroup>
                <FieldDescription className="text-[11px]">เว้นว่าง = ใช้ต่อไปจนกว่าจะปิด</FieldDescription>
                <FieldError className="text-xs">{errors.effectiveTo}</FieldError>
              </Field>
              <NumberField id={`${id}-priority`} label="ลำดับความสำคัญ" placeholder="0"
                value={draft.priority} onChange={typed("priority", SIGNED_INTEGER)} error={errors.priority}
                hint="ใช้ตัดสินเมื่อมีหลายกฎในขอบเขตเดียวกัน ค่ามากชนะ" />
              <Field orientation="horizontal" className="items-center gap-2.5 self-start pt-6">
                <Switch id={`${id}-active`} aria-label="เปิดใช้งานกฎนี้" checked={draft.active} onCheckedChange={(checked) => update("active", checked)} />
                <FieldLabel htmlFor={`${id}-active`} className="text-[13px] font-normal">เปิดใช้งานกฎนี้</FieldLabel>
              </Field>
            </div>
          </Section>

          {conflicts.length > 0 && <div role="status" className="flex gap-2 rounded-lg bg-[#fdf0dd] px-3 py-2.5 text-xs text-[#b45309]">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <div>
              มีกฎที่เปิดอยู่สำหรับ {targetName(conflicts[0])} ในช่วงเวลาเดียวกัน
              ({conflicts.map((rule) => `#${rule.id} ${rule.ratePercent}% ลำดับ ${rule.priority}`).join(", ")})
              — ระบบจะใช้กฎที่ลำดับสูงกว่า ถ้าเท่ากันใช้กฎที่สร้างทีหลัง
            </div>
          </div>}
        </div>

        <aside className="flex h-fit flex-col gap-3 rounded-xl bg-[#090b0c] p-5 text-white md:sticky md:top-0">
          <p className="text-[13px] font-semibold">ตัวอย่างการคำนวณ</p>
          <label className="flex items-center justify-between gap-3 text-xs text-[#9aa5ad]">
            ราคาขาย
            <span className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-white">
              ฿<input aria-label="ราคาขายตัวอย่าง" inputMode="decimal" value={samplePrice}
                onChange={(event) => DECIMAL.test(event.target.value) && setSamplePrice(event.target.value)}
                className="w-20 bg-transparent text-right font-medium tabular-nums outline-none" />
            </span>
          </label>
          <dl className="flex flex-col gap-[11px] text-xs">
            <PreviewRow label={`ค่าคอมมิชชั่น (${Number(draft.ratePercent) || 0}%)`} value={`− ${baht(preview.percentPart)}`} />
            <PreviewRow label="ค่าธรรมเนียมคงที่" value={`− ${baht(preview.fixedFee)}`} />
            {preview.clamped && <PreviewRow label={{ min: "ปรับขึ้นเป็นขั้นต่ำ", max: "ปรับลงเป็นขั้นสูงสุด", price: "ไม่เกินราคาขาย" }[preview.clamped]}
              value={baht(preview.fee)} />}
            <PreviewRow label="ค่าธรรมเนียมรวม" value={`− ${baht(preview.fee)}`} />
          </dl>
          <div className="h-px bg-[#2c3336]" />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium">ผู้ขายได้รับ</span>
            <span className="text-xl font-bold tracking-[-0.4px] tabular-nums">{baht(preview.sellerNet)}</span>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#eef1f2] px-6 py-4">
        {editing && <div className="mr-auto">
          {confirmDelete
            ? <ConfirmBar busy={busy} message={`ลบกฎ #${editing.id} ถาวร? กู้คืนไม่ได้`}
              onCancel={() => setConfirmDelete(false)} onConfirm={onDelete} />
            : <Button type="button" variant="ghost" className="rounded-md px-2.5 text-destructive" disabled={busy}
              onClick={() => setConfirmDelete(true)}><Trash2 />ลบกฎ</Button>}
        </div>}
        <Button type="button" variant="outline" className="rounded-md px-2.5" disabled={busy} onClick={onBack}>ยกเลิก</Button>
        <Button type="submit" className="rounded-md px-2.5" disabled={busy}>
          {busy ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "สร้างกฎ"}
        </Button>
      </div>
    </form>
  );
}

function ConfirmBar({ message, busy, onCancel, onConfirm }: {
  message: string; busy: boolean; onCancel: () => void; onConfirm: () => Promise<unknown>;
}) {
  return <div className="flex items-center gap-2 rounded-lg bg-[#fdf0dd] px-3 py-1.5">
    <span className="text-xs text-[#b45309]">{message}</span>
    <Button type="button" size="xs" variant="outline" className="rounded-md" disabled={busy} onClick={onCancel}>ยกเลิก</Button>
    <Button type="button" size="xs" variant="destructive" className="rounded-md" disabled={busy}
      onClick={() => void onConfirm()}>ยืนยัน</Button>
  </div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-[13px] font-semibold text-[#090b0c]">{title}</legend>
    {children}
  </fieldset>;
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3">
    <dt className="text-[#9aa5ad]">{label}</dt>
    <dd className="font-medium tabular-nums">{value}</dd>
  </div>;
}

type NumberFieldProps = {
  id: string; label: string; value: string; placeholder?: string;
  prefix?: string; suffix?: string; hint?: string; error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function NumberField({ id, label, value, placeholder, prefix, suffix, hint, error, onChange }: NumberFieldProps) {
  return <Field className="gap-1.5" data-invalid={!!error}>
    <FieldLabel htmlFor={id} className="text-xs">{label}</FieldLabel>
    <InputGroup className={FIELD}>
      {prefix && <InputGroupAddon><InputGroupText>{prefix}</InputGroupText></InputGroupAddon>}
      <InputGroupInput id={id} inputMode="decimal" placeholder={placeholder} value={value}
        aria-invalid={!!error} onChange={onChange} className="tabular-nums" />
      {suffix && <InputGroupAddon align="inline-end"><InputGroupText>{suffix}</InputGroupText></InputGroupAddon>}
    </InputGroup>
    {hint && !error && <FieldDescription className="text-[11px]">{hint}</FieldDescription>}
    <FieldError className="text-xs">{error}</FieldError>
  </Field>;
}
