import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

type Row = { name: string; qty: number };
const columns: DataTableColumn<Row>[] = [
  { accessorKey: "name", header: "ชื่อ" },
  { accessorKey: "qty", header: "จำนวน", enableSorting: true },
];
const data: Row[] = [
  { name: "A", qty: 2 },
  { name: "B", qty: 3 },
  { name: "C", qty: 1 },
];
const firstCells = () => screen.getAllByRole("row").slice(1).map((row) => row.querySelector("td")?.textContent);

describe("DataTable", () => {
  it("renders rows in the given order", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(firstCells()).toEqual(["A", "B", "C"]);
  });

  it("sorts only columns that opt in", async () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryByRole("button", { name: "ชื่อ" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "จำนวน" }));
    const header = screen.getByRole("columnheader", { name: "จำนวน" });
    const direction = header.getAttribute("aria-sort");
    expect(firstCells()).toEqual(direction === "ascending" ? ["C", "A", "B"] : ["B", "A", "C"]);
  });

  it("paginates on the client", async () => {
    render(<DataTable columns={columns} data={data} pageSize={2} />);
    expect(firstCells()).toEqual(["A", "B"]);
    await userEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
    expect(firstCells()).toEqual(["C"]);
    expect(screen.getByRole("button", { name: "ถัดไป" })).toBeDisabled();
  });

  it("hides pagination when everything fits", () => {
    render(<DataTable columns={columns} data={data} pageSize={10} />);
    expect(screen.queryByRole("button", { name: "ถัดไป" })).not.toBeInTheDocument();
  });

  it("shows empty and loading states", () => {
    const { rerender } = render(<DataTable columns={columns} data={[]} emptyMessage="ว่าง" />);
    expect(screen.getByText("ว่าง")).toBeInTheDocument();
    rerender(<DataTable columns={columns} data={[]} isLoading emptyMessage="ว่าง" />);
    expect(screen.queryByText("ว่าง")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("data-table-skeleton")).toHaveLength(5);
  });

  it("reports row clicks", async () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    await userEvent.click(screen.getByText("B"));
    expect(onRowClick).toHaveBeenCalledWith(data[1]);
  });
});
