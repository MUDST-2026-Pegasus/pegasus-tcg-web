import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type { ReturnEvidenceLink } from "../../after-sales.types";

/**
 * Image Preview Modal for evidence
 */
export function EvidencePreviewModal({
  open,
  onOpenChange,
  activeLink,
  allLinks,
  onSelectLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeLink: ReturnEvidenceLink | null;
  allLinks: ReturnEvidenceLink[];
  onSelectLink: (link: ReturnEvidenceLink) => void;
}) {
  if (!activeLink) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-foreground">
            หลักฐานจากผู้ซื้อ #{activeLink.number} จาก {allLinks.length} ไฟล์
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-2">
          <img
            src={activeLink.url}
            alt={`หลักฐานขนาดเต็ม ${activeLink.number}`}
            className="max-h-[60vh] w-auto max-w-full rounded object-contain"
          />
        </div>

        {allLinks.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto pt-2">
            {allLinks.map((link) => (
              <button
                key={link.number}
                type="button"
                onClick={() => onSelectLink(link)}
                className={cn(
                  "h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                  link.number === activeLink.number
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={link.url}
                  alt={`หลักฐาน ${link.number}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
