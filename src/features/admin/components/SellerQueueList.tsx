import { Badge } from "@/components/ui/badge";
import type {
  AdminSellerApprovalData,
  SellerApplication,
} from "@/features/admin/admin.types";
import { SellerAvatar } from "@/features/admin/components/SellerAvatar";
import { cn } from "@/lib/utils";

type SellerQueueListProps = {
  queue: AdminSellerApprovalData["queue"];
  /** จำนวนคำขอที่รอตรวจสอบทั้งหมด (มากกว่าที่โชว์ในคิว) */
  pendingCount: string;
  applications: SellerApplication[];
  activeId: string;
  onSelect: (applicationId: string) => void;
};

/** คอลัมน์ซ้าย — คิวคำขอเปิดร้าน (กว้าง 420px ตามดีไซน์) */
export function SellerQueueList({
  queue,
  pendingCount,
  applications,
  activeId,
  onSelect,
}: SellerQueueListProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {queue.title} ({pendingCount})
        </p>
        <p className="text-[11px] text-muted-foreground">{queue.sortLabel}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {applications.map((application) => {
          const isActive = application.id === activeId;

          return (
            <li key={application.id}>
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(application.id)}
                className={cn(
                  "flex w-full flex-col gap-3 rounded-xl bg-background p-4 text-left transition-colors",
                  isActive
                    ? "border-2 border-[#0058bc]"
                    : "border border-border hover:bg-[#fafbfb]",
                )}
              >
                <div className="flex w-full items-center gap-3">
                  <SellerAvatar
                    initials={application.initials}
                    accent={application.avatarAccent}
                    className="size-[38px]"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {application.handle}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {application.submittedAt}
                    </span>
                  </div>

                  {isActive ? (
                    <Badge className="h-5 rounded-full bg-[#e8f1fc] px-2 text-[11px] font-medium text-[#0058bc]">
                      {queue.viewingLabel}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {application.documentTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="h-5 rounded-[5px] bg-[#eef1f2] px-2 text-[10px] font-medium text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
