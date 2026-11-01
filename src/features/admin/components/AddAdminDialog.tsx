import { useEffect, useRef, useState } from "react";

import { SearchIcon, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { ROLE_LABEL, userAccent, userErrorMessage, userInitials } from "../users.format";
import { USER_SEARCH_SIZE, useChangeRole, useUserSearch } from "../users.queries";
import type { AdminUser } from "../users.types";
import { SellerAvatar } from "./SellerAvatar";
import { RoleBadges } from "./UserBadges";
import { UserDialog } from "./UserDialog";
import { AdminRoleConfirmDialog } from "./UserRolesDialog";

const SEARCH_DELAY_MS = 300;

/**
 * ปุ่ม "+ เพิ่มผู้ดูแล" บนหัวหน้า — ค้นบัญชีที่มีอยู่แล้ว (ไม่ได้สร้างใหม่)
 * เลือก 1 บัญชี → confirm "ตั้งเป็นผู้ดูแล" → `POST /users/{id}/roles {role: ADMIN}`
 */
export function AddAdminDialog({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const search = useUserSearch(q);
  const changeRole = useChangeRole();
  const saving = changeRole.isPending;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleInput(value: string) {
    setText(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setQ(value.trim()), SEARCH_DELAY_MS);
  }

  function grant() {
    if (!selected) return;
    changeRole.mutate(
      { userId: selected.id, role: "ADMIN", grant: true },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: `ตั้ง @${selected.username} เป็น${ROLE_LABEL.ADMIN}แล้ว` });
          onClose();
        },
        onError: (error) => {
          setConfirming(false);
          toast.add({
            type: "error",
            title: "ทำรายการไม่สำเร็จ",
            description: userErrorMessage(error, "ลองใหม่อีกครั้ง"),
          });
        },
      },
    );
  }

  if (confirming && selected) {
    return (
      <AdminRoleConfirmDialog
        user={selected}
        grant
        saving={saving}
        onCancel={() => setConfirming(false)}
        onConfirm={grant}
      />
    );
  }

  const results = q ? search.data : undefined;
  // ผลลัพธ์ชุดใหม่ไม่มีบัญชีที่เลือกไว้แล้ว — ไม่ให้กดถัดไปกับของที่มองไม่เห็น
  const selectable = selected && results?.items.some((user) => user.id === selected.id) ? selected : null;

  return (
    <UserDialog
      open
      wide
      onClose={onClose}
      tone="info"
      icon={<Users />}
      title="เพิ่มผู้ดูแล"
      description="ค้นหาบัญชีที่มีอยู่แล้วเพื่อให้สิทธิ์ผู้ดูแล (ไม่ได้สร้างบัญชีใหม่)"
      footerNote={selectable ? "ต่อด้วยการยืนยัน “ตั้งเป็นผู้ดูแล”" : undefined}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button size="sm" disabled={!selectable} onClick={() => setConfirming(true)}>
            ถัดไป
          </Button>
        </>
      }
    >
      <InputGroup className="h-[34px] rounded-[7px] border-input bg-background">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          autoFocus
          value={text}
          onChange={(event) => handleInput(event.target.value)}
          aria-label="ค้นหาบัญชีจากอีเมล username หรือชื่อที่แสดง"
          placeholder="อีเมล, username หรือชื่อที่แสดง"
          className="text-xs"
        />
      </InputGroup>

      {!q ? (
        <p className="text-[10px] text-[#9aa5ad]">
          พิมพ์เพื่อค้นหา · แสดงสูงสุด {USER_SEARCH_SIZE} รายการ
        </p>
      ) : search.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[52px] rounded-[10px]" />
          ))}
        </div>
      ) : search.isError || !results ? (
        <p role="alert" className="text-[11px] text-destructive">
          {userErrorMessage(search.error, "ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง")}
        </p>
      ) : results.items.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-[10px] bg-[#fafbfb] py-[22px] text-center">
          <SearchIcon aria-hidden="true" className="size-[18px] text-muted-foreground" />
          <p className="text-xs font-medium text-foreground">ไม่พบบัญชีที่ตรงกับ “{q}”</p>
          <p className="text-[11px] text-muted-foreground">
            ผู้ใช้ต้องสมัครสมาชิกก่อน จึงจะตั้งเป็นผู้ดูแลได้
          </p>
        </div>
      ) : (
        <>
          <p className="text-[10px] text-[#9aa5ad]">
            ผลการค้นหา {results.totalItems.toLocaleString("th-TH")} บัญชี · แสดงสูงสุด{" "}
            {USER_SEARCH_SIZE} รายการ ค้นจากอีเมล / username / ชื่อที่แสดง
          </p>
          <RadioGroup
            aria-label="เลือกบัญชีที่จะตั้งเป็นผู้ดูแล"
            value={selectable ? String(selectable.id) : ""}
            onValueChange={(value) =>
              setSelected(results.items.find((user) => String(user.id) === value) ?? null)
            }
            className={cn("gap-2", search.isPlaceholderData && "opacity-60")}
          >
            {results.items.map((user) => {
              const isAdmin = user.roles.includes("ADMIN");
              const checked = selectable?.id === user.id;
              return (
                <label
                  key={user.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#eef1f2] px-3 py-2.5",
                    checked && "border-[#0058bc] bg-[#f5f9fe]",
                    isAdmin && "cursor-not-allowed opacity-55",
                  )}
                >
                  <RadioGroupItem value={String(user.id)} disabled={isAdmin} />
                  <SellerAvatar
                    initials={userInitials(user)}
                    accent={userAccent(user)}
                    src={user.avatarUrl}
                    className="size-[30px] [&_[data-slot=avatar-fallback]]:text-[11px]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-xs font-medium text-foreground">
                      {user.displayName}
                      <span className="ml-1.5 font-normal text-muted-foreground">@{user.username}</span>
                    </span>
                    <span className="truncate text-[10px] text-[#9aa5ad]">{user.email}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <RoleBadges roles={user.roles} className="flex-nowrap" />
                    {isAdmin ? (
                      <span className="text-[10px] text-[#9aa5ad]">เป็นผู้ดูแลแล้ว</span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        </>
      )}
    </UserDialog>
  );
}
