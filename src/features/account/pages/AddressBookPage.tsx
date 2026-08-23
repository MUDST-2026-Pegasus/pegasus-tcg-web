import { MapPin, MapPinPlus, Pencil, Phone, Plus, Trash2 } from "lucide-react";

import { AccountSidebar } from "@/features/account/components/AccountSidebar";
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
import { Separator } from "@/components/ui/separator";

const ADDRESSES = [
  {
    name: "Elena Rostova",
    phone: "+1 (555) 019-2837",
    lines: ["1440 Corporate Way, Suite 400", "San Francisco, CA 94107", "United States"],
    isDefault: true,
  },
  {
    name: "Elena Rostova",
    phone: "+1 (555) 837-1102",
    lines: ["829 Logistics Blvd, Warehouse B", "Newark, NJ 07114", "United States"],
    isDefault: false,
  },
] as const;

function AddressCard({ address }: { address: (typeof ADDRESSES)[number] }) {
  return (
    <Card
      data-default={address.isDefault}
      className="gap-4 rounded-xl border py-5 shadow-none data-[default=true]:border-primary"
    >
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{address.name}</CardTitle>
        {address.isDefault && <CardAction><Badge>DEFAULT</Badge></CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-muted-foreground">
        <p className="flex items-center gap-2"><Phone /> {address.phone}</p>
        <address className="flex gap-2 not-italic">
          <MapPin className="mt-1 shrink-0" />
          <span>{address.lines.map((line) => <span key={line} className="block">{line}</span>)}</span>
        </address>
      </CardContent>
      <Separator />
      <CardFooter className="justify-between gap-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm"><Pencil data-icon="inline-start" /> Edit</Button>
          <Separator orientation="vertical" />
          <Button variant="destructive" size="sm"><Trash2 data-icon="inline-start" /> Delete</Button>
        </div>
        {!address.isDefault && <Button variant="ghost" size="sm">Set as Default</Button>}
      </CardFooter>
    </Card>
  );
}

export function AddressBookPage() {
  return (
    <div className="min-h-[720px] bg-muted/60 px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar />
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold">Address Book</h1>
            <Button><Plus data-icon="inline-start" /> Add New Address</Button>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {ADDRESSES.map((address) => <AddressCard key={address.phone} address={address} />)}
            <Button variant="outline" className="h-64 flex-col gap-3 border-dashed text-center">
              <span className="flex size-12 items-center justify-center rounded-full border">
                <MapPinPlus />
              </span>
              <span className="text-lg font-semibold">Add New Address</span>
              <span className="max-w-52 whitespace-normal text-sm font-normal text-muted-foreground">
                Save a new shipping destination for faster checkout.
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
