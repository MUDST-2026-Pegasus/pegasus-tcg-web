import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

import { stockForecastKeys } from "../../restock.queries";

type Forecast = {
  listingId: number;
  listingName: string;
  status: "FORECAST_AVAILABLE" | "INSUFFICIENT_DATA" | "NO_SALES" | "OUT_OF_STOCK";
  periodStart: string;
  periodEnd: string;
  availableStock: number;
  completedSales30Days: number;
  daysRemaining: number | null;
  estimatedStockoutDate: string | null;
  updatedAt: string;
};

function forecastDate(value: string) {
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function StockForecastCard({ listingId }: { listingId: number }) {
  const forecast = useQuery({
    queryKey: stockForecastKeys.detail(listingId),
    queryFn: () => api.get<Forecast>(`/sellers/me/listings/${listingId}/stock-forecast`),
  });

  return (
    <Card className="w-full gap-3 rounded-xl border border-border bg-card px-5 py-5 shadow-none ring-0 sm:px-6">
      <h2 className="text-lg font-bold text-foreground sm:text-xl">
        แนวโน้มการขายและวันที่คาดว่าสต็อกหมด
      </h2>
      {forecast.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">กำลังโหลดแนวโน้มการขาย…</p>
      ) : forecast.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>โหลดข้อมูลคาดการณ์ไม่สำเร็จ</span>
          <Button size="sm" variant="outline" onClick={() => void forecast.refetch()}>ลองใหม่</Button>
        </div>
      ) : !forecast.data ? (
        <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลคาดการณ์</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {forecast.data.listingName} · คำนวณ ณ {forecastDate(forecast.data.updatedAt.slice(0, 10))}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">พร้อมขาย</p><p className="mt-1 text-lg font-bold">{forecast.data.availableStock} ชิ้น</p></div>
            <div><p className="text-xs text-muted-foreground">ขายสำเร็จ 30 วัน</p><p className="mt-1 text-lg font-bold">{forecast.data.completedSales30Days} ชิ้น</p></div>
            <div><p className="text-xs text-muted-foreground">คงเหลือโดยประมาณ</p><p className="mt-1 text-lg font-bold">{forecast.data.status === "FORECAST_AVAILABLE" && forecast.data.daysRemaining != null ? `~${forecast.data.daysRemaining} วัน` : "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">คาดว่าจะหมด</p><p className="mt-1 text-lg font-bold">{forecast.data.status === "FORECAST_AVAILABLE" && forecast.data.estimatedStockoutDate ? forecastDate(forecast.data.estimatedStockoutDate) : "—"}</p></div>
          </div>
          {forecast.data.status !== "FORECAST_AVAILABLE" && (
            <p className="text-sm text-muted-foreground">
              {forecast.data.status === "OUT_OF_STOCK" ? "สินค้าหมดสต็อกแล้ว" : forecast.data.status === "NO_SALES" ? "ยังไม่มีการขายในช่วง 30 วันที่ใช้คำนวณ" : "ข้อมูลการขายยังไม่พอสำหรับคาดการณ์"}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            ใช้เพื่อวางแผนเติมสต็อก · วันที่จริงอาจเปลี่ยนตามยอดขาย การจอง และการรับสินค้าเข้า
          </p>
        </>
      )}
    </Card>
  );
}
