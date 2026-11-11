import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog, ItemCard, QueryBoundary } from "@/components/common";
import { ItemGridSkeleton } from "@/components/common/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/auth.queries";

import { payloadOf } from "../collection.payload";
import { useCollection, useRemoveCollectionItem, useUpdateCollectionItem } from "../collection.queries";
import type { CollectionItem } from "../collection.types";
import { AddCardsDialog } from "../components/AddCardsDialog";
import { EditCardDialog } from "../components/EditCardDialog";
import { translateError, useTranslate } from "@/lib/i18n";

export function MyCollectionPage() {
  const { t } = useTranslate("buyer");
  const { user } = useAuth();
  const collection = useCollection();
  const update = useUpdateCollectionItem();
  const remove = useRemoveCollectionItem();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CollectionItem | null>(null);
  const [removing, setRemoving] = useState<CollectionItem | null>(null);
  const [error, setError] = useState("");

  const cards = collection.data?.pages.flatMap((page) => page.items) ?? [];
  const total = collection.data?.pages[0]?.totalItems ?? 0;

  const togglePublic = async (item: CollectionItem, publicItem: boolean) => {
    try {
      await update.mutateAsync({ id: item.id, payload: payloadOf(item, { publicItem }) });
      setError("");
    } catch (cause) {
      setError(translateError(cause, t("collection.mine.visibilityFailed", "เปลี่ยนการมองเห็นไม่สำเร็จ")));
    }
  };

  const deleteCard = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
      setError("");
    } catch (cause) {
      setError(translateError(cause, t("collection.mine.removeFailed", "นำการ์ดนี้ออกไม่สำเร็จ")));
    }
  };

  if (!user) return null;

  return <main className="min-h-[580px] bg-muted/60 px-4 py-12 font-sans sm:px-8 lg:px-12">
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold">{t("collection.mine.title", "คอลเลกชันของฉัน")}</h1><p className="mt-1 text-muted-foreground">{t("collection.mine.total", "มีการ์ด {count} ใบในคอลเลกชัน", { count: total })}</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link to={`/u/${user.username}?tab=collection`} />}>{t("collection.mine.viewPublic", "ดูโปรไฟล์สาธารณะ")}</Button>
          <Button variant="outline" render={<Link to="/account/profile" />}>{t("collection.mine.account", "บัญชีของฉัน")}</Button>
          <Button onClick={() => setAdding(true)}><Plus data-icon="inline-start" /> {t("collection.mine.addCard", "เพิ่มการ์ด")}</Button>
        </div>
      </div>
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      <QueryBoundary query={collection} errorTitle={t("collection.mine.loadFailed", "โหลดคอลเลกชันไม่สำเร็จ")} errorRetryLabel={t("collection.tryAgain", "ลองอีกครั้ง")}
        loading={<div role="status" aria-busy="true" aria-label={t("collection.mine.loading", "กำลังโหลดคอลเลกชัน")}><ItemGridSkeleton className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" /></div>}>
        {() => <>
          {cards.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => <ItemCard key={item.id} imageSrc={item.photoUrl ?? item.card.officialImageUrl ?? undefined}
              imageAlt={item.card.productName} badge={item.card.variantLabel} title={item.card.productName}
              className="w-full [&_img]:object-contain"
              footer={<div className="flex w-full items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={item.publicItem} disabled={update.isPending}
                  onCheckedChange={(checked) => void togglePublic(item, checked)} aria-label={t("collection.mine.makePublic", "เปิดให้ {name} เป็นสาธารณะ", { name: item.card.productName })} />
                  {item.publicItem ? t("collection.mine.public", "สาธารณะ") : t("collection.mine.private", "ส่วนตัว")}</label>
                <div className="flex"><Button variant="ghost" size="icon" aria-label={t("collection.mine.editCard", "แก้ไข {name}", { name: item.card.productName })} onClick={() => setEditing(item)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label={t("collection.row.removeCard", "นำ {name} ออก", { name: item.card.productName })} onClick={() => setRemoving(item)}><Trash2 /></Button></div>
              </div>} />)}
          </div> : <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("collection.mine.empty", "ยังไม่มีการ์ด เพิ่มการ์ดใบแรกจากแคตตาล็อกได้เลย")}</p>}
          {collection.hasNextPage ? <div className="mt-6 text-center"><Button variant="outline" disabled={collection.isFetchingNextPage} onClick={() => void collection.fetchNextPage()}>{t("collection.loadMore", "โหลดเพิ่ม")}</Button></div> : null}
        </>}
      </QueryBoundary>
    </div>

    <AddCardsDialog open={adding} onOpenChange={setAdding} />

    <EditCardDialog item={editing} onClose={() => setEditing(null)} />

    <ConfirmDialog open={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null); }}
      variant="destructive" title={t("collection.mine.removeTitle", "นำการ์ดออก?")} description={t("collection.mine.removeConfirm", "นำการ์ดนี้ออกจากคอลเลกชัน?")}
      confirmLabel={t("collection.mine.removeAction", "นำการ์ดออก")} cancelLabel={t("collection.cancel", "ยกเลิก")} isPending={remove.isPending} onConfirm={() => void deleteCard()} />
  </main>;
}
