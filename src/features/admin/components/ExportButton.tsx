import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslate } from "@/lib/i18n";

type ExportButtonProps = {
  label: string;
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
};

/** ปุ่มส่งออกไฟล์ในหน้าแอดมิน — ระหว่างสร้างไฟล์กดไม่ได้และแสดงสถานะกำลังโหลด [TCG-749] */
export function ExportButton({ label, pending, disabled, onClick }: ExportButtonProps) {
  const { t } = useTranslate("admin");
  return (
    <Button
      variant="outline"
      className="rounded-md px-2.5"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      onClick={onClick}
    >
      {pending ? (
        <>
          <Spinner /> {t("export.pending", "กำลังสร้างไฟล์...")}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
