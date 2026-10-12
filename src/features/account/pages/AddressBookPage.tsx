import { useState } from "react";
import { MapPinPlus, Plus } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth.queries";
import { getErrorMessage } from "@/lib/api";

import { toSidebarUser } from "../account.format";
import { useAddresses, useSetDefaultAddress } from "../address.queries";
import type { Address } from "../address.types";
import { AccountSidebar } from "../components/AccountSidebar";
import { AddressBookSkeleton } from "../components/AddressBookSkeleton";
import { AddressCard } from "../components/AddressCard";
import { AddressFormDialog } from "../components/AddressFormDialog";
import { DeleteAddressDialog } from "../components/DeleteAddressDialog";

/**
 * สมุดที่อยู่ — ACC-01 · ต่อ `/addresses` ครบทั้ง 5 กริยา
 *
 * หน้านี้เป็นตัวอย่างอ้างอิงของมาตรฐาน data layer (FND-01) ถ้าจะแปลงหน้าอื่น
 * จาก mock ไป API ให้ลอกรูปแบบจากที่นี่ — ขั้นตอนเต็มอยู่ใน `CONTRIBUTING.md`
 * หัวข้อ "แปลง mock → API"
 *
 * - ข้อมูลมาจาก hook เดียว (`useAddresses`) ไม่มี fixture เหลือในไฟล์นี้
 * - loading / error / empty ใช้ `QueryBoundary` ตัวกลาง
 * - ทุก mutation `invalidateQueries` ให้เอง รายการจึงอัปเดตโดยไม่ต้อง reload
 */
export function AddressBookPage() {
  const { user } = useAuth();
  const addresses = useAddresses();
  const setDefault = useSetDefaultAddress();

  /** `"new"` = เปิดฟอร์มเปล่า, `Address` = เปิดฟอร์มพร้อมค่าเดิม, `null` = ปิด */
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);

  const handleSetDefault = (address: Address) => {
    setDefault.mutate(address, {
      onError: (error) =>
        toast.add({
          type: "error",
          title: "Could not set the default address",
          description: getErrorMessage(error, "Please try again."),
        }),
    });
  };

  return (
    <div className="min-h-[720px] bg-muted/60 px-4 py-10 font-sans sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[280px_1fr]">
        <AccountSidebar user={toSidebarUser(user)} />
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold">Address Book</h1>
            <Button onClick={() => setEditing("new")}>
              <Plus data-icon="inline-start" /> Add New Address
            </Button>
          </div>

          <QueryBoundary
            query={addresses}
            loading={<AddressBookSkeleton />}
            errorTitle="Could not load your addresses"
            errorMessage="Check your connection and try again."
            errorRetryLabel="Try again"
            isEmpty={(items) => items.length === 0}
            empty={
              <EmptyState
                icon={MapPinPlus}
                title="No saved addresses yet"
                description="Save a shipping destination now and checkout will be one step shorter."
              >
                <Button onClick={() => setEditing("new")}>
                  <Plus data-icon="inline-start" /> Add New Address
                </Button>
              </EmptyState>
            }
          >
            {(items) => (
              <div className="grid gap-5 xl:grid-cols-2">
                {items.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                    onSetDefault={handleSetDefault}
                    isSettingDefault={
                      setDefault.isPending &&
                      setDefault.variables?.id === address.id
                    }
                  />
                ))}
                <Button
                  variant="outline"
                  className="h-64 flex-col gap-3 border-dashed text-center"
                  onClick={() => setEditing("new")}
                >
                  <span className="flex size-12 items-center justify-center rounded-full border">
                    <MapPinPlus />
                  </span>
                  <span className="text-lg font-semibold">Add New Address</span>
                  <span className="max-w-52 whitespace-normal text-sm font-normal text-muted-foreground">
                    Save a new shipping destination for faster checkout.
                  </span>
                </Button>
              </div>
            )}
          </QueryBoundary>
        </div>
      </div>

      <AddressFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        address={editing === "new" || editing === null ? undefined : editing}
      />
      <DeleteAddressDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        address={deleting ?? undefined}
      />
    </div>
  );
}
