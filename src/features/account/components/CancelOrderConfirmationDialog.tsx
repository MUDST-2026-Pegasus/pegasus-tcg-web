import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrderDetails } from "../orders.types";

export type CancelOrderConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetails | null;
  onConfirm: () => void | Promise<void>;
  isCancelling: boolean;
};

/**
 * Confirmation modal matching the visual style of the reference alert/confirmation dialogs.
 * Replaces window.confirm before cancelling a pending order.
 */
export function CancelOrderConfirmationDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isCancelling,
}: CancelOrderConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl bg-card p-0 shadow-[0px_12px_32px_0px_rgba(0,0,0,0.18)] ring-0 sm:max-w-[460px]"
      >
        <div className="flex flex-col gap-3 px-6 pt-6 pb-5">
          {/* Soft red alert rounded icon box */}
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-100">
            <AlertCircle aria-hidden="true" className="size-5 text-destructive" />
          </div>

          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
              Cancel this order?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed text-gray-500">
              This action cannot be undone and reserved items will be released.
              {order ? ` (Order #${order.orderNumber})` : ""}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2.5 border-t border-muted bg-neutral-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg px-4"
            disabled={isCancelling}
            onClick={() => onOpenChange(false)}
          >
            Keep Order
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="rounded-lg bg-destructive px-4 text-white hover:bg-red-700"
            disabled={isCancelling}
            onClick={onConfirm}
          >
            {isCancelling ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" />
                Cancelling...
              </span>
            ) : (
              "Confirm Cancel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
