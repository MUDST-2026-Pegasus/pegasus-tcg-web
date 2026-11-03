import { useState, type FormEvent } from "react";
import { TicketPercent } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/auth.queries";
import type { PromotionOwner } from "@/features/cart/promotions.types";
import { normalizePromotionCode } from "@/features/cart/checkout.format";
import { ClaimSuccessDialog } from "@/features/promotions/ClaimSuccessDialog";
import { PromotionTermsDialog } from "@/features/promotions/PromotionTermsDialog";
import { WalletTicket } from "@/features/promotions/WalletTicket";
import { claimErrorMessage, copyPromotionCode } from "@/features/promotions/claim.format";
import { useClaimByCode, useWallet } from "@/features/promotions/claim.queries";
import type { WalletTab } from "@/features/promotions/claim.types";
import { cn } from "@/lib/utils";
import { toSidebarUser } from "../account.format";
import { AccountSidebar } from "../components/AccountSidebar";

const TABS: Array<{ value: WalletTab; label: string }> = [
  { value: "AVAILABLE", label: "ใช้ได้" },
  { value: "USED", label: "ใช้แล้ว" },
  { value: "EXPIRED", label: "หมดอายุ" },
];

const OWNERS: Array<{ value: PromotionOwner | undefined; label: string }> = [
  { value: undefined, label: "ทั้งหมด" },
  { value: "PLATFORM", label: "Pegasus" },
  { value: "SELLER", label: "โค้ดร้าน" },
];

const EMPTY_TEXT: Record<WalletTab, { title: string; description: string }> = {
  AVAILABLE: { title: "ยังไม่มีโค้ดที่เก็บไว้", description: "เก็บโค้ดได้ที่หน้าแรกและหน้าร้าน หรือกรอกโค้ดด้านบน" },
  USED: { title: "ยังไม่มีโค้ดที่ใช้แล้ว", description: "โค้ดที่ใช้กับคำสั่งซื้อที่ชำระแล้วจะแสดงที่นี่" },
  EXPIRED: { title: "ไม่มีโค้ดที่หมดอายุ", description: "โค้ดที่หมดเวลาหรือถูกหยุดจะแสดงที่นี่ 30 วัน" },
};

/** "เก็บโค้ด" box: typed codes, PRIVATE ones included, go straight into the wallet. */
function ClaimByCodeForm({ onClaimed }: { onClaimed(code: string): void }) {
  const claimByCode = useClaimByCode();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ tone: "info" | "error"; message: string } | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const code = normalizePromotionCode(value);
    if (!code || claimByCode.isPending) return;
    setResult(null);
    claimByCode.mutate(code, {
      onSuccess: (claimed) => {
        if (claimed.alreadyClaimed) {
          setResult({ tone: "info", message: "เก็บโค้ดนี้ไว้แล้ว — ดูในแท็บ “ใช้ได้”" });
          return;
        }
        setValue("");
        onClaimed(claimed.claim.code);
      },
      onError: (error) => setResult({ tone: "error", message: claimErrorMessage(error) }),
    });
  };

  return (
    <Card className="rounded-xl p-5 shadow-none ring-0">
      <form onSubmit={submit}>
        <Field data-invalid={result?.tone === "error" || undefined}
          className="grid gap-x-3 gap-y-1.5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <FieldLabel htmlFor="wallet-claim-code" className="text-sm font-semibold">มีโค้ดจากโซเชียล?</FieldLabel>
          <Input
            id="wallet-claim-code"
            value={value}
            onChange={(event) => { setValue(event.target.value); setResult(null); }}
            maxLength={20}
            placeholder="กรอกโค้ดเพื่อเก็บเข้ากระเป๋า"
            aria-invalid={result?.tone === "error"}
            aria-describedby={result ? "wallet-claim-result" : undefined}
            className="h-10 uppercase placeholder:normal-case"
          />
          <Button type="submit" className="h-10 rounded-full px-5" disabled={!value.trim() || claimByCode.isPending}>
            {claimByCode.isPending ? <Spinner /> : "เก็บโค้ด"}
          </Button>
          {result?.tone === "error" && (
            <FieldError id="wallet-claim-result" role="alert" className="text-xs sm:col-start-2">{result.message}</FieldError>
          )}
          {result?.tone === "info" && (
            <FieldDescription id="wallet-claim-result" role="status" className="text-xs text-primary sm:col-start-2">
              {result.message}
            </FieldDescription>
          )}
        </Field>
      </form>
    </Card>
  );
}

function WalletSkeleton() {
  return (
    <div role="status" aria-label="กำลังโหลดโค้ดของฉัน" className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[92px] rounded-xl" />)}
    </div>
  );
}

/** W1 "โค้ดของฉัน" — `/account/coupons`. */
export function MyCouponsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<WalletTab>("AVAILABLE");
  const [owner, setOwner] = useState<PromotionOwner | undefined>(undefined);
  const [termsCode, setTermsCode] = useState<string | null>(null);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const wallet = useWallet(tab, owner);
  const counts = wallet.data?.counts;

  return (
    <div className="min-h-[720px] bg-muted/60 px-4 py-10 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={toSidebarUser(user)} />
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <h1 className="text-3xl font-semibold">โค้ดของฉัน</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              โค้ดที่เก็บไว้จากหน้าแรกและหน้าร้าน ใช้ได้ตอนอยู่ในตะกร้า
            </p>
          </div>

          <ClaimByCodeForm onClaimed={(code) => { setTab("AVAILABLE"); setClaimedCode(code); }} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="สถานะโค้ด" className="flex rounded-full bg-muted p-1">
              {TABS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.value}
                  onClick={() => setTab(item.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors",
                    tab === item.value && "bg-background font-semibold text-foreground shadow-sm",
                  )}
                >
                  {item.label}
                  {counts?.[item.value] != null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">{counts[item.value]}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2" role="group" aria-label="เจ้าของโค้ด">
              {OWNERS.map((item) => (
                <Button
                  key={item.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={owner === item.value}
                  onClick={() => setOwner(item.value)}
                  className={cn(
                    "rounded-full bg-background",
                    owner === item.value && "border-primary text-primary hover:text-primary",
                  )}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <QueryBoundary
            query={wallet}
            loading={<WalletSkeleton />}
            errorTitle="โหลดโค้ดของฉันไม่สำเร็จ"
            isEmpty={(data) => data.items.length === 0}
            empty={
              <EmptyState icon={TicketPercent} title={EMPTY_TEXT[tab].title} description={EMPTY_TEXT[tab].description}>
                {tab === "AVAILABLE" && (
                  <Button variant="outline" nativeButton={false} render={<Link to="/" />}>ไปเก็บโค้ดที่หน้าแรก</Button>
                )}
              </EmptyState>
            }
          >
            {(data) => (
              <ul className="grid gap-4 md:grid-cols-2" aria-label="รายการโค้ด">
                {data.items.map((code) => (
                  <li key={code.id}>
                    <WalletTicket code={code} tab={tab} onOpenTerms={() => setTermsCode(code.code)} />
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>

          <p className="text-xs text-muted-foreground">
            แท็บ “ใช้แล้ว” แสดงเลขคำสั่งซื้อที่ใช้ · “หมดอายุ” แสดงโค้ดที่หมดเวลาหรือถูกหยุด (เก็บไว้ 30 วันแล้วซ่อน)
          </p>
        </div>
      </div>

      <PromotionTermsDialog
        code={termsCode}
        onOpenChange={(open) => !open && setTermsCode(null)}
        onCopy={copyPromotionCode}
      />
      <ClaimSuccessDialog code={claimedCode} onOpenChange={(open) => !open && setClaimedCode(null)} />
    </div>
  );
}
