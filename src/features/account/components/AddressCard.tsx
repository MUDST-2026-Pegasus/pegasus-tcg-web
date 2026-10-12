import { MapPin, Pencil, Phone, Trash2 } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";

import { formatAddressLines } from "../address.format";
import type { Address } from "../address.types";

type AddressCardProps = {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (address: Address) => void;
  /** กำลังตั้งใบนี้เป็นค่าเริ่มต้นอยู่ — ล็อกปุ่มไว้ไม่ให้กดซ้ำ */
  isSettingDefault?: boolean;
};

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault = false,
}: AddressCardProps) {
  return (
    <Card
      data-default={address.defaultShipping}
      className="gap-4 rounded-xl border py-5 shadow-none data-[default=true]:border-primary"
    >
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {address.recipientName}
          {address.label && <Badge variant="secondary">{address.label}</Badge>}
        </CardTitle>
        {address.defaultShipping && (
          <CardAction>
            <Badge>DEFAULT</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-muted-foreground">
        <p className="flex items-center gap-2">
          <Phone /> {address.phone}
        </p>
        <address className="flex gap-2 not-italic">
          <MapPin className="mt-1 shrink-0" />
          <span>
            {formatAddressLines(address).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </address>
      </CardContent>
      <Separator />
      <CardFooter className="justify-between gap-3">
        <div className="flex gap-1">
          <Button variant="link" size="sm" onClick={() => onEdit(address)}>
            <Pencil data-icon="inline-start" /> Edit
          </Button>
          <Separator orientation="vertical" />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(address)}
          >
            <Trash2 data-icon="inline-start" /> Delete
          </Button>
        </div>
        {!address.defaultShipping && (
          <Button
            variant="link"
            size="sm"
            disabled={isSettingDefault}
            onClick={() => onSetDefault(address)}
          >
            {isSettingDefault && <Spinner data-icon="inline-start" />}
            Set as Default
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
