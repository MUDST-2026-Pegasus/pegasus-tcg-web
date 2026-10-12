import { useState } from "react";

import { ImageIcon, Layers, Pencil, Search, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { formatCount } from "../catalog.format";
import type { CardSet, Game } from "../catalog.types";
import { displayableUrl, formatReleaseDate } from "../taxonomy.format";

import { CARD_EMPTY_CLASS, HEAD_CLASS, HEAD_ROW_CLASS } from "./taxonomy.styles";

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
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? cardSets.filter((cardSet) =>
        [cardSet.code, cardSet.name, cardSet.nameLocal ?? ""].some((value) =>
          value.toLowerCase().includes(needle),
        ),
      )
    : cardSets;

  return (
    <Card className="gap-0 rounded-xl border border-border p-0 shadow-none ring-0">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-4 pb-3.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-foreground">
            ชุดการ์ดของ {game.name}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {cardSets.length} ชุด · เรียงจากวางจำหน่ายล่าสุด
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
                placeholder="ค้นหาชื่อหรือรหัสชุด"
                aria-label="ค้นหาชุดการ์ด"
              />
            </InputGroup>
          )}
          <Button variant="outline" className="rounded-md px-2.5" onClick={onAdd}>
            + เพิ่มชุดการ์ด
          </Button>
        </div>
      </div>

      {cardSets.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="ยังไม่มีชุดการ์ด"
          description={`เพิ่มชุดแรกของ ${game.name} เพื่อจัดกลุ่มการ์ดตามรุ่นที่วางจำหน่าย`}
          className={CARD_EMPTY_CLASS}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="ไม่พบชุดที่ค้นหา"
          description={`ไม่มีชุดที่ชื่อหรือรหัสตรงกับ "${query.trim()}"`}
          className={CARD_EMPTY_CLASS}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className={HEAD_ROW_CLASS}>
              <TableHead className={cn(HEAD_CLASS, "pl-5")}>ชุดการ์ด</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[110px]")}>รหัส</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[140px]")}>
                วันวางจำหน่าย
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[110px]")}>
                จำนวนการ์ด
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-[88px] pr-5")}>
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="[&_tr]:border-[#eef1f2]">
            {visible.map((cardSet) => {
              const logo = displayableUrl(cardSet.logoUrl);
              const released = formatReleaseDate(cardSet.releaseDate);

              return (
                <TableRow key={cardSet.id} className="hover:bg-[#fafbfb]">
                  <TableCell className="py-2.5 pl-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f1f3f4] text-[#9aa5ad]">
                        {logo ? (
                          <img src={logo} alt="" className="size-full object-contain" />
                        ) : (
                          <ImageIcon aria-hidden="true" className="size-4" />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          {cardSet.name}
                        </span>
                        {cardSet.nameLocal && (
                          <span className="truncate text-[11px] text-[#9aa5ad]">
                            {cardSet.nameLocal}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className="h-5 rounded-[5px] px-1.5 text-[10px] font-medium"
                    >
                      {cardSet.code}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {released ?? <span className="text-[#9aa5ad]">—</span>}
                  </TableCell>

                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {cardSet.totalCards === null ? (
                      <span className="text-[#9aa5ad]">—</span>
                    ) : (
                      `${formatCount(cardSet.totalCards)} ใบ`
                    )}
                  </TableCell>

                  <TableCell className="py-2 pr-5">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`แก้ไขชุด ${cardSet.name}`}
                        className="rounded-md text-[#9aa5ad]"
                        onClick={() => onEdit(cardSet)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`ลบชุด ${cardSet.name}`}
                        className="rounded-md text-[#9aa5ad] hover:text-destructive"
                        onClick={() => onDelete(cardSet)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
