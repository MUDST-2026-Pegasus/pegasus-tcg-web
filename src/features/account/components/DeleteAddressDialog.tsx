import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api";

import { useDeleteAddress } from "../address.queries";
import type { Address } from "../address.types";

type DeleteAddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address;
};

/** ลบแล้วกู้จากหน้านี้ไม่ได้ (ฝั่ง backend เป็น soft delete แต่ไม่มี UI คืนค่า) จึงต้องถามก่อน */
export function DeleteAddressDialog({
  open,
  onOpenChange,
  address,
}: DeleteAddressDialogProps) {
  const deleteAddress = useDeleteAddress();

  // hook อยู่ในตัวนอกที่ไม่ถูก unmount ตอนปิด ต้องล้าง error เอง
  // ไม่งั้นเปิดกล่องรอบหน้าจะเห็นข้อความของรอบที่แล้วค้างอยู่
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      deleteAddress.reset();
    }
    onOpenChange(next);
  };

  const onConfirm = async () => {
    if (!address) {
      return;
    }
    try {
      await deleteAddress.mutateAsync(address.id);
      handleOpenChange(false);
    } catch {
      // ข้อความอยู่ใน `deleteAddress.error` แล้ว ปล่อยกล่องเปิดไว้ให้ลองใหม่
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this address?</AlertDialogTitle>
          <AlertDialogDescription>
            {address?.recipientName} · {address?.line1}
            <br />
            Past orders keep their own copy, so they stay unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteAddress.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(
                deleteAddress.error,
                "Could not delete this address.",
              )}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAddress.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteAddress.isPending}
            onClick={onConfirm}
          >
            {deleteAddress.isPending && <Spinner data-icon="inline-start" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
