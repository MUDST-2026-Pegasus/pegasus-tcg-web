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
  const { user } = useAuth();
  const query = useStorePromotions(username);
  const ownStore = user?.username === username;

  if (!query.data?.length) return null;
  return (
    <section aria-labelledby="store-promotions-title" className="-mb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="store-promotions-title" className="text-base font-bold text-foreground">
            โค้ดส่วนลดของร้าน
          </h2>
          <p className="text-xs text-muted-foreground">
            เก็บไว้ใช้กับสินค้าร้าน {displayName} · ใช้คู่กับโค้ด Pegasus ได้
          </p>
        </div>
        {ownStore ? (
          <Button variant="link" size="sm" className="h-auto px-0 text-xs" nativeButton={false}
            render={<Link to="/seller/promotions" />}>
            จัดการโค้ด <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{query.data.length} โค้ด</span>
        )}
      </div>
      <ClaimTicketRail codes={query.data} source="STORE" ownerView={ownStore} />
    </section>
  );
}
