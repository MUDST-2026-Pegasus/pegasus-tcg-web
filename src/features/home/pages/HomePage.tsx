import { useLanguage } from "@/lib/language";
import { HomeContent } from "@/features/home/components/HomeContent";

/** แต่ละ section โหลดข้อมูลของตัวเอง ดู `HomeContent` */
export function HomePage() {
  useLanguage();
  return <HomeContent />;
}
