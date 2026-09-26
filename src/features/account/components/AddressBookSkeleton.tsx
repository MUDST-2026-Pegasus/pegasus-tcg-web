import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * โครงที่วางตรงกับ `AddressCard` ตัวจริง ภาพจึงไม่กระโดดตอนข้อมูลมาถึง
 * แก้การ์ดจริงเมื่อไหร่ ให้แก้ตัวนี้ตามด้วย
 */
export function AddressBookSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2" aria-busy="true">
      {Array.from({ length: cards }, (_, index) => (
        <Card key={index} className="gap-4 rounded-xl border py-5 shadow-none">
          <CardHeader>
            <Skeleton className="h-6 w-44 rounded-md" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-5 w-40 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-4 w-3/5 rounded-md" />
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="justify-between gap-3">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
