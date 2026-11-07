import { translate, useLanguage } from "@/lib/language";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth.queries";
import { ClaimTicketRail } from "@/features/promotions/ClaimTicketRail";
import { useStorePromotions } from "@/features/promotions/claim.queries";

type StorePromotionStripProps = {
  username: string;
  displayName: string;
};

/**
 * H2 "โค้ดส่วนลดของร้าน" ใต้ Store Hero ทุกแท็บ วางบนพื้นหน้าเพจ (ไม่มีกรอบ)
 * ร้านดูหน้าตัวเองไม่มีปุ่มเก็บ แต่มีทางไปจัดการโค้ดแทน
 */
export function StorePromotionStrip({ username, displayName }: StorePromotionStripProps) {
  useLanguage();
  const { user } = useAuth();
  const query = useStorePromotions(username);
  const ownStore = user?.username === username;

  if (!query.data?.length) return null;
  return (
    <section aria-labelledby="store-promotions-title" className="-mb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="store-promotions-title" className="text-base font-bold text-foreground">{translate("โค้ดส่วนลดของร้าน", "Store discount codes")}</h2>
          <p className="text-xs text-muted-foreground">{translate("เก็บไว้ใช้กับสินค้าร้าน", "Save for purchases from")}{displayName}{translate("· ใช้คู่กับโค้ด Pegasus ได้", "· Can be combined with Pegasus codes")}</p>
        </div>
        {ownStore ? (
          <Button variant="link" size="sm" className="h-auto px-0 text-xs" nativeButton={false}
            render={<Link to="/seller/promotions" />}>{translate("จัดการโค้ด", "Manage codes")}<ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{query.data.length}{translate("โค้ด", "codes")}</span>
        )}
      </div>
      <ClaimTicketRail codes={query.data} source="STORE" ownerView={ownStore} />
    </section>
  );
}
