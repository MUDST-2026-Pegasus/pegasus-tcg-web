import { getLanguage, translate, useLanguage } from "@/lib/language";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPromptPayPayload } from "../promptpay";

interface PaymentQrCardProps {
  amount: number;
  orderNumber?: string;
  qrPayload?: string | null;
  account: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    promptPayId?: string;
    promptpayId?: string;
    qrPayload?: string;
  };
  isExpired?: boolean;
}

interface SaveQrOptions {
  amount: number;
  orderNumber?: string;
  account: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    promptPayId?: string;
    promptpayId?: string;
  };
}

/** Embed the logo before rasterizing so the PNG works outside this website. */
async function exportQrCardPng(
  svg: SVGSVGElement,
  options: SaveQrOptions,
): Promise<Blob> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const logo = copy.querySelector("image");
  if (logo) {
    const response = await fetch("/site-icon.jpg");
    if (!response.ok) throw new Error("QR logo could not be loaded");
    const logoData = await response.blob();
    const embeddedLogo = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("QR logo could not be read"));
      reader.readAsDataURL(logoData);
    });
    logo.setAttribute("href", embeddedLogo);
  }
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", "1024");
  copy.setAttribute("height", "1024");

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("QR image could not be loaded"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  });

  const canvas = document.createElement("canvas");
  const width = 600;
  const height = 760;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PNG export is unavailable");

  // Background
  if (typeof context.fillRect === "function") {
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
  }

  // PromptPay Header Banner
  if (typeof context.fillRect === "function") {
    context.fillStyle = "#003D6B"; // Official PromptPay deep blue
    context.fillRect(0, 0, width, 110);
  }

  if (typeof context.fillText === "function") {
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.font = "bold 28px 'Inter', system-ui, sans-serif";
    context.fillText("Thai QR Payment", width / 2, 50);

    context.font = "600 18px 'Inter', system-ui, sans-serif";
    context.fillStyle = "#E2E8F0";
    context.fillText("PromptPay", width / 2, 85);
  }

  // QR Code
  const qrSize = 360;
  const qrX = (width - qrSize) / 2;
  const qrY = 140;

  if (typeof context.strokeRect === "function") {
    context.strokeStyle = "#E2E8F0";
    context.lineWidth = 1;
    context.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
  }

  context.drawImage(image, qrX, qrY, qrSize, qrSize);

  // Order Reference (#PGS-...)
  const rawOrder = options.orderNumber?.trim();
  const refText = rawOrder
    ? rawOrder.startsWith("#")
      ? rawOrder
      : `#${rawOrder}`
    : "#PGS-PAYMENT";

  if (typeof context.fillText === "function") {
    context.textAlign = "center";
    context.fillStyle = "#64748B";
    context.font = "600 20px 'Inter', system-ui, sans-serif";
    context.fillText(translate(`เลขคำสั่งซื้อ: ${refText}`, `Order Ref: ${refText}`), width / 2, 545);

    // Amount
    const formattedAmount = Number(options.amount).toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    context.fillStyle = "#0F172A";
    context.font = "bold 34px 'Inter', system-ui, sans-serif";
    context.fillText(`THB ${formattedAmount}`, width / 2, 595);

    // Account Details
    if (options.account.accountName) {
      context.fillStyle = "#334155";
      context.font = "500 18px 'Inter', system-ui, sans-serif";
      context.fillText(options.account.accountName, width / 2, 640);
    }

    const promptpayId =
      options.account.promptpayId || options.account.promptPayId;
    if (promptpayId) {
      context.fillStyle = "#64748B";
      context.font = "16px 'Inter', system-ui, sans-serif";
      context.fillText(translate(`หมายเลขพร้อมเพย์: ${promptpayId}`, `PromptPay ID: ${promptpayId}`), width / 2, 672);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("PNG export failed")),
      "image/png",
    );
  });
}

export function PaymentQrCard({
  amount,
  orderNumber,
  qrPayload,
  account,
  isExpired = false,
}: PaymentQrCardProps) {
  useLanguage();
  const refSvg = useRef<SVGSVGElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const promptpayId = account.promptpayId || account.promptPayId;
  let payload: string | undefined = qrPayload || account.qrPayload;
  if (!payload && promptpayId) {
    try {
      payload = buildPromptPayPayload(promptpayId, amount);
    } catch {
      // Invalid merchant configuration must never produce a misleading payment QR.
    }
  }
  const amountText = `฿${amount.toLocaleString(getLanguage() === "th" ? "th-TH" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  async function handleSaveQr() {
    if (!refSvg.current || saving || isExpired) return;
    setSaving(true);
    setSaveError(false);
    try {
      const blob = await exportQrCardPng(refSvg.current, {
        amount,
        orderNumber,
        account,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pegasus-qr-${(orderNumber || "checkout").replace(/^#/, "")}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow the browser to start reading the download before releasing it.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {payload ? (
        <>
          <p className="text-xs text-muted-foreground font-medium mb-3 text-center">
            {translate("สแกนด้วยแอปธนาคารใดก็ได้", "Scan with any banking app")}</p>
          <div className="relative w-full max-w-[240px] bg-[#F8FAFC] border border-muted/90 rounded-2xl p-5 flex flex-col items-center justify-center shadow-xs overflow-hidden">
            <QRCodeSVG
              ref={refSvg}
              value={payload}
              size={176}
              level="H"
              marginSize={4}
              bgColor="#ffffff"
              fgColor="#0f172a"
              imageSettings={{
                src: "/site-icon.jpg",
                width: 32,
                height: 32,
                excavate: true,
              }}
              className="w-40 h-40 md:w-44 md:h-44"
              role="img"
              aria-label={translate("QR โค้ดพร้อมเพย์", "PromptPay QR Code")}
            />
            <span className="text-[11px] font-bold tracking-wider text-slate-800 mt-3 uppercase">
              {translate("ชำระเงินด้วย QR", "PAY VIA QR SCAN")}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {translate("สแกนเพื่อชำระเงิน |", "Scan to Pay |")}{amountText}
            </span>

            {isExpired && (
              <div
                role="alert"
                aria-label={translate("QR โค้ดหมดอายุ", "QR Code Expired")}
                className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2 shadow-xs">
                  <Clock className="size-6 text-destructive" />
                </div>
                <p className="text-sm font-bold text-destructive">
                  {translate("QR หมดอายุแล้ว", "QR code expired")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("กรุณาเริ่มการชำระเงินใหม่", "Start a new payment")}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          {translate("กรุณาโอนเงินผ่านบัญชีธนาคารด้านล่าง", "Please transfer to the bank account below")}</p>
      )}

      {payload ? (
        <div className="mt-4 text-center space-y-1">
          {account.accountName && (
            <p className="font-semibold text-sm text-foreground">
              {account.accountName}
            </p>
          )}
          {promptpayId && (
            <p className="text-xs text-muted-foreground">
              {translate("หมายเลขพร้อมเพย์", "PromptPay ID")}{promptpayId}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 text-center space-y-1">
          {account.accountName && (
            <p className="font-semibold text-sm text-foreground">
              {account.accountName}
            </p>
          )}
          {account.bankName && (
            <p className="text-xs text-muted-foreground">
              {account.bankName}
              {account.accountNumber &&
              account.accountNumber !== "000-0-00000-0" &&
              account.accountNumber !== "0000000000"
                ? ` · ${account.accountNumber}`
                : ""}
            </p>
          )}
          {!account.bankName &&
            account.accountNumber &&
            account.accountNumber !== "000-0-00000-0" &&
            account.accountNumber !== "0000000000" && (
              <p className="text-xs text-muted-foreground">
                {account.accountNumber}
              </p>
            )}
        </div>
      )}

      {payload && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving || isExpired}
          onClick={handleSaveQr}
          className="mt-4 rounded-full px-5 py-2 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3.5" />
          <span>{saving ? translate("กำลังบันทึก QR…", "Saving QR…") : translate("บันทึก QR", "Save QR")}</span>
        </Button>
      )}
      {saveError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {translate("บันทึก QR ไม่สำเร็จ กรุณาลองอีกครั้ง", "Could not save the QR code. Please try again")}</p>
      )}
    </div>
  );
}
