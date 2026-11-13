import { useState } from "react";
import { MapPinPlus, Plus } from "lucide-react";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

import { useAddresses, useSetDefaultAddress } from "../address.queries";
import { MAX_ADDRESSES } from "../address.format";
import type { Address } from "../address.types";
import { AddressBookSkeleton } from "../components/AddressBookSkeleton";
import { AddressCard } from "../components/AddressCard";
import { AddressFormDialog } from "../components/AddressFormDialog";
import { DeleteAddressDialog } from "../components/DeleteAddressDialog";
import { translateError, useTranslate } from "@/lib/i18n";

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
  const { t } = useTranslate("buyer");
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
          title: t("account.address.setDefaultFailed", "ตั้งที่อยู่หลักไม่สำเร็จ"),
          description: translateError(error, t("account.orders.tryAgain", "กรุณาลองอีกครั้ง")),
        }),
    });
  };

  return (
    <>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-semibold">{t("account.nav.addresses", "สมุดที่อยู่")}</h1>
            <Button disabled={(addresses.data?.length ?? 0) >= MAX_ADDRESSES} onClick={() => setEditing("new")}>
              <Plus data-icon="inline-start" /> {t("account.address.addNew", "เพิ่มที่อยู่ใหม่")}
            </Button>
          </div>

          <QueryBoundary
            query={addresses}
            loading={<AddressBookSkeleton />}
            errorTitle={t("account.address.loadFailed", "โหลดที่อยู่ไม่สำเร็จ")}
            errorMessage={t("account.address.loadFailedHint", "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง")}
            errorRetryLabel={t("account.profile.tryAgain", "ลองอีกครั้ง")}
            isEmpty={(items) => items.length === 0}
            empty={
              <EmptyState
                icon={MapPinPlus}
                title={t("account.address.empty", "ยังไม่มีที่อยู่ที่บันทึกไว้")}
                description={t("account.address.emptyHint", "บันทึกที่อยู่จัดส่งไว้ตอนนี้ ตอนชำระเงินจะได้สั้นลงหนึ่งขั้น")}
              >
                <Button onClick={() => setEditing("new")}>
                  <Plus data-icon="inline-start" /> {t("account.address.addNew", "เพิ่มที่อยู่ใหม่")}
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
                {items.length < MAX_ADDRESSES && <Button
                  variant="outline"
                  className="h-64 flex-col gap-3 border-dashed text-center"
                  onClick={() => setEditing("new")}
                >
                  <span className="flex size-12 items-center justify-center rounded-full border">
                    <MapPinPlus />
                  </span>
                  <span className="text-lg font-semibold">{t("account.address.addNew", "เพิ่มที่อยู่ใหม่")}</span>
                  <span className="max-w-52 whitespace-normal text-sm font-normal text-muted-foreground">
                    {t("account.address.addNewHint", "บันทึกที่อยู่จัดส่งไว้ เพื่อชำระเงินได้เร็วขึ้น")}
                  </span>
                </Button>}
              </div>
            )}
          </QueryBoundary>
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
    </>
  );
}
