import { useLanguage } from "@/lib/language";
import { AdminWeeklyReportContent } from "@/features/admin/components/AdminWeeklyReportContent";

export function AdminWeeklyReportPage() {
  useLanguage();
  return <AdminWeeklyReportContent />;
}
