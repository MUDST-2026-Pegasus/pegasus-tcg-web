import { ProductCard } from "@/components/common/ProductCard";
import { Button } from "@/components/ui/button";
import type { AdminCatalogData } from "@/features/admin/admin.types";
import { CatalogFilterPanel } from "@/features/admin/components/CatalogFilterPanel";
import { CatalogToolbar } from "@/features/admin/components/CatalogToolbar";

type AdminCatalogContentProps = {
  data: AdminCatalogData;
};

export function AdminCatalogContent({ data }: AdminCatalogContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            {data.title}
          </h1>
          <p className="text-[13px] text-muted-foreground">{data.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-md px-2.5">
            นำเข้า CSV
          </Button>
          <Button className="rounded-md px-2.5">+ เพิ่มการ์ดใหม่</Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <CatalogFilterPanel
          games={data.games}
          sets={data.sets}
          summary={data.summary}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <CatalogToolbar {...data.toolbar} />

          {/* ดีไซน์เป็น 4 คอลัมน์ ใช้ grid แทนความกว้างตายตัว 224px
              เพราะพอมี scrollbar พื้นที่จะหายไป ~15px แล้วตกเหลือ 3 ใบต่อแถว */}
          <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              {data.pagination.label}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-md px-2.5">
                {data.pagination.previousLabel}
              </Button>
              <Button variant="outline" className="rounded-md px-2.5">
                {data.pagination.nextLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
