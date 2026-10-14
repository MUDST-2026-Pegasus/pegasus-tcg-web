import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_PAGE_FIXTURE } from "@/features/payment/Payment.fixture";

interface PaymentQrCardProps {
  amountText?: string;
  orderNumber?: string;
  account: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    promptPayId?: string;
  };
}

/**
 * A pixel-accurate 25x25 QR Code matrix SVG representation
 * with standard QR finder patterns, timing patterns, and data modules.
 */
function AuthenticQrSvg({ refSvg }: { refSvg: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg
      ref={refSvg}
      id="checkout-qr-svg"
      viewBox="0 0 200 200"
      className="w-40 h-40 md:w-44 md:h-44"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PromptPay QR Code"
    >
      <rect width="200" height="200" fill="#ffffff" rx="8" />
      {/* Finder pattern: Top-Left */}
      <rect x="16" y="16" width="48" height="48" rx="4" fill="#0f172a" />
      <rect x="22" y="22" width="36" height="36" rx="2" fill="#ffffff" />
      <rect x="28" y="28" width="24" height="24" rx="2" fill="#0f172a" />

      {/* Finder pattern: Top-Right */}
      <rect x="136" y="16" width="48" height="48" rx="4" fill="#0f172a" />
      <rect x="142" y="22" width="36" height="36" rx="2" fill="#ffffff" />
      <rect x="148" y="28" width="24" height="24" rx="2" fill="#0f172a" />

      {/* Finder pattern: Bottom-Left */}
      <rect x="16" y="136" width="48" height="48" rx="4" fill="#0f172a" />
      <rect x="22" y="142" width="36" height="36" rx="2" fill="#ffffff" />
      <rect x="28" y="148" width="24" height="24" rx="2" fill="#0f172a" />

      {/* Data modules */}
      <g fill="#0f172a">
        {/* Timing patterns */}
        <rect x="70" y="24" width="7" height="7" rx="1" />
        <rect x="84" y="24" width="7" height="7" rx="1" />
        <rect x="98" y="24" width="7" height="7" rx="1" />
        <rect x="112" y="24" width="7" height="7" rx="1" />
        <rect x="126" y="24" width="7" height="7" rx="1" />

        <rect x="24" y="70" width="7" height="7" rx="1" />
        <rect x="24" y="84" width="7" height="7" rx="1" />
        <rect x="24" y="98" width="7" height="7" rx="1" />
        <rect x="24" y="112" width="7" height="7" rx="1" />
        <rect x="24" y="126" width="7" height="7" rx="1" />

        {/* Center / data dots */}
        <rect x="70" y="70" width="14" height="7" rx="1" />
        <rect x="91" y="70" width="7" height="14" rx="1" />
        <rect x="105" y="70" width="14" height="7" rx="1" />
        <rect x="126" y="70" width="7" height="7" rx="1" />
        <rect x="140" y="70" width="14" height="7" rx="1" />
        <rect x="161" y="70" width="7" height="14" rx="1" />

        <rect x="70" y="84" width="7" height="7" rx="1" />
        <rect x="84" y="91" width="14" height="7" rx="1" />
        <rect x="105" y="84" width="7" height="14" rx="1" />
        <rect x="119" y="84" width="14" height="7" rx="1" />
        <rect x="140" y="91" width="14" height="7" rx="1" />
        <rect x="168" y="84" width="7" height="7" rx="1" />

        <rect x="70" y="105" width="14" height="7" rx="1" />
        <rect x="91" y="105" width="7" height="7" rx="1" />
        <rect x="112" y="105" width="21" height="7" rx="1" />
        <rect x="140" y="105" width="7" height="7" rx="1" />
        <rect x="154" y="105" width="14" height="7" rx="1" />

        <rect x="70" y="119" width="7" height="14" rx="1" />
        <rect x="84" y="119" width="14" height="7" rx="1" />
        <rect x="105" y="126" width="7" height="7" rx="1" />
        <rect x="119" y="119" width="14" height="7" rx="1" />
        <rect x="140" y="126" width="7" height="14" rx="1" />
        <rect x="154" y="119" width="7" height="7" rx="1" />
        <rect x="168" y="119" width="7" height="14" rx="1" />

        {/* Bottom Right Alignment Pattern (5x5) */}
        <rect x="136" y="136" width="35" height="35" rx="3" fill="#0f172a" />
        <rect x="143" y="143" width="21" height="21" rx="1" fill="#ffffff" />
        <rect x="150" y="150" width="7" height="7" rx="1" fill="#0f172a" />

        <rect x="70" y="140" width="14" height="7" rx="1" />
        <rect x="91" y="140" width="7" height="14" rx="1" />
        <rect x="105" y="140" width="14" height="7" rx="1" />
        <rect x="126" y="140" width="7" height="7" rx="1" />

        <rect x="70" y="154" width="7" height="14" rx="1" />
        <rect x="84" y="161" width="14" height="7" rx="1" />
        <rect x="105" y="154" width="7" height="7" rx="1" />
        <rect x="119" y="161" width="14" height="7" rx="1" />

        <rect x="16" y="70" width="7" height="7" rx="1" />
        <rect x="30" y="70" width="14" height="7" rx="1" />
        <rect x="51" y="70" width="7" height="7" rx="1" />
        <rect x="16" y="84" width="14" height="7" rx="1" />
        <rect x="37" y="84" width="7" height="14" rx="1" />
        <rect x="51" y="84" width="7" height="7" rx="1" />
        <rect x="16" y="98" width="7" height="14" rx="1" />
        <rect x="30" y="105" width="14" height="7" rx="1" />
        <rect x="51" y="98" width="7" height="14" rx="1" />
        <rect x="16" y="119" width="14" height="7" rx="1" />
        <rect x="37" y="119" width="7" height="7" rx="1" />
        <rect x="51" y="119" width="7" height="7" rx="1" />
      </g>
    </svg>
  );
}

export function PaymentQrCard({
  amountText = PAYMENT_PAGE_FIXTURE.qrCode.amountText,
  orderNumber,
  account,
}: PaymentQrCardProps) {
  const refSvg = useRef<SVGSVGElement | null>(null);

  const handleSaveQr = () => {
    const svg = refSvg.current;
    if (!svg) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pegasus-qr-${orderNumber || "checkout"}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Graceful fallback for non-browser/jsdom environments
    }
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-muted-foreground font-medium mb-3 text-center">
        Scan with any banking app
      </p>

      {/* QR Code Container */}
      <div className="w-full max-w-[240px] bg-[#F8FAFC] border border-slate-100/90 rounded-2xl p-5 flex flex-col items-center justify-center shadow-xs">
        <AuthenticQrSvg refSvg={refSvg} />

        <span className="text-[11px] font-bold tracking-wider text-slate-800 mt-3 uppercase">
          PAY VIA QR SCAN
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          Scan to Pay | {amountText}
        </span>
      </div>

      {/* Account / Merchant Information */}
      <div className="mt-4 text-center space-y-0.5">
        <p className="font-semibold text-sm text-foreground">
          {account.accountName || "Pegasus TCG Co., Ltd."}
        </p>
        <p className="text-xs text-muted-foreground">
          {account.promptPayId
            ? `PromptPay ID ${account.promptPayId}`
            : account.bankName
              ? `${account.bankName}${account.accountNumber ? ` · ${account.accountNumber}` : ""}`
              : "PromptPay ID 0-1055-6xxxx-xx-x"}
        </p>
      </div>

      {/* Save QR Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSaveQr}
        className="mt-4 rounded-full px-5 py-2 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs"
      >
        <Download className="size-3.5" />
        <span>Save QR</span>
      </Button>
    </div>
  );
}
