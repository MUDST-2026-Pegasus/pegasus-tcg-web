import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { PaymentSteps } from "@/features/payment/components/PaymentSteps";
import type { FileUploadState, UploadItem } from "@/hooks/use-file-upload";
import { renderWithProviders } from "@/test/utils";

function uploadState(items: UploadItem[] = []) {
  return {
    items,
    addFiles: vi.fn(),
    remove: vi.fn(),
    retry: vi.fn(),
    clear: vi.fn(),
    objectKeys: items.flatMap((item) => item.objectKey ? [item.objectKey] : []),
    isUploading: items.some((item) => item.status === "uploading"),
    multiple: false,
    maxFiles: undefined,
    rule: {} as FileUploadState["rule"],
    accept: "image/png,image/jpeg,application/pdf",
    hint: "JPG, PNG or PDF",
  } as FileUploadState;
}

function fileItem(status: UploadItem["status"], overrides: Partial<UploadItem> = {}): UploadItem {
  return {
    id: "slip-1",
    file: new File(["slip"], "transfer.png", { type: "image/png" }),
    previewUrl: null,
    status,
    progress: status === "uploading" ? 45 : 100,
    objectKey: status === "done" ? "payments/slip.png" : null,
    error: status === "error" ? "อัปโหลดไม่สำเร็จ" : null,
    canRetry: status === "error",
    ...overrides,
  };
}

describe("PaymentSteps", () => {
  it("formats the amount from the payment API and reports reference edits", async () => {
    const onReferenceCodeChange = vi.fn();
    renderWithProviders(<PaymentSteps amount={1250.5} slip={uploadState()} referenceCode="" onReferenceCodeChange={onReferenceCodeChange} />, { language: "en" });

    expect(await screen.findByText(/Pay exactly THB 1,250\.50/)).toBeInTheDocument();
    fireEvent.change(await screen.findByRole("textbox", { name: "Transfer reference" }), { target: { value: "REF-42" } });
    expect(onReferenceCodeChange).toHaveBeenCalledWith("REF-42");
  });

  it("shows upload progress, retry controls, and the disabled submission state", async () => {
    const slip = uploadState([fileItem("uploading")]);
    const view = renderWithProviders(<PaymentSteps slip={slip} referenceCode="" onReferenceCodeChange={vi.fn()} />, { language: "en" });

    expect(await screen.findByText(/Pay exactly THB 13,200\.00/)).toBeInTheDocument();
    expect(await screen.findByText("Uploading...")).toBeInTheDocument();
    const retryable = uploadState([fileItem("error")]);
    view.rerender(<PaymentSteps slip={retryable} referenceCode="" onReferenceCodeChange={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("อัปโหลดไม่สำเร็จ");
    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));
    expect(retryable.retry).toHaveBeenCalledWith("slip-1");
    view.rerender(<PaymentSteps slip={retryable} referenceCode="" onReferenceCodeChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox", { name: "Transfer reference" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Retry upload" })).not.toBeInTheDocument();
  });

  it("shows an uploaded slip, preview, and remove action", async () => {
    const slip = uploadState([fileItem("done", { previewUrl: "https://example.test/slip.png" })]);
    renderWithProviders(<PaymentSteps slip={slip} referenceCode="ABC" onReferenceCodeChange={vi.fn()} />, { language: "en" });

    expect(await screen.findByRole("img", { name: "Slip preview" })).toHaveAttribute("src", "https://example.test/slip.png");
    expect(await screen.findByText("Ready")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Remove file" }));
    expect(slip.remove).toHaveBeenCalledWith("slip-1");
  });
});
