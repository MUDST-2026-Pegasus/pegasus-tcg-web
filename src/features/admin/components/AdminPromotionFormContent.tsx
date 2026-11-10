import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import { Info, Lock, LogOut } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/common";
import { FormPageSkeleton } from "@/components/common/PageSkeletons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { hasErrorCode } from "@/lib/api";
import { cn } from "@/lib/utils";

import { useAdminGames } from "../catalog.queries";
import { PROMOTION_DANGER_BUTTON, PROMOTION_PAGE_CONTROLS } from "../promotions.styles";
import { HOME_STRIP_MAX, type ScopeNames, promotionErrorMessage } from "../promotions.format";
import {
  usePlatformPromotions,
  usePromotion,
  usePromotionCategories,
  useSavePromotion,
} from "../promotions.queries";
import {
  type PromotionFormErrors,
  getPromotionErrors,
  getPromotionLocks,
  toPromotionInput,
  toPromotionPayload,
} from "../promotions.schema";
import type { AdminPromotion, AdminPromotionInput } from "../promotions.types";
import { AdminPromotionFormSections } from "./AdminPromotionFormSections";
import { PromotionDialog } from "./PromotionDialog";
import { PromotionFormAside } from "./PromotionFormAside";
import { PromotionSaveDialog } from "./PromotionSaveDialog";
import { intlLocale, useTranslate } from "@/lib/i18n";

/** ลำดับฟิลด์บนหน้า — กดบันทึกแล้วเลื่อนไปหา error แรกตามนี้ */
const FIELD_ORDER: Array<keyof AdminPromotionInput> = [
  "code",
  "name",
  "visibility",
  "description",
  "discountType",
  "discountValue",
  "maxDiscount",
  "minSpend",
  "scopeType",
  "scopeIds",
  "newBuyerOnly",
  "startsAt",
  "endsAt",
  "usageLimitTotal",
  "usageLimitPerUser",
  "claimable",
  "featuredOnHome",
  "claimLimit",
  "homeSort",
  "claimRequired",
];

/** เริ่มพรุ่งนี้ 00:00 ยาว 30 วัน — ค่าเริ่มต้นตาม Figma PRM-A2 */
function emptyPromotion(): AdminPromotionInput {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 29);
  end.setHours(23, 59, 0, 0);
  return {
    code: "",
    name: "",
    description: null,
    discountType: "PERCENT",
    discountValue: 10,
    maxDiscount: 200,
    minSpend: 500,
    scopeType: "ALL",
    scopeIds: [],
    visibility: "PUBLIC",
    newBuyerOnly: false,
    usageLimitTotal: 500,
    usageLimitPerUser: 1,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    claimable: true,
    claimRequired: false,
    claimLimit: 800,
    featuredOnHome: true,
    // ใส่ใบถัดไปของแถบหน้าแรกเมื่อรู้จำนวนใบตอนนี้ (ดู effect ใน PromotionEditor)
    homeSort: null,
  };
}

/** หน้า /admin/promotions/new และ /:id/edit (Figma PRM-A2) */
export function AdminPromotionFormContent({ id }: { id: number }) {
  const { t } = useTranslate("promotions");
  const existing = usePromotion(id);
  if (id > 0 && existing.isPending) return <FormPageSkeleton label={t("admin.adminPromotionFormContent.label", "กำลังโหลดโค้ด")} />;
  if (id > 0 && existing.isError) {
    return (
      <ErrorState
        title={t("admin.adminPromotionFormContent.title", "โหลดโค้ดไม่สำเร็จ")}
        fallbackMessage={promotionErrorMessage(existing.error, t("admin.adminPromotionFormContent.promotionErrorMessage", "กรุณาลองอีกครั้ง"))}
        onRetry={() => void existing.refetch()}
      />
    );
  }
  if (existing.data?.ownerType === "SELLER") {
    return (
      <EmptyState icon={Lock} title={t("admin.adminPromotionFormContent.title2", "โค้ดร้านค้าแก้ไขโดยแอดมินไม่ได้")}>
        <Button variant="outline" nativeButton={false} render={<Link to="/admin/promotions" />}>
          {t("admin.adminPromotionFormContent.button", "กลับไปรายการโปรโมชั่น")}
        </Button>
      </EmptyState>
    );
  }
  return <PromotionEditor key={id || "new"} existing={existing.data} />;
}

function PromotionEditor({ existing }: { existing?: AdminPromotion }) {
  const { t } = useTranslate("promotions");
  const navigate = useNavigate();
  const save = useSavePromotion();
  const games = useAdminGames();
  const platform = usePlatformPromotions();
  const [form, setForm] = useState<AdminPromotionInput>(() => (existing ? toPromotionInput(existing) : emptyPromotion()));
  const categories = usePromotionCategories(form.scopeType === "CATEGORY");
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<PromotionFormErrors>({});
  const blocker = useBlocker(dirty && !saved);
  const locks = getPromotionLocks(existing);
  const featuredCount = platform.data?.filter((promotion) => promotion.featuredOnHome && promotion.status !== "EXPIRED").length;

  const scopeNames = useMemo<ScopeNames>(
    () => ({
      games: new Map((games.data ?? []).map((game) => [game.id, game.name])),
      categories: new Map((categories.data ?? []).map((category) => [category.id, category.name])),
    }),
    [games.data, categories.data],
  );

  // ปิดแท็บ/รีโหลดตอนมีข้อมูลค้าง — route blocker จับได้แค่การเปลี่ยนหน้าในแอป
  useEffect(() => {
    if (!dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  const change = <K extends keyof AdminPromotionInput>(key: K, value: AdminPromotionInput[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "visibility" && value === "PRIVATE") {
        Object.assign(next, { claimable: false, claimRequired: false, featuredOnHome: false, homeSort: null });
      }
      if (key === "claimable" && !value) Object.assign(next, { claimRequired: false, featuredOnHome: false, homeSort: null });
      if (key === "featuredOnHome" && !value) next.homeSort = null;
      if (key === "scopeType") next.scopeIds = [];
      return next;
    });
    setDirty(true);
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // โค้ดใหม่ที่ยังไม่ได้เลือกลำดับ ต่อท้ายแถบหน้าแรกตามจำนวนใบตอนนี้
  const nextHomeSort =
    !existing && form.featuredOnHome && featuredCount != null && featuredCount < HOME_STRIP_MAX ? featuredCount : null;
  const formValues = form.homeSort == null && nextHomeSort != null ? { ...form, homeSort: nextHomeSort } : form;
  const payload = toPromotionPayload(formValues);

  const requestSave = () => {
    const next = getPromotionErrors(formValues, { existing, featuredCount });
    setErrors(next);
    const first = FIELD_ORDER.find((key) => next[key]);
    if (!first) {
      setConfirming(true);
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    target?.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])")?.focus({ preventScroll: true });
  };

  const submit = () =>
    save.mutate(
      { id: existing?.id, input: payload },
      {
        onSuccess: () => {
          // ปลด blocker ก่อน navigate ไม่งั้นถาม "ออกจากหน้านี้?" ซ้ำ
          flushSync(() => setSaved(true));
          toast.add({
            title: existing ? t("admin.adminPromotionFormContent.title3", "บันทึกการเปลี่ยนแปลงแล้ว") : t("admin.adminPromotionFormContent.title4", "เปิดใช้ {code} แล้ว", { code: payload.code }),
            type: "success",
          });
          navigate("/admin/promotions");
        },
        onError: (error) => {
          setConfirming(false);
          if (hasErrorCode(error, "PROMO_CODE_TAKEN")) {
            setErrors((current) => ({ ...current, code: promotionErrorMessage(error, "") }));
            document.querySelector('[data-field="code"]')?.scrollIntoView?.({ behavior: "smooth", block: "center" });
            return;
          }
          toast.add({
            title: existing ? t("admin.adminPromotionFormContent.title5", "บันทึกไม่สำเร็จ") : t("admin.adminPromotionFormContent.title6", "สร้างโค้ดไม่สำเร็จ"),
            description: promotionErrorMessage(error, t("admin.adminPromotionFormContent.promotionErrorMessage", "กรุณาลองอีกครั้ง")),
            type: "error",
          });
        },
      },
    );

  const scopeOptions = form.scopeType === "GAME" ? games : categories;

  return (
    <main className={cn("grid w-full min-w-0 gap-6", PROMOTION_PAGE_CONTROLS)}>
      <div className="grid gap-4">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/admin/promotions" />}>{t("admin.adminPromotionFormContent.breadcrumbLink", "โปรโมชั่น & โค้ดส่วนลด")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{existing ? t("admin.adminPromotionFormContent.breadcrumbPage", "แก้ไข {code}", { code: existing.code }) : t("admin.adminPromotionFormContent.breadcrumbPage2", "สร้างโค้ด Pegasus")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">{existing ? t("admin.adminPromotionFormContent.h1", "แก้ไขโค้ด Pegasus") : t("admin.adminPromotionFormContent.breadcrumbPage2", "สร้างโค้ด Pegasus")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.adminPromotionFormContent.p", "Pegasus เป็นผู้ออกเงินส่วนลด — ร้านค้ายังได้รับเงินเต็มจำนวน")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="px-2.5" onClick={() => navigate("/admin/promotions")}>
              {t("admin.adminPromotionFormContent.button2", "ยกเลิก")}
            </Button>
            <Button size="sm" className="px-2.5" onClick={requestSave}>
              {existing ? t("admin.adminPromotionFormContent.button3", "บันทึก") : t("admin.adminPromotionFormContent.button4", "บันทึกและเปิดใช้")}
            </Button>
          </div>
        </header>
      </div>

      {locks.used || locks.claimed ? (
        <Alert className="border-[#cfe0f7] bg-[#e8f1fc] text-[#0058bc]">
          <Info />
          <AlertDescription className="text-xs text-[#0058bc]">
            {locks.used ? (
              <>
                {t("admin.adminPromotionFormContent.fragment", "โค้ดนี้มีคนใช้แล้ว")} {existing?.usedCount.toLocaleString(intlLocale())} {t("admin.adminPromotionFormContent.fragment2", "ครั้ง — ฟิลด์ที่มี")}{" "}
                <Lock className="inline size-3" aria-label={t("admin.adminPromotionFormContent.ariaLabel", "แม่กุญแจ")} /> {t("admin.adminPromotionFormContent.fragment3", "แก้ไม่ได้")}
              </>
            ) : (
              <>
                {t("admin.adminPromotionFormContent.fragment4", "มีผู้เก็บโค้ดนี้แล้ว")} {existing?.claimedCount.toLocaleString(intlLocale())} {t("admin.adminPromotionFormContent.fragment5", "คน — “ต้องเก็บก่อนใช้” ล็อก และจำนวนที่แจกเพิ่มได้อย่างเดียว")}
              </>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-4">
          <AdminPromotionFormSections
            form={form}
            homeSortValue={formValues.homeSort}
            errors={errors}
            locks={locks}
            existing={existing}
            scopeOptions={scopeOptions}
            onChange={change}
          />
        </div>
        <PromotionFormAside form={payload} />
      </div>

      <PromotionSaveDialog
        open={confirming}
        onOpenChange={setConfirming}
        existing={existing}
        input={payload}
        scopeNames={scopeNames}
        pending={save.isPending}
        onConfirm={submit}
      />
      <PromotionDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => !open && blocker.reset?.()}
        tone="warning"
        icon={<LogOut />}
        title={t("admin.adminPromotionFormContent.title7", "ออกจากหน้านี้?")}
        description={t("admin.adminPromotionFormContent.description", "การเปลี่ยนแปลงในฟอร์มยังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายทั้งหมด")}
        actions={
          <>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              {t("admin.adminPromotionFormContent.button5", "อยู่ต่อ")}
            </Button>
            <Button className={PROMOTION_DANGER_BUTTON} onClick={() => blocker.proceed?.()}>
              {t("admin.adminPromotionFormContent.button6", "ออกโดยไม่บันทึก")}
            </Button>
          </>
        }
      />
    </main>
  );
}
