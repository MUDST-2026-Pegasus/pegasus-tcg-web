
import { CheckCircle2, Download, Package, PackageCheck, Truck } from "lucide-react";

import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type OrderCardProps = {
  id: string;
  date: string;
  title: string;
  description: string;
  total: string;
  status: "completed" | "shipping" | "payment";
};

function OrderCard({ id, date, title, description, total, status }: OrderCardProps) {
  const isCompleted = status === "completed";
  const isShipping = status === "shipping";

  return (
    <Card className="gap-0 rounded-xl border py-0 shadow-none">
      <CardHeader className="border-b bg-muted/40 py-4">
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-muted-foreground">ORDER ID</p>
            <p className="font-medium">{id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DATE</p>
            <p className="font-medium">{date}</p>
          </div>
        </div>
        <CardAction>
          <Badge variant={isCompleted ? "outline" : isShipping ? "default" : "destructive"}>
            {isCompleted ? <CheckCircle2 /> : isShipping ? <Truck /> : <PackageCheck />}
            {isCompleted ? "Completed" : isShipping ? "In Transit" : "Awaiting Payment"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-5 py-5 sm:grid-cols-[120px_1fr_auto] sm:items-center">
        <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <Package className="size-10" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <p className="mt-1 text-muted-foreground">{description}</p>
          {isCompleted && <p className="mt-2 text-sm text-muted-foreground">+ 2 other items</p>}
          {isShipping && (
            <div className="mt-4 flex items-center gap-3">
              <Progress value={60} className="max-w-64 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">ถึงพรุ่งนี้</span>
            </div>
          )}
          {status === "payment" && <p className="mt-3 text-xs font-medium text-destructive">กรุณาชำระเงินภายใน 24 ชั่วโมง</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">ยอดรวมคำสั่งซื้อ</p>
          <p className="mt-1 text-2xl font-semibold">฿{total}</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between gap-3 border-t bg-muted/30 py-3">
        <div>
          {isCompleted && <Button variant="link" className="px-0">ดาวน์โหลดใบเสร็จ <Download data-icon="inline-end" /></Button>}
          {status === "payment" && <Button variant="ghost">ยกเลิกคำสั่งซื้อ</Button>}
        </div>
        <div className="flex flex-wrap gap-3">
          {isShipping && <Button variant="outline">ติดตามพัสดุ</Button>}
          <Button variant="outline">ดูรายละเอียด</Button>
          {isCompleted && <Button>ซื้ออีกครั้ง</Button>}
          {status === "payment" && <Button variant="destructive">ชำระเงิน</Button>}
        </div>
      </CardFooter>
    </Card>
  );
}

export function OrderHistoryPage() {
  return (
    <div className="bg-muted/60 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar />
        <div className="flex min-w-0 flex-col gap-6">
          <OrderCard id="#PEG-2023-8891" date="24 ต.ค. 2023" title="ErgoPro Executive Mesh Chair" description="สี: Graphite Black • จำนวน: 1" total="1,249.97" status="completed" />
          <OrderCard id="#PEG-2023-8942" date="28 ต.ค. 2023" title="Elevate Aluminum Laptop Stand" description="สี: Space Grey • จำนวน: 5" total="449.75" status="shipping" />
          <OrderCard id="#PEG-2023-9105" date="1 พ.ย. 2023" title="Aura Pro Noise-Cancelling Headphones" description="สี: Matte Black • จำนวน: 2" total="699.98" status="payment" />
        </div>
      </div>
    </div>
  );
}
