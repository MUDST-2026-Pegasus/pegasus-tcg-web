import { useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, productHref } from "../catalog.mappers";
import { useGameList, useProductSearch } from "../catalog.queries";

/** A catalog entry point whose cards link to the live product detail. */
export function ProductListPage({ gameCode, title = "สินค้าทั้งหมด" }: { gameCode?: string; title?: string }) {
  const [page, setPage] = useState(0);
  const games = useGameList();
  const gameId = games.data?.find((game) => game.code === gameCode)?.id;
  const products = useProductSearch(
    { sort: "name", page, size: 20, ...(gameCode ? { gameId: gameId ? [gameId] : [] } : {}) },
    !gameCode || Boolean(gameId),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-5 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      {gameCode && games.isError ? (
        <ErrorState error={games.error} onRetry={() => void games.refetch()} />
      ) : gameCode && games.isSuccess && !gameId ? (
        <EmptyState title="ยังไม่มีสินค้าหมวดนี้" />
      ) : products.isPending ? (
        <p role="status" className="py-16 text-center text-muted-foreground">กำลังโหลดสินค้า...</p>
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => void products.refetch()} />
      ) : products.data.items.length === 0 ? (
        <EmptyState title="ยังไม่มีสินค้า" description="กลับมาดูสินค้าใหม่ภายหลัง" />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.data.items.map((product) => (
              <Link key={product.id} to={productHref(product.slug)} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
                <Card className="h-full gap-0 overflow-hidden py-0 shadow-none transition hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-4">
                    <div className="mb-4 flex h-52 items-center justify-center rounded-lg bg-muted/50">
                      {product.primaryImageUrl ? (
                        <img src={product.primaryImageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain" />
                      ) : <span className="text-sm text-muted-foreground">ยังไม่มีรูปสินค้า</span>}
                    </div>
                    <h2 className="font-semibold">{product.name}</h2>
                    {product.cardNumber && <p className="text-sm text-muted-foreground">{product.cardNumber}</p>}
                    <p className="mt-auto pt-3 font-semibold text-primary">{formatPrice(product.lowestPrice)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {products.data.totalPages > 1 && (
            <nav aria-label="หน้ารายการสินค้า" className="flex items-center justify-center gap-4">
              <Button variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>ก่อนหน้า</Button>
              <span>{page + 1} / {products.data.totalPages}</span>
              <Button variant="outline" disabled={page + 1 >= products.data.totalPages} onClick={() => setPage((value) => value + 1)}>ถัดไป</Button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
