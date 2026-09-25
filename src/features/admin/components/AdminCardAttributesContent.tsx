import { useState } from "react";

import { Gamepad2, Info } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { EmptyState, QueryBoundary } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

import {
  useAdminGames,
  useCardSets,
  useCatalogCounts,
  useGameAttributes,
} from "../catalog.queries";
import type { Game } from "../catalog.types";
import { taxonomyErrorMessage } from "../taxonomy.format";
import { useAttributeCounts, useSaveGame } from "../taxonomy.queries";
import { gameWithActive } from "../taxonomy.schema";

import { CardAttributesSection } from "./CardAttributesSection";
import { GameFormDialog } from "./GameFormDialog";
import { GameInfoCard } from "./GameInfoCard";
import { GameListPanel } from "./GameListPanel";
import { SchemaJsonDialog } from "./SchemaJsonDialog";

/** แท็บของเกมที่เลือก — ค่าใน `?tab=` */
const TABS = ["fields"] as const;
type TaxonomyTab = (typeof TABS)[number];

function readTab(value: string | null): TaxonomyTab {
  return TABS.find((tab) => tab === value) ?? "fields";
}

type GameDialog = { open: boolean; game?: Game };

/**
 * หน้า "เกมและคุณสมบัติการ์ด" — เกมที่ขายบนแพลตฟอร์ม และฟิลด์ของการ์ดแต่ละเกม
 * เกมที่เลือกกับแท็บอยู่ใน URL (`?game=<id>&tab=`) เปิดลิงก์ซ้ำแล้วกลับมาที่เดิม
 *
 * ทุกการแก้บันทึกทันทีผ่าน `AdminCatalogTaxonomyController` ไม่มีปุ่มบันทึกรวม
 * cache ใช้ก้อนเดียวกับหน้าแคตตาล็อก ฟอร์มเพิ่มการ์ดจึงเห็นค่าใหม่ทันที
 */
export function AdminCardAttributesContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const games = useAdminGames();
  const [gameDialog, setGameDialog] = useState<GameDialog>({ open: false });
  const [jsonOpen, setJsonOpen] = useState(false);

  const selectGame = (gameId: number) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("game", String(gameId));
      return next;
    });

  const selectTab = (tab: TaxonomyTab) =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", tab);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      {/* หัวหน้า: ชื่อหน้า + ปุ่มการทำงาน */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.5px] text-foreground">
            เกมและคุณสมบัติการ์ด
          </h1>
          <p className="text-[13px] text-muted-foreground">
            จัดการเกม ชุดการ์ด หมวดหมู่ และกำหนดว่าการ์ดแต่ละเกมมีข้อมูลอะไรบ้าง —
            ใช้สร้างตัวกรองหน้าร้านและฟอร์มเพิ่มการ์ดในแคตตาล็อก
          </p>
        </div>

        <Button
          variant="outline"
          className="rounded-md px-2.5"
          disabled={!games.data?.length}
          onClick={() => setJsonOpen(true)}
        >
          ดูเป็น JSON
        </Button>
      </div>

      {/* แถบเตือนผลกระทบของการแก้ */}
      <div className="flex items-center gap-2.5 rounded-[10px] bg-[#e8f1fc] px-4 py-3 text-[#0058bc]">
        <Info aria-hidden="true" className="size-6 shrink-0" />
        <p className="text-xs">
          ทุกการแก้ไขบันทึกทันที และมีผลกับตัวกรองหน้าร้านกับฟอร์มเพิ่มการ์ดในแคตตาล็อก —
          ฟิลด์ที่ตั้งเป็น "จำเป็น" ต้องกรอกทุกครั้งที่เพิ่มหรือแก้การ์ด
        </p>
      </div>

      <QueryBoundary
        query={games}
        loading={<TaxonomySkeleton />}
        errorTitle="โหลดรายชื่อเกมไม่สำเร็จ"
        isEmpty={(list) => list.length === 0}
        empty={
          <EmptyState
            icon={Gamepad2}
            title="ยังไม่มีเกมในระบบ"
            description="เพิ่มเกมแรกก่อน แล้วค่อยกำหนดฟิลด์ ชุดการ์ด และหมวดหมู่ของเกมนั้น"
          >
            <Button onClick={() => setGameDialog({ open: true })}>
              + เพิ่มเกม
            </Button>
          </EmptyState>
        }
      >
        {(list) => (
          <TaxonomyWorkspace
            games={list}
            requestedGameId={Number(searchParams.get("game")) || null}
            tab={readTab(searchParams.get("tab"))}
            onSelectGame={selectGame}
            onSelectTab={selectTab}
            onAddGame={() => setGameDialog({ open: true })}
            onEditGame={(game) => setGameDialog({ open: true, game })}
            jsonOpen={jsonOpen}
            onJsonOpenChange={setJsonOpen}
          />
        )}
      </QueryBoundary>

      <GameFormDialog
        open={gameDialog.open}
        onOpenChange={(open) => setGameDialog((current) => ({ ...current, open }))}
        game={gameDialog.game}
        onSaved={(saved) => {
          if (!gameDialog.game) {
            selectGame(saved.id);
          }
        }}
      />
    </div>
  );
}

function TaxonomyWorkspace({
  games,
  requestedGameId,
  tab,
  onSelectGame,
  onSelectTab,
  onAddGame,
  onEditGame,
  jsonOpen,
  onJsonOpenChange,
}: {
  games: Game[];
  requestedGameId: number | null;
  tab: TaxonomyTab;
  onSelectGame: (gameId: number) => void;
  onSelectTab: (tab: TaxonomyTab) => void;
  onAddGame: () => void;
  onEditGame: (game: Game) => void;
  jsonOpen: boolean;
  onJsonOpenChange: (open: boolean) => void;
}) {
  // URL ไม่ได้ระบุเกม หรือระบุเกมที่ไม่มีอยู่ → เกมแรกตามลำดับที่ backend เรียงมา
  const game = games.find((item) => item.id === requestedGameId) ?? games[0];
  const gameIds = games.map((item) => item.id);

  const attributes = useGameAttributes(game.id);
  const fieldCounts = useAttributeCounts(gameIds);
  const counts = useCatalogCounts(gameIds);
  const cardSets = useCardSets(game.id);
  const saveGame = useSaveGame();

  const toggleActive = (active: boolean) =>
    saveGame.mutate(
      { gameId: game.id, payload: gameWithActive(game, active) },
      {
        onSuccess: () =>
          toast.add({
            type: "success",
            title: active
              ? `${game.name} แสดงบนหน้าร้านแล้ว`
              : `ซ่อน ${game.name} จากหน้าร้านแล้ว`,
          }),
        onError: (error) =>
          toast.add({
            type: "error",
            title: "เปลี่ยนสถานะเกมไม่สำเร็จ",
            description: taxonomyErrorMessage(error, "ลองใหม่อีกครั้ง"),
          }),
      },
    );

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <GameListPanel
        games={games}
        activeGameId={game.id}
        onSelectGame={onSelectGame}
        onAddGame={onAddGame}
        fieldCounts={fieldCounts}
        productCounts={counts.byGame}
        showFieldTypes={tab === "fields"}
      />

      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <GameInfoCard
          game={game}
          productCount={counts.byGame[game.id]}
          cardSetCount={cardSets.data?.length}
          onEdit={() => onEditGame(game)}
          onToggleActive={toggleActive}
          isToggling={saveGame.isPending}
        />

        <Tabs
          value={tab}
          onValueChange={(next) => onSelectTab(next as TaxonomyTab)}
          className="gap-4"
        >
          <TabsList
            variant="line"
            className="w-full justify-start border-b border-border"
          >
            <TabsTrigger value="fields" className="flex-none">
              คุณสมบัติการ์ด
              {attributes.data ? ` (${attributes.data.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields">
            <QueryBoundary
              query={attributes}
              loading={<TableSkeleton />}
              errorTitle="โหลดฟิลด์ของเกมนี้ไม่สำเร็จ"
            >
              {(list) => (
                <CardAttributesSection
                  game={game}
                  attributes={list}
                  productCount={counts.byGame[game.id]}
                />
              )}
            </QueryBoundary>
          </TabsContent>
        </Tabs>
      </div>

      <SchemaJsonDialog
        open={jsonOpen}
        onOpenChange={onJsonOpenChange}
        game={game}
        attributes={attributes.data ?? []}
      />
    </div>
  );
}

/** ระหว่างโหลดรายชื่อเกม — วางตรงกับคอลัมน์ซ้าย 224px + การ์ดเกม + ตาราง */
function TaxonomySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-start gap-6 lg:flex-row">
      <Card className="w-full gap-2 rounded-xl border border-border p-4 shadow-none ring-0 lg:w-[224px]">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </Card>
      <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-8 w-72 rounded-lg" />
        <TableSkeleton />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card
      aria-hidden="true"
      className="gap-3 rounded-xl border border-border p-5 shadow-none ring-0"
    >
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-9 w-full rounded-lg" />
      ))}
    </Card>
  );
}
