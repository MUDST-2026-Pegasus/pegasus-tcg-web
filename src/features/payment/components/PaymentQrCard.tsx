import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPromptPayPayload } from "../promptpay";

interface PaymentQrCardProps {
  amount: number;
  orderNumber?: string;
  account: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    promptPayId?: string;
  };
}

/** Embed the logo before rasterizing so the PNG works outside this website. */
async function qrPng(svg: SVGSVGElement): Promise<Blob> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const logo = copy.querySelector("image");
  if (!logo) throw new Error("QR logo is missing");
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
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PNG export is unavailable");
  context.drawImage(image, 0, 0, 1024, 1024);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png");
  });
}

export function PaymentQrCard({ amount, orderNumber, account }: PaymentQrCardProps) {
  const refSvg = useRef<SVGSVGElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  let payload: string | undefined;
  try {
    if (account.promptPayId) payload = buildPromptPayPayload(account.promptPayId, amount);
  } catch {
    // Invalid merchant configuration must never produce a misleading payment QR.
  }
  const amountText = `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  async function handleSaveQr() {
    if (!refSvg.current || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const blob = await qrPng(refSvg.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pegasus-qr-${orderNumber || "checkout"}.png`;
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
      {payload ? <>
        <p className="text-xs text-muted-foreground font-medium mb-3 text-center">Scan with any banking app</p>
        <div className="w-full max-w-[240px] bg-[#F8FAFC] border border-slate-100/90 rounded-2xl p-5 flex flex-col items-center justify-center shadow-xs">
          <QRCodeSVG
            ref={refSvg}
            value={payload}
            size={176}
            level="H"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#0f172a"
            imageSettings={{ src: "/site-icon.jpg", width: 32, height: 32, excavate: true }}
            className="w-40 h-40 md:w-44 md:h-44"
            role="img"
            aria-label="PromptPay QR Code"
          />
          <span className="text-[11px] font-bold tracking-wider text-slate-800 mt-3 uppercase">PAY VIA QR SCAN</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Scan to Pay | {amountText}</span>
        </div>
      </> : <p className="text-sm text-muted-foreground text-center">กรุณาโอนเงินผ่านบัญชีธนาคารด้านล่าง</p>}
      <div className="mt-4 text-center space-y-0.5">
        <p className="font-semibold text-sm text-foreground">{account.accountName}</p>
        {account.bankName && <p className="text-xs text-muted-foreground">{account.bankName}{account.accountNumber ? ` · ${account.accountNumber}` : ""}</p>}
        {!account.bankName && account.accountNumber && <p className="text-xs text-muted-foreground">{account.accountNumber}</p>}
        {payload && <p className="text-xs text-muted-foreground">PromptPay ID {account.promptPayId}</p>}
      </div>
      {payload && <Button type="button" variant="outline" size="sm" disabled={saving} onClick={handleSaveQr}
        className="mt-4 rounded-full px-5 py-2 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs">
        <Download className="size-3.5" /><span>{saving ? "Saving QR…" : "Save QR"}</span>
      </Button>}
      {saveError && <p role="alert" className="mt-2 text-sm text-destructive">บันทึก QR ไม่สำเร็จ กรุณาลองอีกครั้ง</p>}
    </div>
  );
}
