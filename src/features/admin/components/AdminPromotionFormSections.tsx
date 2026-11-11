import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChoiceCard,
  FormField,
  LockedSuffix,
  ToggleRow,
} from "@/features/promotions/shared/PromotionFormControls";
import { PromotionDateField, PromotionNumberField } from "@/features/promotions/shared/PromotionFormFields";
import { toLocalInput } from "@/features/promotions/shared/promotionForm.dates";

import { HOME_STRIP_MAX } from "../promotions.format";
import type { PromotionFormErrors, PromotionLocks } from "../promotions.schema";
import type { AdminPromotion, AdminPromotionInput } from "../promotions.types";
import { intlLocale, translate, useTranslate } from "@/lib/i18n";

// @tolgee-key {"key":"admin.adminPromotionFormSections.label","ns":"promotions","defaultValue":"ทุกเกม"}
// @tolgee-key {"key":"admin.adminPromotionFormSections.label2","ns":"promotions","defaultValue":"เลือกเกม"}
// @tolgee-key {"key":"admin.adminPromotionFormSections.label3","ns":"promotions","defaultValue":"เลือกหมวดหมู่"}

const SCOPE_OPTIONS: Array<{ value: AdminPromotionInput["scopeType"]; label: string }> = [
  { value: "ALL", get label() { return translate("promotions", "admin.adminPromotionFormSections.label", "ทุกเกม"); } },
  { value: "GAME", get label() { return translate("promotions", "admin.adminPromotionFormSections.label2", "เลือกเกม"); } },
  { value: "CATEGORY", get label() { return translate("promotions", "admin.adminPromotionFormSections.label3", "เลือกหมวดหมู่"); } },
];

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** รหัส 8 ตัว ไม่มี 0/O 1/I ที่อ่านสลับกันง่าย */
function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
}

type ScopeOptions = {
  data?: Array<{ id: number; name: string }>;
  isPending: boolean;
  isError: boolean;
};

/** การ์ด 1–5 ของฟอร์มโค้ด Pegasus (Figma PRM-A2) */
export function AdminPromotionFormSections({
  form,
  homeSortValue,
  errors,
  locks,
  existing,
  scopeOptions,
  onChange: change,
}: {
  form: AdminPromotionInput;
  /** ลำดับที่แสดง — โค้ดใหม่ที่ยังไม่เลือกจะเป็นลำดับถัดไปของแถบหน้าแรก */
  homeSortValue: number | null;
  errors: PromotionFormErrors;
  locks: PromotionLocks;
  existing?: AdminPromotion;
  scopeOptions: ScopeOptions;
  onChange: <K extends keyof AdminPromotionInput>(key: K, value: AdminPromotionInput[K]) => void;
}) {
  const { t } = useTranslate("promotions");
  const locked = locks.isLocked;
  const usedLimitFloor = Math.max(existing?.usedCount ?? 0, existing?.usageLimitTotal ?? 0);

  return (
    <>
      <Section title={t("admin.adminPromotionFormSections.title", "1. ข้อมูลโค้ด")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            field="code"
            htmlFor="promotion-code"
            label={t("admin.adminPromotionFormSections.label4", "รหัสโค้ด")}
            required
            hint={t("admin.adminPromotionFormSections.hint", "A–Z และ 0–9 ยาว 4–20 ตัว · ระบบเก็บเป็นตัวพิมพ์ใหญ่ และห้ามซ้ำกับโค้ดร้าน")}
            error={errors.code}
          >
            <InputGroup data-disabled={locked("code") || undefined}>
              <InputGroupInput
                id="promotion-code"
                aria-label={t("admin.adminPromotionFormSections.label4", "รหัสโค้ด")}
                aria-invalid={!!errors.code || undefined}
                value={form.code}
                maxLength={20}
                autoComplete="off"
                disabled={locked("code")}
                placeholder="PEGASUS10"
                className="font-semibold tracking-[0.04em] placeholder:font-normal placeholder:tracking-normal"
                onChange={(event) => change("code", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              />
              {locked("code") ? (
                <LockedSuffix locked />
              ) : (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="xs"
                    variant="secondary"
                    className="h-auto rounded-[4px]! bg-muted px-2 py-0.5 text-xs text-[#414755]"
                    onClick={() => change("code", randomCode())}
                  >
                    {t("admin.adminPromotionFormSections.inputGroupButton", "สุ่มโค้ด")}
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </FormField>
          <FormField
            field="name"
            htmlFor="promotion-name"
            label={t("admin.adminPromotionFormSections.label5", "ชื่อแคมเปญ (แสดงให้ผู้ซื้อเห็น)")}
            required
            hint={t("admin.adminPromotionFormSections.hint2", "สูงสุด 60 ตัวอักษร")}
            error={errors.name}
          >
            <Input
              id="promotion-name"
              aria-label={t("admin.adminPromotionFormSections.ariaLabel", "ชื่อแคมเปญ")}
              aria-invalid={!!errors.name || undefined}
              value={form.name}
              maxLength={60}
              placeholder={t("admin.adminPromotionFormSections.placeholder", "ลด 10% ต้อนรับปลายปี")}
              onChange={(event) => change("name", event.target.value)}
            />
          </FormField>
        </div>
        <FormField field="visibility" label={t("admin.adminPromotionFormSections.label6", "การมองเห็น")}>
          <RadioGroup
            aria-label={t("admin.adminPromotionFormSections.label6", "การมองเห็น")}
            value={form.visibility}
            onValueChange={(value) => change("visibility", value as AdminPromotionInput["visibility"])}
            className="grid gap-4 sm:grid-cols-2"
          >
            <ChoiceCard
              value="PUBLIC"
              title={t("admin.adminPromotionFormSections.title2", "สาธารณะ")}
              hint={t("admin.adminPromotionFormSections.hint3", "แสดงในตัวเลือกโค้ดตอนชำระเงิน")}
              disabled={locked("visibility")}
            />
            <ChoiceCard
              value="PRIVATE"
              title={t("admin.adminPromotionFormSections.title3", "ส่วนตัว")}
              hint={t("admin.adminPromotionFormSections.hint4", "ผู้ซื้อต้องพิมพ์โค้ดเอง (แจกผ่านโซเชียล)")}
              disabled={locked("visibility")}
            />
          </RadioGroup>
        </FormField>
        <details
          className="scroll-mt-24 text-xs text-muted-foreground"
          data-field="description"
          open={!!form.description || undefined}
        >
          <summary className="cursor-pointer">{t("admin.adminPromotionFormSections.summary", "คำอธิบายเพิ่มเติม (ไม่บังคับ)")}</summary>
          <Input
            aria-label={t("admin.adminPromotionFormSections.ariaLabel2", "คำอธิบาย")}
            className="mt-2"
            value={form.description ?? ""}
            maxLength={500}
            placeholder={t("admin.adminPromotionFormSections.placeholder2", "คำอธิบายภายในแคมเปญ")}
            onChange={(event) => change("description", event.target.value)}
          />
        </details>
      </Section>

      <Section title={t("admin.adminPromotionFormSections.title4", "2. ประเภทส่วนลด")}>
        <RadioGroup
          aria-label={t("admin.adminPromotionFormSections.ariaLabel3", "ประเภทส่วนลด")}
          data-field="discountType"
          value={form.discountType}
          onValueChange={(value) => change("discountType", value as AdminPromotionInput["discountType"])}
          className="grid gap-4 sm:grid-cols-3"
        >
          <ChoiceCard value="PERCENT" title={t("admin.adminPromotionFormSections.title5", "เปอร์เซ็นต์")} hint={t("admin.adminPromotionFormSections.hint5", "ลด x% ของยอดสินค้า")} disabled={locked("discountType")} />
          <ChoiceCard value="FIXED" title={t("admin.adminPromotionFormSections.title6", "จำนวนเงิน")} hint={t("admin.adminPromotionFormSections.hint6", "ลดเป็นบาท")} disabled={locked("discountType")} />
          <ChoiceCard value="FREE_SHIPPING" title={t("admin.adminPromotionFormSections.title7", "ส่งฟรี")} hint={t("admin.adminPromotionFormSections.hint7", "ลดค่าส่งทุกร้าน")} disabled={locked("discountType")} />
        </RadioGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          {form.discountType !== "FREE_SHIPPING" ? (
            <PromotionNumberField
              field="discountValue"
              label={t("admin.adminPromotionFormSections.label7", "มูลค่าส่วนลด")}
              required
              hint={form.discountType === "PERCENT" ? "1–90%" : t("admin.adminPromotionFormSections.hint8", "ต้องมากกว่า THB 0.00")}
              error={errors.discountValue}
              id="promotion-discountValue"
              ariaLabel={t("admin.adminPromotionFormSections.label7", "มูลค่าส่วนลด")}
              value={form.discountValue}
              onChange={(value) => change("discountValue", value as number)}
              suffix={form.discountType === "PERCENT" ? "%" : t("admin.adminPromotionFormSections.suffix", "บาท")}
              min={form.discountType === "PERCENT" ? 1 : 0}
              max={form.discountType === "PERCENT" ? 90 : undefined}
              locked={locked("discountValue")}
            />
          ) : null}
          {form.discountType !== "FIXED" ? (
            <PromotionNumberField
              field="maxDiscount"
              label={form.discountType === "FREE_SHIPPING" ? t("admin.adminPromotionFormSections.label8", "ลดค่าส่งสูงสุดต่อร้าน") : t("admin.adminPromotionFormSections.label9", "ส่วนลดสูงสุด")}
              hint={
                form.discountType === "FREE_SHIPPING"
                  ? t("admin.adminPromotionFormSections.hint9", "เว้นว่าง = ส่งฟรีเต็มจำนวน (งบประเมินจาก THB 60.00 / ร้าน)")
                  : t("admin.adminPromotionFormSections.hint10", "เว้นว่าง = ไม่จำกัด (แนะนำให้ใส่)")
              }
              error={errors.maxDiscount}
              id="promotion-maxDiscount"
              ariaLabel={t("admin.adminPromotionFormSections.label9", "ส่วนลดสูงสุด")}
              value={form.maxDiscount}
              onChange={(value) => change("maxDiscount", value)}
              prefix={t("admin.adminPromotionFormSections.prefix", "THB")}
              locked={locked("maxDiscount")}
            />
          ) : null}
        </div>
      </Section>

      <Section title={t("admin.adminPromotionFormSections.title8", "3. เงื่อนไข")} description={t("admin.adminPromotionFormSections.description", "ยอดขั้นต่ำคิดจากสินค้าที่เข้าเงื่อนไขหลังหักโค้ดร้าน ไม่รวมค่าส่ง")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionNumberField
            field="minSpend"
            label={t("admin.adminPromotionFormSections.label10", "ยอดสั่งซื้อขั้นต่ำ")}
            error={errors.minSpend}
            id="promotion-minSpend"
            ariaLabel={t("admin.adminPromotionFormSections.label10", "ยอดสั่งซื้อขั้นต่ำ")}
            value={form.minSpend}
            onChange={(value) => change("minSpend", value as number)}
            prefix={t("admin.adminPromotionFormSections.prefix", "THB")}
            locked={locked("minSpend")}
          />
          <FormField field="scopeType" label={t("admin.adminPromotionFormSections.label11", "ใช้กับสินค้า")}>
            <ToggleGroup
              aria-label={t("admin.adminPromotionFormSections.label11", "ใช้กับสินค้า")}
              size="sm"
              variant="outline"
              spacing={1.5}
              disabled={locked("scopeType")}
              value={[form.scopeType]}
              onValueChange={(next: string[]) => {
                const value = next[0] as AdminPromotionInput["scopeType"] | undefined;
                if (value) change("scopeType", value);
              }}
              className="flex-wrap"
            >
              {SCOPE_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="h-auto min-w-0 rounded-full px-2.5 py-[5px] text-xs text-[#414755] aria-pressed:border-primary aria-pressed:bg-[#f0f7fc] aria-pressed:text-[#0058bc]"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FormField>
        </div>
        {form.scopeType !== "ALL" ? (
          <FieldSet
            data-field="scopeIds"
            disabled={locked("scopeIds")}
            className="max-h-48 scroll-mt-24 gap-2 overflow-y-auto rounded-lg border p-3"
          >
            <FieldLegend variant="label" className="mb-1 text-xs text-muted-foreground">
              {form.scopeType === "GAME" ? t("admin.adminPromotionFormSections.label2", "เลือกเกม") : t("admin.adminPromotionFormSections.label3", "เลือกหมวดหมู่")} {t("admin.adminPromotionFormSections.fieldLegend", "(เลือกได้หลายรายการ)")}
            </FieldLegend>
            {scopeOptions.data?.map((item) => {
              const id = `promotion-scope-${item.id}`;
              return (
                <Field key={item.id} orientation="horizontal" className="gap-2">
                  <Checkbox
                    id={id}
                    checked={form.scopeIds.includes(item.id)}
                    onCheckedChange={(checked) =>
                      change(
                        "scopeIds",
                        checked === true
                          ? [...form.scopeIds, item.id]
                          : form.scopeIds.filter((scopeId) => scopeId !== item.id),
                      )
                    }
                  />
                  <FieldLabel htmlFor={id} className="text-xs font-normal">
                    {item.name}
                  </FieldLabel>
                </Field>
              );
            })}
            {scopeOptions.isPending ? (
              <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
                <Spinner className="size-3.5" />
                {t("admin.adminPromotionFormSections.span", "กำลังโหลดรายการ...")}
              </span>
            ) : null}
            {scopeOptions.isError ? (
              <FieldError className="text-[11px]">{t("admin.adminPromotionFormSections.fieldError", "โหลดรายการไม่สำเร็จ")}</FieldError>
            ) : null}
            {errors.scopeIds ? <FieldError className="text-[11px]">{errors.scopeIds}</FieldError> : null}
          </FieldSet>
        ) : null}
        <div data-field="newBuyerOnly" className="scroll-mt-24">
          <ToggleRow
            id="promotion-new-buyer"
            title={t("admin.adminPromotionFormSections.title9", "เฉพาะผู้ซื้อใหม่")}
            hint={t("admin.adminPromotionFormSections.hint11", "ใช้ได้เฉพาะบัญชีที่ยังไม่เคยมีคำสั่งซื้อที่ชำระเงินแล้ว")}
            checked={form.newBuyerOnly}
            disabled={locked("newBuyerOnly")}
            onChange={(checked) => change("newBuyerOnly", checked)}
          />
        </div>
      </Section>

      <Section title={t("admin.adminPromotionFormSections.title10", "4. ระยะเวลาและจำนวนสิทธิ์")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionDateField
            field="startsAt"
            id="promotion-startsAt"
            label={t("admin.adminPromotionFormSections.label12", "เริ่มใช้ได้")}
            ariaLabel={t("admin.adminPromotionFormSections.label12", "เริ่มใช้ได้")}
            required
            error={errors.startsAt}
            value={form.startsAt}
            locked={locked("startsAt")}
            onChange={(value) => change("startsAt", value)}
          />
          <PromotionDateField
            field="endsAt"
            id="promotion-endsAt"
            label={locks.used ? t("admin.adminPromotionFormSections.label13", "สิ้นสุด (ยืดได้เท่านั้น)") : t("admin.adminPromotionFormSections.label14", "สิ้นสุด")}
            ariaLabel={t("admin.adminPromotionFormSections.label14", "สิ้นสุด")}
            required
            hint={t("admin.adminPromotionFormSections.hint12", "ต้องหลังวันเริ่มใช้")}
            error={errors.endsAt}
            defaultTime="23:59"
            value={form.endsAt}
            min={locks.used && existing ? toLocalInput(existing.endsAt) : toLocalInput(form.startsAt)}
            onChange={(value) => change("endsAt", value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionNumberField
            field="usageLimitTotal"
            label={
              locks.used
                ? t("admin.adminPromotionFormSections.label15", "จำนวนสิทธิ์ทั้งหมด (เพิ่มได้เท่านั้น ≥ {value})", { value: usedLimitFloor.toLocaleString(intlLocale()) })
                : t("admin.adminPromotionFormSections.label16", "จำนวนสิทธิ์ทั้งหมด")
            }
            hint={t("admin.adminPromotionFormSections.hint13", "เว้นว่าง = ไม่จำกัด")}
            error={errors.usageLimitTotal}
            id="promotion-usageLimitTotal"
            ariaLabel={t("admin.adminPromotionFormSections.label16", "จำนวนสิทธิ์ทั้งหมด")}
            value={form.usageLimitTotal}
            onChange={(value) => change("usageLimitTotal", value)}
            suffix={t("admin.adminPromotionFormSections.suffix2", "สิทธิ์")}
            min={locks.used ? usedLimitFloor : 1}
          />
          <PromotionNumberField
            field="usageLimitPerUser"
            label={t("admin.adminPromotionFormSections.label17", "สิทธิ์ต่อผู้ซื้อ 1 คน")}
            required
            error={errors.usageLimitPerUser}
            id="promotion-usageLimitPerUser"
            ariaLabel={t("admin.adminPromotionFormSections.label17", "สิทธิ์ต่อผู้ซื้อ 1 คน")}
            value={form.usageLimitPerUser}
            onChange={(value) => change("usageLimitPerUser", value as number)}
            suffix={t("admin.adminPromotionFormSections.suffix3", "ครั้ง")}
            min={1}
            locked={locked("usageLimitPerUser")}
          />
        </div>
      </Section>

      <Section
        title={t("admin.adminPromotionFormSections.title11", "5. การแจกโค้ด (กดเก็บ)")}
        badge={<Badge className="h-4 rounded bg-[#e8f1fc] px-1.5 text-[9px] text-[#0058bc]">{t("admin.adminPromotionFormSections.badge", "ใหม่")}</Badge>}
      >
        <div data-field="claimable" className="scroll-mt-24">
          <ToggleRow
            id="promotion-claimable"
            title={t("admin.adminPromotionFormSections.title12", "ให้ผู้ซื้อกดเก็บได้")}
            hint={t("admin.adminPromotionFormSections.hint14", "โค้ดจะมีปุ่ม “เก็บ” และอยู่ในกระเป๋า “โค้ดของฉัน” (ต้องเป็นโค้ดสาธารณะ)")}
            checked={form.claimable}
            disabled={form.visibility !== "PUBLIC"}
            onChange={(checked) => change("claimable", checked)}
          />
        </div>
        <div data-field="featuredOnHome" className="grid scroll-mt-24 gap-1.5">
          <ToggleRow
            id="promotion-featured"
            title={t("admin.adminPromotionFormSections.title13", "แสดงบนหน้าแรก")}
            hint={t("admin.adminPromotionFormSections.hint15", "อยู่ในแถบ “โค้ดส่วนลดจาก Pegasus” ใต้ Hero · สูงสุด {HOME_STRIP_MAX} ใบ", { HOME_STRIP_MAX })}
            checked={form.featuredOnHome}
            disabled={!form.claimable || form.visibility !== "PUBLIC"}
            onChange={(checked) => change("featuredOnHome", checked)}
          />
          {errors.featuredOnHome ? <FieldError className="text-[11px]">{errors.featuredOnHome}</FieldError> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionNumberField
            field="claimLimit"
            label={locks.claimed ? t("admin.adminPromotionFormSections.label18", "จำนวนที่แจก (เพิ่มได้เท่านั้น)") : t("admin.adminPromotionFormSections.label19", "จำนวนที่แจก (เก็บได้)")}
            hint={t("admin.adminPromotionFormSections.hint16", "เว้นว่าง = ไม่จำกัด · แยกจากจำนวนสิทธิ์ใช้")}
            error={errors.claimLimit}
            id="promotion-claimLimit"
            ariaLabel={t("admin.adminPromotionFormSections.ariaLabel4", "จำนวนที่แจก")}
            value={form.claimLimit}
            onChange={(value) => change("claimLimit", value)}
            suffix={t("admin.adminPromotionFormSections.suffix4", "ใบ")}
            min={1}
            disabled={!form.claimable}
          />
          <FormField
            field="homeSort"
            htmlFor="promotion-homeSort"
            label={t("admin.adminPromotionFormSections.label20", "ลำดับบนหน้าแรก")}
            hint={t("admin.adminPromotionFormSections.hint17", "เลขน้อยแสดงก่อน")}
            error={errors.homeSort}
          >
            <Input
              id="promotion-homeSort"
              aria-label={t("admin.adminPromotionFormSections.label20", "ลำดับบนหน้าแรก")}
              type="number"
              min={1}
              max={HOME_STRIP_MAX}
              value={homeSortValue == null ? "" : homeSortValue + 1}
              disabled={!form.featuredOnHome}
              onChange={(event) =>
                change("homeSort", event.target.value === "" ? null : Number(event.target.value) - 1)
              }
            />
          </FormField>
        </div>
        <div data-field="claimRequired" className="grid scroll-mt-24 gap-1.5">
          <ToggleRow
            id="promotion-claim-required"
            title={t("admin.adminPromotionFormSections.title14", "ต้องเก็บก่อนใช้")}
            hint={t("admin.adminPromotionFormSections.hint18", "เปิด = พิมพ์โค้ดเองใช้ไม่ได้ถ้ายังไม่ได้เก็บ (PROMO_NOT_CLAIMED) เหมาะกับแคมเปญแจกจำนวนจำกัด")}
            checked={form.claimRequired}
            disabled={locked("claimRequired") || !form.claimable}
            onChange={(checked) => change("claimRequired", checked)}
          />
          {errors.claimRequired ? <FieldError className="text-[11px]">{errors.claimRequired}</FieldError> : null}
        </div>
      </Section>
    </>
  );
}

/** การ์ดหนึ่งหมวดของฟอร์ม (Figma PRM-A2 การ์ด 1–5) */
function Section({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-4 rounded-[12px] border border-border p-5 shadow-none ring-0">
      <CardHeader className="gap-0.5 px-0">
        <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
          {title}
          {badge}
        </CardTitle>
        {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-4 px-0">{children}</CardContent>
    </Card>
  );
}
