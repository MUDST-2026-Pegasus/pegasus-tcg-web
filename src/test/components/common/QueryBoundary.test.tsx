import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryBoundary } from "@/components/common/QueryBoundary";

describe("QueryBoundary", () => {
  const mockRefetch = vi.fn();

  const getQueryMock = (overrides: any) => ({
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
    ...overrides,
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state when isPending is true", () => {
    render(
      <QueryBoundary query={getQueryMock({ isPending: true })} loading={<div data-testid="custom-loading" />}>
        {() => <div>Data</div>}
      </QueryBoundary>
    );
    expect(screen.getByTestId("custom-loading")).toBeInTheDocument();
  });

  it("renders default loading state when no custom loading is provided", () => {
    render(
      <QueryBoundary query={getQueryMock({ isPending: true })}>
        {() => <div>Data</div>}
      </QueryBoundary>
    );
    expect(screen.getAllByRole("status")[0]).toBeInTheDocument();
  });

  it("renders ErrorState when data is undefined and not pending", () => {
    render(
      <QueryBoundary 
        query={getQueryMock({ isPending: false, error: new Error("Failed to fetch"), data: undefined })}
        errorTitle="Custom Error Title"
      >
        {() => <div>Data</div>}
      </QueryBoundary>
    );
    expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
  });

  it("calls refetch on ErrorState retry", async () => {
    const user = userEvent.setup();
    render(
      <QueryBoundary query={getQueryMock({ isPending: false, data: undefined })}>
        {() => <div>Data</div>}
      </QueryBoundary>
    );
    
    const retryBtn = screen.getByRole("button");
    await user.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when isEmpty returns true", () => {
    render(
      <QueryBoundary 
        query={getQueryMock({ data: [] })} 
        isEmpty={(data) => data.length === 0}
        empty={<div data-testid="empty-state">No Data</div>}
      >
        {() => <div>Data</div>}
      </QueryBoundary>
    );
    
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders children with data when successful", () => {
    render(
      <QueryBoundary query={getQueryMock({ data: ["apple", "banana"] })}>
        {(data) => <div>Items: {data.length}</div>}
      </QueryBoundary>
    );
    
    expect(screen.getByText("Items: 2")).toBeInTheDocument();
  });
});
