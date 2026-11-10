import { Fragment, useState, type ComponentProps, type ReactNode } from "react";
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
  type CellData,
  type SortingState,
  type TableFeatures,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/lib/i18n";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ต้องประกาศ generic ให้ตรงกับของไลบรารี
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData> {
    /** class ของหัวคอลัมน์ เช่นความกว้าง */
    headClassName?: string;
    /** class ของทุก cell ในคอลัมน์ รวมแถวท้ายตาราง */
    cellClassName?: string;
  }
}

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

/**
 * เรียก template เป็นฟังก์ชันตรง ๆ แทน `FlexRender` ซึ่ง mount เป็น component —
 * คอลัมน์ที่ปิดค่า props ของหน้าได้ identity ใหม่ทุก render แล้ว cell จะถูก remount (เมนูที่เปิดอยู่ปิดเอง)
 * ดังนั้น `cell` ห้ามเรียก hook ตรง ๆ ถ้าต้องใช้ให้แยกเป็น component
 */
function renderTemplate(template: unknown, context: unknown): ReactNode {
  return typeof template === "function" ? (template as (context: unknown) => ReactNode)(context) : (template as ReactNode);
}

type DataTableProps<TData extends RowData> = {
  /** ประกาศนอก component หรือครอบ `useMemo` ถ้าทำได้ — ไม่งั้นตารางจะคำนวณใหม่ทุก render */
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
  /** class ของ `<table>` เช่น `min-w-[700px]` */
  tableClassName?: string;
  headerRowClassName?: string;
  bodyClassName?: string;
  rowClassName?: (row: TData) => string | undefined;
  /** attribute เพิ่มของแถว เช่น `data-*` */
  rowProps?: (row: TData) => ComponentProps<"tr">;
  footerRowClassName?: string;
  /** แถวเสริมเต็มความกว้างใต้แถวหลัก เช่นรายละเอียดที่กดขยาย · คืน `null` = ไม่มี */
  renderExpandedRow?: (row: TData) => ReactNode;
  expandedRowClassName?: (row: TData) => string | undefined;
  expandedCellClassName?: string;
  "aria-label"?: string;
  "aria-busy"?: boolean;
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
  emptyMessage,
  pageSize,
  onRowClick,
  className,
  tableClassName,
  headerRowClassName,
  bodyClassName,
  rowClassName,
  rowProps,
  footerRowClassName,
  renderExpandedRow,
  expandedRowClassName,
  expandedCellClassName,
  "aria-label": ariaLabel,
  "aria-busy": ariaBusy,
}: DataTableProps<TData>) {
  const { t } = useTranslate();
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
  const hasFooter = columns.some((column) => column.footer !== undefined);

  return (
    <div className={className}>
      <Table className={tableClassName} aria-label={ariaLabel} aria-busy={ariaBusy}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className={headerRowClassName}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const content = header.isPlaceholder ? null : renderTemplate(header.column.columnDef.header, header.getContext());
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.columnDef.meta?.headClassName}
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
        <TableBody className={bodyClassName}>
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
                {emptyMessage ?? t("states.noData", "ไม่มีข้อมูล")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const expanded = renderExpandedRow?.(row.original);
              return (
                <Fragment key={row.id}>
              <TableRow
                {...rowProps?.(row.original)}
                className={cn(onRowClick && "cursor-pointer", rowClassName?.(row.original))}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.columnDef.meta?.cellClassName}>
                    {renderTemplate(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
                  {expanded ? (
                    <TableRow className={cn("hover:bg-transparent", expandedRowClassName?.(row.original))}>
                      <TableCell colSpan={columnCount} className={expandedCellClassName}>
                        {expanded}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
        {hasFooter && !isLoading ? (
          <TableFooter>
            {table.getFooterGroups().map((group) => (
              <TableRow key={group.id} className={footerRowClassName}>
                {group.headers.map((header) => (
                  <TableCell key={header.id} className={header.column.columnDef.meta?.cellClassName}>
                    {renderTemplate(header.column.columnDef.footer, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        ) : null}
      </Table>

      {pageSize && !isLoading && table.getPageCount() > 1 ? (
        <div className="flex items-center justify-end gap-2 pt-3 text-sm">
          <span className="text-muted-foreground">
            {t("pagination.pageOf", "หน้า {page} จาก {total}", { page: table.state.pagination.pageIndex + 1, total: table.getPageCount() })}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            {t("actions.previous", "ก่อนหน้า")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            {t("actions.next", "ถัดไป")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
