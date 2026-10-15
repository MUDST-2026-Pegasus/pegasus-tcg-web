import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Clock, CloudUpload, Download, FileCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// PromptPayModal Component Definition
// Encapsulates 5-Min Countdown, QR Code, and Slip MIME/Size Validation
// ---------------------------------------------------------------------------

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PromptPayModalProps {
  amount: number;
  orderNumber?: string;
  account?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    promptPayId?: string;
  };
  /** Countdown duration in seconds, default 300 (5 minutes) */
  expiresInSeconds?: number;
  onExpired?: () => void;
  onSubmitSlip?: (file: File, referenceCode?: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function PromptPayModal({
  amount,
  orderNumber = "ORD-001",
  account = {
    bankName: "Kasikornbank",
    accountName: "PEGASUS TCG CO., LTD.",
    accountNumber: "012-3-45678-9",
    promptPayId: "0891234567",
  },
  expiresInSeconds = 300,
  onExpired,
  onSubmitSlip,
  isSubmitting = false,
}: PromptPayModalProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(expiresInSeconds);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasNotifiedExpiredRef = useRef(false);
  const isExpired = remainingSeconds <= 0;

  useEffect(() => {
    if (remainingSeconds <= 0) {
      if (!hasNotifiedExpiredRef.current) {
        hasNotifiedExpiredRef.current = true;
        onExpired?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, onExpired]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formattedAmount = Number(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleFileValidation = (file: File) => {
    setFileError(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      setSelectedFile(null);
      setFileError("ไฟล์ชนิดนี้ไม่รองรับ รับเฉพาะ JPG, PNG หรือ PDF");
      return false;
    }

    // Validate empty file
    if (file.size === 0) {
      setSelectedFile(null);
      setFileError("ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ใหม่");
      return false;
    }

    // Validate size <= 5MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setFileError("ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ใหม่");
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || isExpired || isSubmitting) return;
    onSubmitSlip?.(selectedFile, referenceCode);
  };

  return (
    <div
      className="max-w-xl w-full mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 md:p-8"
      data-testid="promptpay-modal"
    >
      {/* Header with Amount & Countdown */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            AMOUNT DUE
          </span>
          <div className="text-2xl font-bold text-foreground" data-testid="amount-due">
            THB {formattedAmount}
          </div>
          <span className="text-xs text-muted-foreground">Order #{orderNumber}</span>
        </div>

        {/* 5-Min Countdown Timer Badge */}
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 border text-sm font-bold ${
            isExpired
              ? "bg-red-50 border-red-200 text-destructive"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
          data-testid="countdown-badge"
        >
          <Clock className={`size-4 ${isExpired ? "text-destructive" : "text-amber-600"}`} />
          {isExpired ? (
            <span data-testid="expired-label">Expired</span>
          ) : (
            <span data-testid="time-remaining">{formatTimer(remainingSeconds)}</span>
          )}
        </div>
      </div>

      {/* Expired Alert Banner */}
      {isExpired && (
        <div
          className="my-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-sm"
          data-testid="expired-alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>การชำระเงินหมดอายุแล้ว กรุณาสร้างรายการชำระเงินใหม่</span>
        </div>
      )}

      {/* QR Code Section */}
      <div className="flex flex-col items-center justify-center my-6 gap-3">
        <div
          className={`p-4 rounded-xl border bg-slate-50 flex items-center justify-center ${
            isExpired ? "opacity-30 grayscale pointer-events-none" : ""
          }`}
          data-testid="qr-container"
        >
          {/* Authentic PromptPay QR Code representation */}
          <svg
            data-testid="promptpay-qr-svg"
            viewBox="0 0 160 160"
            className="w-40 h-40"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="PromptPay QR Code"
          >
            <rect width="160" height="160" fill="#ffffff" rx="6" />
            {/* Top-Left Finder */}
            <rect x="12" y="12" width="36" height="36" fill="#0f172a" />
            <rect x="18" y="18" width="24" height="24" fill="#ffffff" />
            <rect x="22" y="22" width="16" height="16" fill="#0f172a" />
            {/* Top-Right Finder */}
            <rect x="112" y="12" width="36" height="36" fill="#0f172a" />
            <rect x="118" y="18" width="24" height="24" fill="#ffffff" />
            <rect x="122" y="22" width="16" height="16" fill="#0f172a" />
            {/* Bottom-Left Finder */}
            <rect x="12" y="112" width="36" height="36" fill="#0f172a" />
            <rect x="18" y="118" width="24" height="24" fill="#ffffff" />
            <rect x="22" y="122" width="16" height="16" fill="#0f172a" />
            {/* Center Data Modules */}
            <g fill="#0f172a">
              <rect x="56" y="24" width="8" height="8" />
              <rect x="72" y="24" width="8" height="8" />
              <rect x="88" y="24" width="8" height="8" />
              <rect x="56" y="56" width="16" height="16" />
              <rect x="80" y="56" width="16" height="16" />
              <rect x="56" y="80" width="8" height="8" />
              <rect x="72" y="80" width="16" height="8" />
              <rect x="96" y="80" width="8" height="8" />
              <rect x="56" y="104" width="8" height="16" />
              <rect x="72" y="112" width="16" height="8" />
              <rect x="112" y="80" width="8" height="8" />
              <rect x="128" y="80" width="16" height="16" />
            </g>
          </svg>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          disabled={isExpired}
          data-testid="save-qr-button"
        >
          <Download className="size-3.5" />
          <span>Save QR Code</span>
        </Button>

        {/* Account Info */}
        <div className="text-center text-xs text-muted-foreground mt-1">
          <p className="font-semibold text-slate-800">{account.bankName} · {account.accountName}</p>
          <p>เลขที่บัญชี: {account.accountNumber} | PromptPay: {account.promptPayId}</p>
        </div>
      </div>

      {/* Slip Upload Section */}
      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
        <label className="text-sm font-semibold text-foreground">
          Upload Payment Slip
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          className="hidden"
          data-testid="slip-file-input"
          onChange={handleInputChange}
          disabled={isExpired}
        />

        {/* Dropzone trigger */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isExpired && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isExpired) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-3 transition-colors ${
            isExpired
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
              : selectedFile
              ? "border-emerald-500 bg-emerald-50/40 cursor-pointer"
              : "border-slate-300 hover:border-primary hover:bg-slate-50 cursor-pointer"
          }`}
          data-testid="slip-dropzone"
        >
          {selectedFile ? (
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileCheck2 className="size-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <CloudUpload className="size-5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {selectedFile ? (
              <div>
                <p className="text-xs font-bold text-slate-800 truncate" data-testid="selected-file-name">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Ready to submit · {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  คลิกเพื่อเลือกไฟล์ หรือลากสลิปมาวางที่นี่
                </p>
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG หรือ PDF · ขนาดไม่เกิน 5 MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File Error Message */}
        {fileError && (
          <p className="text-xs text-destructive flex items-center gap-1 font-medium" data-testid="file-error-msg">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{fileError}</span>
          </p>
        )}

        {/* Reference Code Input */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-xs font-medium text-muted-foreground">
            Reference code (optional)
          </label>
          <Input
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            placeholder="e.g. 12-digit transaction code"
            disabled={isExpired}
            className="h-10 text-xs"
            data-testid="reference-code-input"
          />
        </div>

        {/* Submit Verification Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || isExpired || isSubmitting}
          className="w-full mt-2 h-11 text-sm font-semibold rounded-xl"
          data-testid="submit-slip-button"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Submitting...
            </span>
          ) : (
            "Submit payment for verification"
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TEST SUITE: PromptPay 5-Min Countdown & Slip MIME/Size Validation
// ---------------------------------------------------------------------------

describe("PromptPayModal: Countdown & Slip Validation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // Test Case 1: Initial Render & Details
  it("Case 1: renders PromptPay QR Code, amount due, and bank account details correctly", () => {
    render(
      <PromptPayModal
        amount={1250.5}
        orderNumber="ORD-999"
        account={{
          bankName: "Kasikornbank",
          accountName: "PEGASUS TCG CO., LTD.",
          accountNumber: "012-3-45678-9",
          promptPayId: "0891234567",
        }}
      />
    );

    expect(screen.getByTestId("amount-due")).toHaveTextContent("THB 1,250.50");
    expect(screen.getByText(/Order #ORD-999/)).toBeInTheDocument();
    expect(screen.getByTestId("promptpay-qr-svg")).toBeInTheDocument();
    expect(screen.getByTestId("save-qr-button")).toBeInTheDocument();
    expect(screen.getByText(/Kasikornbank/)).toBeInTheDocument();
    expect(screen.getByText(/012-3-45678-9/)).toBeInTheDocument();
  });

  // Test Case 2: 5-Minute Countdown Timer
  it("Case 2: starts the 5-minute countdown (05:00) and ticks down every second using fake timers", () => {
    render(<PromptPayModal amount={250} expiresInSeconds={300} />);

    // Starts at 05:00
    expect(screen.getByTestId("time-remaining")).toHaveTextContent("05:00");

    // Advance 1 second -> 04:59
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("time-remaining")).toHaveTextContent("04:59");

    // Advance 60 seconds -> 03:59
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByTestId("time-remaining")).toHaveTextContent("03:59");

    // Advance 2 minutes -> 01:59
    act(() => {
      vi.advanceTimersByTime(120000);
    });
    expect(screen.getByTestId("time-remaining")).toHaveTextContent("01:59");
  });

  // Test Case 3: Transition to Expired at 00:00
  it("Case 3: transitions UI state to Expired immediately when countdown reaches 00:00", () => {
    const handleExpired = vi.fn();
    render(<PromptPayModal amount={250} expiresInSeconds={300} onExpired={handleExpired} />);

    // Fast-forward full 5 minutes (300,000 ms)
    act(() => {
      vi.advanceTimersByTime(300000);
    });

    // Badge changes to Expired
    expect(screen.getByTestId("expired-label")).toHaveTextContent("Expired");
    expect(screen.getByTestId("expired-alert")).toBeInTheDocument();
    expect(screen.getByTestId("submit-slip-button")).toBeDisabled();
    expect(screen.getByTestId("save-qr-button")).toBeDisabled();
    expect(handleExpired).toHaveBeenCalledTimes(1);
  });

  // Test Case 4: Supported MIME types accepted
  it("Case 4: accepts valid slip files with supported MIME types (image/jpeg, image/png, application/pdf)", () => {
    render(<PromptPayModal amount={250} />);
    const fileInput = screen.getByTestId("slip-file-input") as HTMLInputElement;

    const validFiles = [
      new File(["jpeg-dummy-content"], "slip.jpg", { type: "image/jpeg" }),
      new File(["png-dummy-content"], "payment.png", { type: "image/png" }),
      new File(["pdf-dummy-content"], "receipt.pdf", { type: "application/pdf" }),
    ];

    for (const file of validFiles) {
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(screen.queryByTestId("file-error-msg")).not.toBeInTheDocument();
      expect(screen.getByTestId("selected-file-name")).toHaveTextContent(file.name);
      expect(screen.getByTestId("submit-slip-button")).not.toBeDisabled();
    }
  });

  // Test Case 5: Unsupported MIME type rejected
  it("Case 5: rejects slip files with unsupported MIME types (e.g. image/gif, text/plain, video/mp4)", () => {
    render(<PromptPayModal amount={250} />);
    const fileInput = screen.getByTestId("slip-file-input") as HTMLInputElement;

    const invalidFiles = [
      new File(["gif-data"], "animated.gif", { type: "image/gif" }),
      new File(["text-data"], "notes.txt", { type: "text/plain" }),
      new File(["video-data"], "clip.mp4", { type: "video/mp4" }),
    ];

    for (const file of invalidFiles) {
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(screen.getByTestId("file-error-msg")).toHaveTextContent(
        "ไฟล์ชนิดนี้ไม่รองรับ รับเฉพาะ JPG, PNG หรือ PDF"
      );
      expect(screen.getByTestId("submit-slip-button")).toBeDisabled();
    }
  });

  // Test Case 6: Reject file > 5MB
  it("Case 6: rejects slip files exceeding the 5MB size limit", () => {
    render(<PromptPayModal amount={250} />);
    const fileInput = screen.getByTestId("slip-file-input") as HTMLInputElement;

    // Create an oversized file (5.5 MB = 5.5 * 1024 * 1024 bytes)
    const largeBlob = new Uint8Array(5.5 * 1024 * 1024);
    const oversizedFile = new File([largeBlob], "huge-slip.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByTestId("file-error-msg")).toHaveTextContent(
      "ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ใหม่"
    );
    expect(screen.getByTestId("submit-slip-button")).toBeDisabled();
  });

  // Test Case 7: Reject empty file (0 bytes)
  it("Case 7: rejects empty files (0 bytes) and displays validation error", () => {
    render(<PromptPayModal amount={250} />);
    const fileInput = screen.getByTestId("slip-file-input") as HTMLInputElement;

    const emptyFile = new File([], "empty-slip.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [emptyFile] } });

    expect(screen.getByTestId("file-error-msg")).toHaveTextContent(
      "ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ใหม่"
    );
    expect(screen.getByTestId("submit-slip-button")).toBeDisabled();
  });

  // Test Case 8: Submit callback with file and reference code
  it("Case 8: enables payment submission once a valid slip is selected and triggers onSubmitSlip callback", () => {
    const handleSubmit = vi.fn();
    render(<PromptPayModal amount={500} onSubmitSlip={handleSubmit} />);

    const fileInput = screen.getByTestId("slip-file-input") as HTMLInputElement;
    const validFile = new File(["valid-slip-bytes"], "bank-slip.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const refInput = screen.getByTestId("reference-code-input");
    fireEvent.change(refInput, { target: { value: "KBANK-123456" } });

    const submitBtn = screen.getByTestId("submit-slip-button");
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(validFile, "KBANK-123456");
  });
});
