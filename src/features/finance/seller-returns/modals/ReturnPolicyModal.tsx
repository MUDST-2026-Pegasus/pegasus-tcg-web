import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslate } from "@/lib/i18n";

/**
 * Return Policy Modal
 */
export function ReturnPolicyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslate("seller");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {t("sellerReturns.modals.policy.title", "นโยบายและขั้นตอนการคืนสินค้า")}
          </DialogTitle>
          <DialogDescription>
            {t("sellerReturns.modals.policy.desc", "ข้อกำหนดและเงื่อนไขสำหรับคำขอคืนสินค้าบนแพลตฟอร์ม Pegasus TCG")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm text-muted-foreground leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">
              {t("sellerReturns.modals.policy.section1Title", "1. การเปิดคำขอคืนสินค้า")}
            </h4>
            <p className="text-xs">
              {t("sellerReturns.modals.policy.section1Body", "ผู้ซื้อสามารถเปิดคำขอคืนสินค้าได้ภายในกำหนดหลังคำสั่งซื้อขึ้นสถานะจัดส่ง/ส่งถึงแล้ว ก่อนที่ระบบ Escrow จะปล่อยเงินให้ร้านค้า")}
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">
              {t("sellerReturns.modals.policy.section2Title", "2. การพิจารณาและหลักฐาน")}
            </h4>
            <p className="text-xs">
              {t("sellerReturns.modals.policy.section2Body", "ร้านค้ามีสิทธิ์ตรวจสอบภาพถ่ายหรือคลิปวิดีโอหลักฐานสภาพการ์ด และเลือกอนุมัติแบบคืนเต็มจำนวน, คืนบางส่วน หรือปฏิเสธคำขอ")}
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">
              {t("sellerReturns.modals.policy.section3Title", "3. การส่งสินค้าคืน")}
            </h4>
            <p className="text-xs">
              {t("sellerReturns.modals.policy.section3Body", "หากร้านค้าเลือกให้ผู้ซื้อส่งสินค้าคืน ผู้ซื้อจะต้องจัดส่งและระบุเลขพัสดุในระบบ จากนั้นร้านค้าต้องตรวจสอบและกดยืนยันการรับสินค้าเพื่อปล่อยเงินคืน")}
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">
              {t("sellerReturns.modals.policy.section4Title", "4. ผลกระทบทางการเงิน")}
            </h4>
            <p className="text-xs">
              {t("sellerReturns.modals.policy.section4Body", "เงินของออเดอร์ที่มีคำขอเปิดอยู่จะถูกระงับ (Hold) ไว้ในระบบ Escrow จนกว่าจะได้ข้อสรุป หากปฏิเสธคำขอ เงินจะถูกปล่อยให้ร้านค้าตามกำหนดเดิม")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button className="w-full sm:w-auto" />}>
            {t("sellerReturns.modals.policy.gotIt", "เข้าใจแล้ว")}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
