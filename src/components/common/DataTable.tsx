import { useState, type ReactNode } from "react";
import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROWS = 5;

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
  paginatedRowModel: createPaginatedRowModel(),
});

/** type ของคอลัมน์สำหรับ `DataTable` — `const columns: DataTableColumn<Row>[] = [...]` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- แต่ละคอลัมน์มี value คนละชนิด
export type DataTableColumn<TData extends RowData> = ColumnDef<typeof features, TData, any>;

type DataTableProps<TData extends RowData> = {
  /** ประกาศนอก component หรือครอบ `useMemo` ไม่งั้นตารางจะคำนวณใหม่ทุก render */
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** ใส่เมื่อแถวสลับลำดับ/ถูกลบได้ เพื่อให้ React จำแถวเดิมถูก */
  getRowId?: (row: TData) => string;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  /** แบ่งหน้าฝั่ง client · ไม่ใส่ = แสดงทุกแถว (เช่นหน้าที่แบ่งหน้าจาก API เอง) */
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  className?: string;
};

/**
 * ตารางกลางบน TanStack Table — เรียงลำดับเปิดเป็นรายคอลัมน์ด้วย `enableSorting: true`
 * ถ้าข้อมูลแบ่งหน้าหรือเรียงจาก API ให้ไม่ส่ง `pageSize` แล้ววาง `Pagination` ใต้ตารางเอง
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  isLoading = false,
  emptyMessage = "ไม่มีข้อมูล",
  pageSize,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useTable<typeof features, TData>({
    features,
    columns,
    data,
    getRowId: getRowId ? (row: TData) => getRowId(row) : undefined,
    state: { sorting },
    onSortingChange: setSorting,
    defaultColumn: { enableSorting: false },
    manualPagination: !pageSize,
    initialState: { pagination: { pageIndex: 0, pageSize: pageSize ?? 10 } },
  });

  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const content = header.isPlaceholder ? null : <table.FlexRender header={header} />;
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    aria-sort={
                      !header.column.getCanSort()
                        ? undefined
                        : sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : "none"
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {content}
                        {sorted === "asc" ? (
                          <ArrowUp aria-hidden className="size-3.5" />
                        ) : sorted === "desc" ? (
                          <ArrowDown aria-hidden className="size-3.5" />
                        ) : (
                          <ChevronsUpDown aria-hidden className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                    ) : (
                      content
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
              <TableRow key={rowIndex} data-testid="data-table-skeleton">
                {Array.from({ length: columnCount }, (_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pageSize && !isLoading && table.getPageCount() > 1 ? (
        <div className="flex items-center justify-end gap-2 pt-3 text-sm">
          <span className="text-muted-foreground">
            หน้า {table.state.pagination.pageIndex + 1} จาก {table.getPageCount()}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            ก่อนหน้า
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            ถัดไป
          </Button>
        </div>
      ) : null}
    </div>
  );
}
