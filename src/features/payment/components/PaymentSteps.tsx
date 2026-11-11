import { useRef, useState } from "react";
import {
  CloudUpload,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FileUploadState } from "@/hooks/use-file-upload";
import { intlLocale, useTranslate } from "@/lib/i18n";

interface PaymentStepsProps {
  amount?: number;
  slip: FileUploadState;
  referenceCode: string;
  onReferenceCodeChange: (value: string) => void;
  disabled?: boolean;
}

export function PaymentSteps({
  amount,
  slip,
  referenceCode,
  onReferenceCodeChange,
  disabled = false,
}: PaymentStepsProps) {
  const { t } = useTranslate("buyer");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const formattedAmount =
    amount !== undefined
      ? Number(amount).toLocaleString(intlLocale(), {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "13,200.00";

  const uploadedItem = slip.items[0];
  const hasUploadedSlip = Boolean(slip.objectKeys.length > 0 && uploadedItem?.status === "done");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      slip.addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hidden native file input for accessibility and file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={slip.accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (disabled) return;
          if (e.target.files?.length) {
            slip.addFiles(e.target.files);
          }
        }}
      />

      {/* Step 1: Scan & Pay */}
      <div className="flex gap-3.5">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
            1
          </div>
          <div className="w-px bg-slate-200 flex-1 my-1.5" />
        </div>
        <div className="pb-4">
          <h3 className="font-semibold text-sm text-foreground">{t("payment.steps.scanTitle", "สแกนและชำระเงิน")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t("payment.steps.scanHint", "ชำระ {amount} บาทให้ตรงทุกสตางค์ แล้วบันทึกสลิปจากแอปธนาคาร", { amount: formattedAmount })}
          </p>
        </div>
      </div>

      {/* Step 2: Upload your slip */}
      <div className="flex gap-3.5">
        <div className="flex flex-col items-center">
          <div
            className={`w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0 ${
              hasUploadedSlip
                ? "bg-primary border-primary text-white"
                : "border-slate-300 text-muted-foreground"
            }`}
          >
            2
          </div>
          <div className="w-px bg-slate-200 flex-1 my-1.5" />
        </div>
        <div className="flex-1 pb-4">
          <h3 className="font-semibold text-sm text-foreground">{t("payment.steps.uploadTitle", "อัปโหลดสลิป")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("payment.steps.uploadHint", "เราใช้สลิปเพื่อตรวจสอบการโอนเงิน")}
          </p>

          {/* Dropzone Container */}
          {!uploadedItem ? (
            <div
              role="button"
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                if (!disabled) fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                if (disabled) return;
                handleDragOver(e);
              }}
              onDragLeave={(e) => {
                if (disabled) return;
                handleDragLeave(e);
              }}
              onDrop={(e) => {
                if (disabled) return;
                handleDrop(e);
              }}
              className={`mt-2.5 border-2 border-dashed rounded-xl p-4 flex items-center gap-3.5 transition-colors ${
                disabled
                  ? "border-slate-200 bg-slate-50/80 cursor-not-allowed opacity-60"
                  : isDragOver
                  ? "border-primary bg-sky-50/50 cursor-pointer"
                  : "border-slate-200 bg-card hover:bg-slate-50/60 cursor-pointer"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  disabled ? "bg-secondary text-slate-400" : "bg-sky-50 text-primary"
                }`}
              >
                <CloudUpload className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs">
                  {disabled ? (
                    <span className="text-slate-500 font-medium">{t("payment.steps.submitted", "ส่งการชำระเงินแล้ว")}</span>
                  ) : (
                    <>
                      <span className="text-primary font-semibold hover:underline">
                        {t("payment.steps.clickUpload", "คลิกเพื่ออัปโหลด")}
                      </span>{" "}
                      <span className="text-slate-500 font-normal">{t("payment.steps.dragDrop", "หรือลากไฟล์มาวาง")}</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("payment.steps.fileRule", "JPG, PNG หรือ PDF · ไม่เกิน 5 MB")}
                </p>
              </div>
            </div>
          ) : (
            /* Selected / Uploaded File Display */
            <div className="mt-2.5 rounded-xl border border-slate-200 bg-card p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                {uploadedItem.previewUrl ? (
                  <img
                    src={uploadedItem.previewUrl}
                    alt={t("payment.steps.preview", "ตัวอย่างสลิป")}
                    className="w-10 h-10 rounded-lg object-cover border border-muted shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-slate-500">
                    <FileText className="size-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate max-w-[180px] md:max-w-[220px]">
                    {uploadedItem.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {(uploadedItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    {uploadedItem.status === "uploading" && (
                      <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                        <Loader2 className="size-3 animate-spin" /> {t("payment.steps.uploading", "กำลังอัปโหลด...")}
                      </span>
                    )}
                    {uploadedItem.status === "done" && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <FileCheck2 className="size-3" /> {t("payment.steps.ready", "พร้อม")}
                      </span>
                    )}
                    {uploadedItem.status === "error" && (
                      <span className="text-[11px] text-destructive font-medium">
                        {t("payment.steps.failed", "ไม่สำเร็จ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!disabled && (
                <div className="flex items-center gap-1 shrink-0">
                  {uploadedItem.canRetry && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-500 hover:text-slate-800"
                      onClick={() => slip.retry(uploadedItem.id)}
                      title={t("payment.steps.retry", "อัปโหลดอีกครั้ง")}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-slate-400 hover:text-destructive"
                    onClick={() => {
                      slip.remove(uploadedItem.id);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    title={t("payment.steps.remove", "ลบไฟล์")}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {uploadedItem?.error && (
            <p role="alert" className="text-xs text-destructive mt-1.5 font-medium">
              {uploadedItem.error}
            </p>
          )}
        </div>
      </div>

      {/* Step 3: Enter reference no. */}
      <div className="flex gap-3.5">
        <div className="flex flex-col items-center">
          <div
            className={`w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0 ${
              referenceCode.trim()
                ? "bg-primary border-primary text-white"
                : "border-slate-300 text-muted-foreground"
            }`}
          >
            3
          </div>
        </div>
        <div className="flex-1 pb-2">
          <h3 className="font-semibold text-sm text-foreground">{t("payment.steps.refTitle", "กรอกเลขอ้างอิง")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("payment.steps.refHint", "ดูได้จาก \"เลขที่อ้างอิง\" บนสลิป")}
          </p>

          <Input
            aria-label={t("payment.steps.refAria", "เลขอ้างอิงการโอน")}
            placeholder={t("payment.steps.refPlaceholder", "e.g. 2026101400051234")}
            value={referenceCode}
            disabled={disabled}
            onChange={(e) => onReferenceCodeChange(e.target.value)}
            className="mt-2 text-sm rounded-lg border-slate-200 bg-card placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
