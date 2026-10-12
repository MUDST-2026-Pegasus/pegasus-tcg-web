import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

import type { Game, GameAttribute } from "../catalog.types";

type SchemaJsonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  attributes: GameAttribute[];
};

/**
 * schema จริงของเกมที่เลือก — รูปเดียวกับที่ `GET /games/{id}/attributes` ส่งให้หน้าร้าน
 * ไว้ให้ทีม dev เช็คหรือคัดลอกไปใช้ ไม่ต้องเปิด network tab
 */
export function SchemaJsonDialog({
  open,
  onOpenChange,
  game,
  attributes,
}: SchemaJsonDialogProps) {
  const json = JSON.stringify(
    {
      game: { id: game.id, code: game.code, name: game.name, slug: game.slug },
      attributes: attributes.map((attribute) => ({
        attrKey: attribute.attrKey,
        label: attribute.label,
        dataType: attribute.dataType,
        options: attribute.options,
        required: attribute.required,
        filterable: attribute.filterable,
        displayOrder: attribute.displayOrder,
      })),
    },
    null,
    2,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      toast.add({ type: "success", title: "คัดลอก JSON แล้ว" });
    } catch {
      toast.add({ type: "error", title: "คัดลอกไม่สำเร็จ ลองเลือกข้อความเอง" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>schema ของ {game.name}</DialogTitle>
          <DialogDescription>
            {attributes.length} ฟิลด์ · ตรงกับที่ backend ส่งให้หน้าร้านและฟอร์มเพิ่มการ์ด
          </DialogDescription>
        </DialogHeader>

        <pre className="max-h-[60svh] overflow-auto rounded-lg bg-[#1d2427] p-4 font-mono text-xs leading-relaxed text-[#e6edf0]">
          {json}
        </pre>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            ปิด
          </DialogClose>
          <Button type="button" onClick={copy}>
            <Copy data-icon="inline-start" />
            คัดลอก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
