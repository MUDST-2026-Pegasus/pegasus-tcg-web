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

  it("keeps cell state when columns get a new identity on re-render", async () => {
    const make = (): DataTableColumn<Row>[] => [{ id: "input", header: "ช่อง", cell: () => <input aria-label="ช่อง" /> }];
    const { rerender } = render(<DataTable columns={make()} data={data.slice(0, 1)} />);
    const input = screen.getByLabelText("ช่อง");
    await userEvent.type(input, "abc");
    rerender(<DataTable columns={make()} data={data.slice(0, 1)} />);
    expect(screen.getByLabelText("ช่อง")).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveValue("abc");
  });

  it("renders the footer, column classes and expanded rows", () => {
    const withFooter: DataTableColumn<Row>[] = [
      { accessorKey: "name", header: "ชื่อ", footer: () => "รวม", meta: { cellClassName: "name-cell", headClassName: "name-head" } },
    ];
    render(<DataTable columns={withFooter} data={data} renderExpandedRow={(row) => (row.name === "B" ? "รายละเอียด B" : null)} />);
    expect(screen.getByText("รวม")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "ชื่อ" })).toHaveClass("name-head");
    expect(screen.getByRole("cell", { name: "A" })).toHaveClass("name-cell");
    expect(screen.getByRole("cell", { name: "รายละเอียด B" })).toHaveAttribute("colspan", "1");
    expect(screen.getAllByText(/รายละเอียด/)).toHaveLength(1);
  });
});
