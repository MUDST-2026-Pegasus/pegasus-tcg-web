import { Link } from "react-router-dom";

import { useTranslate } from "@/lib/i18n";
import backHomeArrow from "@/assets/auth/back-home-arrow.svg";

export function BackHomeLink() {
  const { t } = useTranslate("buyer");
  return (
    <div className="flex w-full justify-center">
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-1.5 rounded-sm text-sm leading-5 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <img src={backHomeArrow} alt="" width={16} height={16} />
        {t("auth.backHome", "กลับหน้าแรก")}
      </Link>
    </div>
  );
}
