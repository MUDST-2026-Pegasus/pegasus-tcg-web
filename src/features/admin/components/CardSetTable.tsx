import { useState } from "react";

import { ImageIcon, Layers, Pencil, Search, Trash2 } from "lucide-react";

import { EmptyState, DataTable, type DataTableColumn } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import type { CardSet, Game } from "../catalog.types";
import { formatReleaseDate } from "../taxonomy.format";

import { CARD_EMPTY_CLASS, HEAD_CLASS, HEAD_ROW_CLASS } from "./taxonomy.styles";
import { useTranslate } from "@/lib/i18n";

type CardSetTableProps = {
  game: Game;
  /** ใหม่สุดก่อน (เรียงมาจาก backend) */
  cardSets: CardSet[];
  onAdd: () => void;
  onEdit: (cardSet: CardSet) => void;
  onDelete: (cardSet: CardSet) => void;
};

/** แท็บ "ชุดการ์ด" — ค้นหาจากชื่อหรือรหัสในเครื่อง (ชุดของเกมหนึ่งมีไม่กี่สิบชุด) */
export function CardSetTable({
  game,
  cardSets,
  onAdd,
  onEdit,
  onDelete,
}: CardSetTableProps) {
  const { t } = useTranslate("admin");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? cardSets.filter((cardSet) =>
        [cardSet.code, cardSet.name, cardSet.nameLocal ?? ""].some((value) =>
          value.toLowerCase().includes(needle),
        ),
      )
    : cardSets;

  const dash = <span className="text-[#9aa5ad]">—</span>;
  const columns: DataTableColumn<CardSet>[] = [
    {
      id: "name",
      header: t("cardAttributes.sets.col.set", "ชุดการ์ด"),
      meta: { headClassName: cn(HEAD_CLASS, "pl-5"), cellClassName: "py-2.5 pl-5" },
      cell: ({ row: { original: cardSet } }) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-[#9aa5ad]">
            {cardSet.logoImageUrl ? (
              <img src={cardSet.logoImageUrl} alt="" className="size-full object-contain" />
            ) : (
              <ImageIcon aria-hidden="true" className="size-4" />
            )}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-foreground">{cardSet.name}</span>
            {cardSet.nameLocal && <span className="truncate text-[11px] text-[#9aa5ad]">{cardSet.nameLocal}</span>}
          </div>
        </div>
      ),
    },
    {
      id: "code",
      header: t("cardAttributes.col.code", "รหัส"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[110px]"), cellClassName: "py-2.5" },
      cell: ({ row }) => (
        <Badge variant="outline" className="h-5 rounded-[5px] px-1.5 text-[10px] font-medium">
          {row.original.code}
        </Badge>
      ),
    },
    {
      id: "released",
      header: t("cardAttributes.sets.col.release", "วันวางจำหน่าย"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[140px]"), cellClassName: "py-2.5 text-xs text-muted-foreground" },
      cell: ({ row }) => formatReleaseDate(row.original.releaseDate) ?? dash,
    },
    {
      id: "total",
      header: t("cardAttributes.sets.col.total", "จำนวนการ์ด"),
      meta: { headClassName: cn(HEAD_CLASS, "w-[110px]"), cellClassName: "py-2.5 text-xs text-muted-foreground" },
      cell: ({ row }) => (row.original.totalCards === null ? dash : t("cardAttributes.sets.cards", "{count} ใบ", { count: formatCount(row.original.totalCards) })),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("cardAttributes.col.actions", "จัดการ")}</span>,
      meta: { headClassName: cn(HEAD_CLASS, "w-[88px] pr-5"), cellClassName: "py-2 pr-5" },
      cell: ({ row: { original: cardSet } }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={t("cardAttributes.sets.edit", "แก้ไขชุด {name}", { name: cardSet.name })} className="rounded-md text-[#9aa5ad]" onClick={() => onEdit(cardSet)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("cardAttributes.sets.delete", "ลบชุด {name}", { name: cardSet.name })} className="rounded-md text-[#9aa5ad] hover:text-destructive" onClick={() => onDelete(cardSet)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-foreground">
            {t("cardAttributes.sets.heading", "ชุดการ์ดของ {game}", { game: game.name })}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("cardAttributes.sets.count", "{count} ชุด · เรียงจากวางจำหน่ายล่าสุด", { count: cardSets.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cardSets.length > 0 && (
            <InputGroup className="w-[220px]">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("cardAttributes.sets.searchPlaceholder", "ค้นหาชื่อหรือรหัสชุด")}
                aria-label={t("cardAttributes.sets.search", "ค้นหาชุดการ์ด")}
              />
            </InputGroup>
          )}
          <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
            {t("cardAttributes.sets.add", "+ เพิ่มชุดการ์ด")}
          </Button>
        </div>
      </div>

      {cardSets.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t("cardAttributes.sets.emptyTitle", "ยังไม่มีชุดการ์ด")}
          description={t("cardAttributes.sets.emptyDescription", "เพิ่มชุดแรกของ {game} เพื่อจัดกลุ่มการ์ดตามรุ่นที่วางจำหน่าย", { game: game.name })}
          className={CARD_EMPTY_CLASS}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("cardAttributes.sets.noMatchTitle", "ไม่พบชุดที่ค้นหา")}
          description={t("cardAttributes.sets.noMatchDescription", "ไม่มีชุดที่ชื่อหรือรหัสตรงกับ \"{query}\"", { query: query.trim() })}
          className={CARD_EMPTY_CLASS}
        />
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(cardSet) => String(cardSet.id)}
          headerRowClassName={HEAD_ROW_CLASS}
          bodyClassName="[&_tr]:border-muted"
          rowClassName={() => "hover:bg-[#fafbfb]"}
        />
      )}
    </Card>
  );
}
