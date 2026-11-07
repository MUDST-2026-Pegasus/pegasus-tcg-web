import { translate, useLanguage } from "@/lib/language";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/features/auth/auth.queries";
import type { PromotionOwner } from "@/features/cart/promotions.types";
import { normalizePromotionCode } from "@/features/cart/checkout.format";
import { ClaimSuccessDialog } from "@/features/promotions/ClaimSuccessDialog";
import { PromotionTermsDialog } from "@/features/promotions/PromotionTermsDialog";
import { WalletTicket } from "@/features/promotions/WalletTicket";
import { claimErrorMessage, copyPromotionCode } from "@/features/promotions/claim.format";
import { useClaimByCode, useWallet } from "@/features/promotions/claim.queries";
import type { WalletTab } from "@/features/promotions/claim.types";
import { toSidebarUser } from "../account.format";
import { AccountSidebar } from "../components/AccountSidebar";

const TABS: Array<{ value: WalletTab; label: string }> = [
  { value: "AVAILABLE", get label() { return translate("ใช้ได้", "Available"); } },
  { value: "USED", get label() { return translate("ใช้แล้ว", "Used"); } },
  { value: "EXPIRED", get label() { return translate("หมดอายุ", "Expired"); } },
];

const OWNERS: Array<{ value: PromotionOwner | undefined; label: string }> = [
  { value: undefined, get label() { return translate("ทั้งหมด", "All"); } },
  { value: "PLATFORM", label: "Pegasus" },
  { value: "SELLER", get label() { return translate("โค้ดร้าน", "Shop coupon"); } },
];

const EMPTY_TEXT: Record<WalletTab, { title: string; description: string }> = {
  AVAILABLE: { get title() { return translate("ยังไม่มีโค้ดที่เก็บไว้", "No saved coupons yet"); }, get description() { return translate("เก็บโค้ดได้ที่หน้าแรกและหน้าร้าน หรือกรอกโค้ดด้านบน", "Collect coupons on the home or shop page, or enter a code above"); } },
  USED: { get title() { return translate("ยังไม่มีโค้ดที่ใช้แล้ว", "No used coupons yet"); }, get description() { return translate("โค้ดที่ใช้กับคำสั่งซื้อที่ชำระแล้วจะแสดงที่นี่", "Coupons used on paid orders will appear here"); } },
  EXPIRED: { get title() { return translate("ไม่มีโค้ดที่หมดอายุ", "No expired coupons"); }, get description() { return translate("โค้ดที่หมดเวลาหรือถูกหยุดจะแสดงที่นี่ 30 วัน", "Expired or paused coupons appear here for 30 days"); } },
};

/** "เก็บโค้ด" box: typed codes, PRIVATE ones included, go straight into the wallet. */
function ClaimByCodeForm({ onClaimed }: { onClaimed(code: string): void }) {
  useLanguage();
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
          setResult({ tone: "info", message: translate("เก็บโค้ดนี้ไว้แล้ว — ดูในแท็บ “ใช้ได้”", "Already saved — check the “Available” tab") });
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
          <FieldLabel htmlFor="wallet-claim-code" className="text-sm font-semibold">{translate("มีโค้ดจากโซเชียล?", "Have a code from social media?")}</FieldLabel>
          <Input
            id="wallet-claim-code"
            value={value}
            onChange={(event) => { setValue(event.target.value); setResult(null); }}
            maxLength={20}
            placeholder={translate("กรอกโค้ดเพื่อเก็บเข้ากระเป๋า", "Enter a code to save to your wallet")}
            aria-invalid={result?.tone === "error"}
            aria-describedby={result ? "wallet-claim-result" : undefined}
            className="h-10 uppercase placeholder:normal-case"
          />
          <Button type="submit" className="h-10 rounded-full px-5" disabled={!value.trim() || claimByCode.isPending}>
            {claimByCode.isPending ? <Spinner /> : translate("เก็บโค้ด", "Collect coupon")}
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
  useLanguage();
  return (
    <div role="status" aria-label={translate("กำลังโหลดโค้ดของฉัน", "Loading my coupons")} className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[92px] rounded-xl" />)}
    </div>
  );
}

/** W1 "โค้ดของฉัน" — `/account/coupons`. */
export function MyCouponsPage() {
  useLanguage();
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
            <h1 className="text-3xl font-semibold">{translate("โค้ดของฉัน", "My coupons")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {translate("โค้ดที่เก็บไว้จากหน้าแรกและหน้าร้าน ใช้ได้ตอนอยู่ในตะกร้า", "Coupons saved from the home and shop pages can be used in your cart")}</p>
          </div>

          <ClaimByCodeForm onClaimed={(code) => { setTab("AVAILABLE"); setClaimedCode(code); }} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(value) => setTab(value as WalletTab)}>
              <TabsList aria-label={translate("สถานะโค้ด", "Coupon status")} className="h-auto rounded-full bg-muted p-1">
                {TABS.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="h-auto rounded-full border-0! px-4 py-1.5 text-sm text-muted-foreground data-active:font-semibold data-active:text-foreground data-active:shadow-sm"
                  >
                    {item.label}
                    {counts?.[item.value] != null && (
                      <span className="ml-1.5 text-xs text-muted-foreground">{counts[item.value]}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <ToggleGroup
              aria-label={translate("เจ้าของโค้ด", "Coupon owner")}
              size="sm"
              variant="outline"
              value={[owner ?? "ALL"]}
              onValueChange={(next: string[]) => {
                const value = next[0];
                if (!value) return;
                setOwner(value === "ALL" ? undefined : (value as PromotionOwner));
              }}
            >
              {OWNERS.map((item) => (
                <ToggleGroupItem
                  key={item.label}
                  value={item.value ?? "ALL"}
                  className="bg-background aria-pressed:border-primary aria-pressed:bg-background aria-pressed:text-primary"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <QueryBoundary
            query={wallet}
            loading={<WalletSkeleton />}
            errorTitle={translate("โหลดโค้ดของฉันไม่สำเร็จ", "Could not load my coupons")}
            isEmpty={(data) => data.items.length === 0}
            empty={
              <EmptyState icon={TicketPercent} title={EMPTY_TEXT[tab].title} description={EMPTY_TEXT[tab].description}>
                {tab === "AVAILABLE" && (
                  <Button variant="outline" nativeButton={false} render={<Link to="/" />}>{translate("ไปเก็บโค้ดที่หน้าแรก", "Collect coupons on the home page")}</Button>
                )}
              </EmptyState>
            }
          >
            {(data) => (
              <ul className="grid gap-4 md:grid-cols-2" aria-label={translate("รายการโค้ด", "Coupon list")}>
                {data.items.map((code) => (
                  <li key={code.id}>
                    <WalletTicket code={code} tab={tab} onOpenTerms={() => setTermsCode(code.code)} />
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>

          <p className="text-xs text-muted-foreground">
            {translate("แท็บ “ใช้แล้ว” แสดงเลขคำสั่งซื้อที่ใช้ · “หมดอายุ” แสดงโค้ดที่หมดเวลาหรือถูกหยุด (เก็บไว้ 30 วันแล้วซ่อน)", "“Used” shows the order where the code was used. “Expired” shows expired or paused codes for 30 days")}</p>
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
