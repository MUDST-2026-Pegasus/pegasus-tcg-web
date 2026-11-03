import { Navigate, useSearchParams } from "react-router-dom";

import { useGameList } from "@/features/catalog/catalog.queries";

/**
 * เส้นทางเดิม /products พาไปหน้าค้นหาแบบไม่ใส่ตัวกรอง
 */
export function LegacyProductsRedirect() {
  const [searchParams] = useSearchParams();
  const search = searchParams.toString();
  return <Navigate replace to={search ? `/search?${search}` : "/search"} />;
}

/**
 * เส้นทางเดิม /pokemon และ /one-piece พาไปหน้าค้นหาพร้อมตัวกรองเกม
 */
export function LegacyGameRedirect({
  gameCode,
  fallbackSlug,
}: {
  gameCode: string;
  fallbackSlug: string;
}) {
  const { data: games, isLoading } = useGameList();
  const [searchParams] = useSearchParams();
  if (isLoading) {
    return null;
  }
  const slug = games?.find((g) => g.code === gameCode)?.slug ?? fallbackSlug;
  const targetParams = new URLSearchParams(searchParams);
  targetParams.set("game", slug);
  return <Navigate replace to={`/search?${targetParams.toString()}`} />;
}
