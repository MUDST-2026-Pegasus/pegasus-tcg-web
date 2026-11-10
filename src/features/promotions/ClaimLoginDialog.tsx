import { LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClaimTicket, type ClaimTicketData } from "./ClaimTicket";
import { claimAuthUrl } from "./claim-redirect";
import { useTranslate } from "@/lib/i18n";

export interface ClaimLoginDialogProps {
  promotion: (ClaimTicketData & { id: number }) | null;
  onOpenChange(open: boolean): void;
}

/** M3 "เข้าสู่ระบบเพื่อเก็บโค้ด": a guest pressed เก็บโค้ด. After sign-in the code is collected for them. */
export function ClaimLoginDialog({ promotion, onOpenChange }: ClaimLoginDialogProps) {
  const { t } = useTranslate("promotions");
  const location = useLocation();
  const here = `${location.pathname}${location.search}`;

  return (
    <Dialog open={promotion !== null} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl p-0">
        {promotion && (
          <>
            <div className="grid gap-4 p-6">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LogIn className="size-4" aria-hidden />
              </span>
              <DialogHeader className="gap-1">
                <DialogTitle className="text-lg font-bold">{t("buyer.claimLoginDialog.dialogTitle", "เข้าสู่ระบบเพื่อเก็บโค้ด")}</DialogTitle>
                <DialogDescription className="text-xs">
                  {t("buyer.claimLoginDialog.dialogDescription", "เราจะเก็บ")} {promotion.code} {t("buyer.claimLoginDialog.dialogDescription2", "ให้อัตโนมัติหลังเข้าสู่ระบบ แล้วพากลับมาหน้านี้")}
                </DialogDescription>
              </DialogHeader>
              <ClaimTicket promotion={promotion} hideAction />
            </div>
            <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t bg-muted/30 px-6 py-3">
              <Button variant="outline" size="sm" nativeButton={false}
                render={<Link to={claimAuthUrl("/register", here, promotion.id)} />}>
                {t("buyer.claimLoginDialog.button", "สมัครสมาชิก")}
              </Button>
              <Button size="sm" nativeButton={false}
                render={<Link to={claimAuthUrl("/login", here, promotion.id)} />}>
                {t("buyer.claimLoginDialog.button2", "เข้าสู่ระบบ")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
