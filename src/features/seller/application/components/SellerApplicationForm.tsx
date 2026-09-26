import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useFileUpload } from "@/hooks/use-file-upload";
import { getErrorMessage, hasErrorCode } from "@/lib/api";
import { applyApiErrors } from "@/lib/form";

import { BANK_ITEMS, THAI_BANKS } from "../application.constants";
import { clearDraft, readDraft, saveDraft } from "../application.draft";
import { useSubmitVerification } from "../application.queries";
import {
  sellerApplicationSchema,
  type SellerApplicationFormValues,
} from "../application.schema";
import type { Verification } from "../application.types";
import { BankBookUpload } from "./BankBookUpload";
import { Callout } from "./Callout";
import { StepCard } from "./StepCard";

const LABEL_CLASS = "text-xs font-medium text-foreground/80";
const INPUT_CLASS = "h-8 rounded-md border-input bg-background px-2.5";

/** ใต้ช่องกรอกโชว์คำแนะนำ พอมี error ก็สลับเป็นข้อความ error ที่ตำแหน่งเดิม */
function FieldHint({
  error,
  children,
}: {
  error?: { message?: string };
  children: ReactNode;
}) {
  if (error) {
    return <FieldError errors={[error]} className="text-xs" />;
  }
  return (
    <FieldDescription className="text-[10px] text-muted-foreground/75">
      {children}
    </FieldDescription>
  );
}

type SellerApplicationFormProps = {
  /** แยกฉบับร่างของแต่ละบัญชีที่ใช้เครื่องเดียวกัน */
  userId?: number;
  /** คำขอครั้งก่อนที่ถูกปฏิเสธ ถ้ามี */
  rejection?: Verification;
};

export function SellerApplicationForm({
  userId,
  rejection,
}: SellerApplicationFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const submitVerification = useSubmitVerification();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [draft] = useState(() => (userId ? readDraft(userId) : {}));

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SellerApplicationFormValues>({
    resolver: zodResolver(sellerApplicationSchema),
    defaultValues: {
      legalFirstName: "",
      legalLastName: "",
      bankCode: "",
      bankAccountNumber: "",
      bankBookImageKey: "",
      ...draft,
    },
  });

  // เลือกรูปแล้วอัปทันที ฟอร์มเก็บแค่ object key ที่ได้กลับมา
  // ได้ key แล้วตรวจช่องใหม่ให้ error "กรุณาแนบรูป" หายเอง
  const bankBook = useFileUpload({
    purpose: "SELLER_VERIFICATION",
    onChange: ([objectKey]) =>
      setValue("bankBookImageKey", objectKey ?? "", {
        shouldValidate: Boolean(objectKey),
      }),
  });

  const [legalFirstName, legalLastName, bankCode] = useWatch({
    control,
    name: ["legalFirstName", "legalLastName", "bankCode"],
  });

  useEffect(() => {
    if (userId) {
      saveDraft(userId, { legalFirstName, legalLastName, bankCode });
    }
  }, [userId, legalFirstName, legalLastName, bankCode]);

  const handleBack = () => {
    // เปิดลิงก์ตรง ๆ จะไม่มีหน้าก่อนหน้าให้ย้อนกลับ
    if (location.key === "default") {
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormMessage(null);
    const bank = THAI_BANKS.find((item) => item.code === values.bankCode);

    try {
      await submitVerification.mutateAsync({
        legalFirstName: values.legalFirstName,
        legalLastName: values.legalLastName,
        bankCode: values.bankCode,
        bankName: bank?.name ?? values.bankCode,
        bankAccountNumber: values.bankAccountNumber,
        bankBookImageKey: values.bankBookImageKey,
      });
      if (userId) {
        clearDraft(userId);
      }
    } catch (error) {
      // 409 ไม่มี violations มาด้วย ต้องชี้ช่องเอง
      if (hasErrorCode(error, "BANK_ACCOUNT_ALREADY_USED")) {
        setError("bankAccountNumber", {
          type: "server",
          message: "เลขบัญชีนี้ถูกใช้สมัครกับผู้ขายรายอื่นแล้ว",
        });
        return;
      }
      // backend ตรวจไฟล์ที่ขึ้นไปจริงอีกรอบ — ไม่เจอ/ผิดชนิด/ใหญ่เกิน/ถูกใช้ไปแล้ว
      // key นี้ใช้ต่อไม่ได้ ต้องอัปรูปใหม่
      if (
        hasErrorCode(
          error,
          "FILE_NOT_FOUND",
          "FILE_TOO_LARGE",
          "UNSUPPORTED_FILE_TYPE",
        )
      ) {
        bankBook.clear();
        setError("bankBookImageKey", {
          type: "server",
          message: "รูปที่แนบใช้ไม่ได้ กรุณาอัปโหลดรูปใหม่อีกครั้ง",
        });
        return;
      }
      const attached = applyApiErrors(error, setError, {
        fieldMap: { bankName: "bankCode" },
      });
      if (!attached) {
        setFormMessage(
          getErrorMessage(error, "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"),
        );
      }
    }
  });

  return (
    <form className="flex flex-col gap-4.5" onSubmit={onSubmit} noValidate>
      {rejection && (
        <Alert variant="destructive" className="rounded-xl">
          <TriangleAlert />
          <AlertTitle>คำขอครั้งก่อนไม่ผ่านการตรวจสอบ</AlertTitle>
          <AlertDescription>
            {rejection.rejectionReason ??
              "กรุณาตรวจสอบข้อมูลแล้วส่งคำขออีกครั้ง"}
          </AlertDescription>
        </Alert>
      )}

      {formMessage && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{formMessage}</AlertDescription>
        </Alert>
      )}

      <StepCard
        step={1}
        title="ชื่อจริงของเจ้าของบัญชี"
        hint="ผู้ซื้อจะไม่เห็นข้อมูลส่วนนี้"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            data-invalid={Boolean(errors.legalFirstName) || undefined}
            className="gap-1.75"
          >
            <FieldLabel htmlFor="legalFirstName" className={LABEL_CLASS}>
              ชื่อจริง *
            </FieldLabel>
            <Input
              id="legalFirstName"
              autoComplete="given-name"
              placeholder="ณัฐพงศ์"
              aria-invalid={Boolean(errors.legalFirstName)}
              className={INPUT_CLASS}
              {...register("legalFirstName")}
            />
            <FieldHint error={errors.legalFirstName}>
              สะกดตามหน้าสมุดบัญชี ไม่ต้องใส่คำนำหน้า
            </FieldHint>
          </Field>
          <Field
            data-invalid={Boolean(errors.legalLastName) || undefined}
            className="gap-1.75"
          >
            <FieldLabel htmlFor="legalLastName" className={LABEL_CLASS}>
              นามสกุลจริง *
            </FieldLabel>
            <Input
              id="legalLastName"
              autoComplete="family-name"
              placeholder="พงษ์สุวรรณ"
              aria-invalid={Boolean(errors.legalLastName)}
              className={INPUT_CLASS}
              {...register("legalLastName")}
            />
            <FieldHint error={errors.legalLastName}>
              ต้องตรงกับชื่อบัญชีธนาคารด้านล่าง
            </FieldHint>
          </Field>
        </div>
      </StepCard>

      <StepCard
        step={2}
        title="บัญชีรับเงิน"
        hint="ใช้โอนยอดขายให้คุณ"
        className="gap-4.5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            data-invalid={Boolean(errors.bankCode) || undefined}
            className="gap-1.75"
          >
            <FieldLabel htmlFor="bankCode" className={LABEL_CLASS}>
              ธนาคาร *
            </FieldLabel>
            <Controller
              control={control}
              name="bankCode"
              render={({ field }) => (
                <Select
                  items={BANK_ITEMS}
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="bankCode"
                    size="sm"
                    aria-invalid={Boolean(errors.bankCode)}
                    onBlur={field.onBlur}
                    className="w-full rounded-md border-input bg-background pr-2 pl-2.5"
                  >
                    <SelectValue placeholder="เลือกธนาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {THAI_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldHint error={errors.bankCode}>
              รองรับธนาคารในประเทศไทยทุกแห่ง
            </FieldHint>
          </Field>
          <Field
            data-invalid={Boolean(errors.bankAccountNumber) || undefined}
            className="gap-1.75"
          >
            <FieldLabel htmlFor="bankAccountNumber" className={LABEL_CLASS}>
              เลขที่บัญชี *
            </FieldLabel>
            <Input
              id="bankAccountNumber"
              inputMode="numeric"
              autoComplete="off"
              placeholder="เช่น 123-4-56789-0"
              aria-invalid={Boolean(errors.bankAccountNumber)}
              className={INPUT_CLASS}
              {...register("bankAccountNumber")}
            />
            <FieldHint error={errors.bankAccountNumber}>
              ต้องเป็นบัญชีออมทรัพย์หรือกระแสรายวันของคุณเอง
            </FieldHint>
          </Field>
        </div>

        <BankBookUpload
          id="bankBookImageKey"
          upload={bankBook}
          error={errors.bankBookImageKey?.message}
        />

        <Callout tone="warning" icon={TriangleAlert}>
          ชื่อบัญชีธนาคารต้องตรงกับชื่อ-นามสกุลที่กรอกด้านบน มิฉะนั้นคำขอจะถูกปฏิเสธ
        </Callout>
      </StepCard>

      <Card className="gap-2 rounded-xl border border-border px-5 py-4.5 shadow-none ring-0">
        <Field
          orientation="horizontal"
          data-invalid={Boolean(errors.acceptTerms) || undefined}
          className="gap-2.75"
        >
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <Checkbox
                id="acceptTerms"
                name={field.name}
                checked={field.value ?? false}
                onCheckedChange={(checked) => field.onChange(checked)}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.acceptTerms)}
                className="rounded-[4px] border-input bg-background"
              />
            )}
          />
          <FieldLabel
            htmlFor="acceptTerms"
            className="text-[11px] font-normal text-foreground/80"
          >
            ข้าพเจ้ายืนยันว่าข้อมูลและเอกสารที่ส่งเป็นความจริง
            และยอมรับเงื่อนไขผู้ขายกับนโยบายความเป็นส่วนตัวของ PEGASUS
          </FieldLabel>
        </Field>
        <FieldError errors={[errors.acceptTerms]} className="pl-6.75 text-xs" />
      </Card>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="h-8.5 rounded-sm px-2.5"
        >
          ย้อนกลับ
        </Button>
        <p className="ml-auto text-[11px] text-muted-foreground/75">
          ระบบบันทึกฉบับร่างให้อัตโนมัติ
        </p>
        <Button
          type="submit"
          disabled={isSubmitting || bankBook.isUploading}
          className="rounded-md px-2.5"
        >
          {(isSubmitting || bankBook.isUploading) && <Spinner />}
          {isSubmitting
            ? "กำลังส่งคำขอ…"
            : bankBook.isUploading
              ? "กำลังอัปโหลดรูป…"
              : "ส่งคำขอสมัคร"}
        </Button>
      </div>

      <Callout tone="info" icon={Lock}>
        ข้อมูลบัญชีธนาคารถูกเข้ารหัสและเห็นได้เฉพาะทีมตรวจสอบ
        ผู้ซื้อจะเห็นเพียงชื่อร้านของคุณเท่านั้น
      </Callout>
    </form>
  );
}
