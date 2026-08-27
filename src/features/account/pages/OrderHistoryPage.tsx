import { ChevronDown, Download, TriangleAlert } from "lucide-react";

import { AccountSidebar } from "@/features/account/components/AccountSidebar";
import { ORDER_HISTORY_FIXTURE } from "@/features/account/account.fixture";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type OrderCardProps = {
  id: string;
  date: string;
  title: string;
  description: string;
  total: string;
  image: string;
  status: "completed" | "shipping" | "payment";
};

function OrderCard({ id, date, title, description, total, image, status }: OrderCardProps) {
  const isCompleted = status === "completed";
  const isShipping = status === "shipping";
  const isPayment = status === "payment";
  const statusLabel = isCompleted ? "Completed" : isShipping ? "In Transit" : "Awaiting Payment";

  return (
    <Card className={cn("gap-0 overflow-hidden rounded-xl border py-0 shadow-none", isPayment && "border-[#ff95004d]")}>
      <CardHeader className="rounded-none border-b bg-[#faf9fe] px-4 py-3">
        <div className="flex gap-6">
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
          <Badge
            variant={isPayment ? "destructive" : "secondary"}
            className={cn("before:size-1.5 before:rounded-full before:bg-current before:content-['']", isPayment && "bg-destructive text-primary-foreground")}
          >
            {statusLabel}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
        <img src={image} alt={title} className="size-24 rounded-lg border object-cover" />
        <div className="min-w-0">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <p className="mt-1 text-muted-foreground">{description}</p>
          {isCompleted && (
            <p className="mt-2 flex items-center text-sm text-muted-foreground">
              + 2 other items <ChevronDown className="size-4" />
            </p>
          )}
          {isShipping && (
            <div className="mt-4 flex items-center gap-2">
              <Progress value={60} className="max-w-64 flex-1 gap-0 [&_[data-slot=progress-track]]:h-1" />
              <span className="text-[10px] font-medium text-muted-foreground">Est. Delivery Tomorrow</span>
            </div>
          )}
          {isPayment && (
            <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#ff9500]">
              <TriangleAlert className="size-3" /> Payment due in 24 hours
            </p>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium text-muted-foreground">Order Total</p>
          <p className="text-2xl font-semibold">${total}</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-between gap-3 rounded-none border-t bg-[#faf9fe] px-4 py-3">
        <div>
          {isCompleted && <Button variant="link" size="sm" className="px-0">Download Invoice <Download data-icon="inline-end" /></Button>}
          {isPayment && <Button variant="destructive" size="xs">Cancel Order</Button>}
        </div>
        <div className="flex flex-wrap gap-3">
          {isShipping && <Button variant="outline" size="sm" className="w-[121px]">Track Package</Button>}
          <Button variant="outline" size="sm" className="w-[121px]">View Details</Button>
          {isCompleted && <Button size="sm" className="w-[105px]">Buy Again</Button>}
          {isPayment && <Button size="sm" className="w-[99px]">Pay Now</Button>}
        </div>
      </CardFooter>
    </Card>
  );
}

export function OrderHistoryPage() {
  return (
    <div className="min-h-[956px] bg-muted/60 px-4 py-8 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={ORDER_HISTORY_FIXTURE.user} />
        <div className="flex min-w-0 flex-col gap-4">
          {ORDER_HISTORY_FIXTURE.orders.map((order) => <OrderCard key={order.id} {...order} />)}
        </div>
      </div>
    </div>
  );
}
