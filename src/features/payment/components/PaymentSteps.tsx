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

interface PaymentStepsProps {
  amount?: number;
  slip: FileUploadState;
  referenceCode: string;
  onReferenceCodeChange: (value: string) => void;
}

export function PaymentSteps({
  amount,
  slip,
  referenceCode,
  onReferenceCodeChange,
}: PaymentStepsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const formattedAmount =
    amount !== undefined
      ? Number(amount).toLocaleString("th-TH", {
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
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            slip.addFiles(e.target.files);
          }
        }}
      />

      {/* Step 1: Scan & Pay */}
      <div className="flex gap-3.5">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            1
          </div>
          <div className="w-px bg-slate-200 flex-1 my-1.5" />
        </div>
        <div className="pb-4">
          <h3 className="font-semibold text-sm text-foreground">Scan &amp; pay</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Pay exactly THB {formattedAmount}, then save the slip from your banking app.
          </p>
        </div>
      </div>

      {/* Step 2: Upload your slip */}
      <div className="flex gap-3.5">
        <div className="flex flex-col items-center">
          <div
            className={`w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0 ${
              hasUploadedSlip
                ? "bg-sky-700 border-sky-700 text-white"
                : "border-slate-300 text-muted-foreground"
            }`}
          >
            2
          </div>
          <div className="w-px bg-slate-200 flex-1 my-1.5" />
        </div>
        <div className="flex-1 pb-4">
          <h3 className="font-semibold text-sm text-foreground">Upload your slip</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            We use it to verify your transfer.
          </p>

          {/* Dropzone Container */}
          {!uploadedItem ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-2.5 border-2 border-dashed rounded-xl p-4 flex items-center gap-3.5 transition-colors cursor-pointer ${
                isDragOver
                  ? "border-sky-700 bg-sky-50/50"
                  : "border-slate-200 bg-white hover:bg-slate-50/60"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <CloudUpload className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs">
                  <span className="text-sky-700 font-semibold hover:underline">
                    Click to upload
                  </span>{" "}
                  <span className="text-slate-500 font-normal">or drag &amp; drop</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  JPG, PNG or PDF · up to 5 MB
                </p>
              </div>
            </div>
          ) : (
            /* Selected / Uploaded File Display */
            <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                {uploadedItem.previewUrl ? (
                  <img
                    src={uploadedItem.previewUrl}
                    alt="Slip preview"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
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
                      <span className="text-[11px] text-sky-700 flex items-center gap-1 font-medium">
                        <Loader2 className="size-3 animate-spin" /> Uploading...
                      </span>
                    )}
                    {uploadedItem.status === "done" && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                        <FileCheck2 className="size-3" /> Ready
                      </span>
                    )}
                    {uploadedItem.status === "error" && (
                      <span className="text-[11px] text-destructive font-medium">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {uploadedItem.canRetry && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-slate-500 hover:text-slate-800"
                    onClick={() => slip.retry(uploadedItem.id)}
                    title="Retry upload"
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
                  title="Remove file"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
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
                ? "bg-sky-700 border-sky-700 text-white"
                : "border-slate-300 text-muted-foreground"
            }`}
          >
            3
          </div>
        </div>
        <div className="flex-1 pb-2">
          <h3 className="font-semibold text-sm text-foreground">Enter reference no.</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Find it on your slip as &quot;Ref. No.&quot;
          </p>

          <Input
            aria-label="เลขอ้างอิงการโอน"
            placeholder="e.g. 2026101400051234"
            value={referenceCode}
            onChange={(e) => onReferenceCodeChange(e.target.value)}
            className="mt-2 text-sm rounded-lg border-slate-200 bg-white placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
