import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "@/components/common/ErrorState";
import { ApiError } from "@/lib/api";

describe("ErrorState", () => {
  it("renders default title and fallback message", () => {
    render(<ErrorState />);
    expect(screen.getByText(/โหลดข้อมูลไม่สำเร็จ/)).toBeInTheDocument();
    expect(screen.getByText(/ลองใหม่อีกครั้ง/)).toBeInTheDocument();
  });

  it("renders provided ApiError message", () => {
    const error = new ApiError({
      status: 404,
      code: "NOT_FOUND" as unknown,
      message: "Custom API Error Message"
    });
    
    render(<ErrorState error={error} />);
    expect(screen.getByText("Custom API Error Message")).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetryMock = vi.fn();
    const user = userEvent.setup();
    
    render(<ErrorState onRetry={onRetryMock} retryLabel="Try Again" />);
    
    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    await user.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("renders custom children", () => {
    render(
      <ErrorState>
        <button>Go Back</button>
      </ErrorState>
    );
    expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
  });
});
