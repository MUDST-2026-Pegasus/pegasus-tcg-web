import { PagePlaceholder } from "@/components/common/PagePlaceholder";
import { useTranslate } from "@/lib/i18n";

export function SellerLogoutPage() {
  const { t } = useTranslate("seller");
  return <PagePlaceholder title={t("logout.title", "ออกจากระบบ")} figmaNode="432:8128" />;
}
