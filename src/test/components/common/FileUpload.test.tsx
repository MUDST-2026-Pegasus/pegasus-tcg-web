import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "@/components/common/FileUpload";
import type { FileUploadState } from "@/hooks/use-file-upload";

describe("FileUpload", () => {
  const mockUploadState = (overrides: Partial<FileUploadState> = {}): FileUploadState => ({
    items: [],
    addFiles: vi.fn(),
    remove: vi.fn(),
    retry: vi.fn(),
    clear: vi.fn(),
    objectKeys: [],
    isUploading: false,
    multiple: false,
    maxFiles: undefined,
    rule: {} as any,
    accept: "image/*",
    hint: "Upload an image",
    ...overrides,
  });

  it("renders upload area with default title and hint", () => {
    const upload = mockUploadState();
    render(<FileUpload upload={upload} />);
    
    expect(screen.getByText("ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์")).toBeInTheDocument();
    expect(screen.getByText("Upload an image")).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    const upload = mockUploadState();
    render(
      <FileUpload
        upload={upload}
        title="Upload your avatar"
        description="Must be a square image"
      />
    );
    
    expect(screen.getByText("Upload your avatar")).toBeInTheDocument();
    expect(screen.getByText(/Must be a square image/)).toBeInTheDocument();
  });

  it("renders uploading items", () => {
    const upload = mockUploadState({
      items: [
        {
          id: "item1",
          file: new File([""], "test.png"),
          previewUrl: "blob:test",
          status: "uploading",
          progress: 0.5,
          objectKey: null,
          error: null,
          canRetry: false,
        },
      ],
    });

    render(<FileUpload upload={upload} />);
    expect(screen.getByText("test.png")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders error items with retry button if applicable", () => {
    const upload = mockUploadState({
      items: [
        {
          id: "item1",
          file: new File([""], "fail.png"),
          previewUrl: null,
          status: "error",
          progress: 0,
          objectKey: null,
          error: "Upload failed",
          canRetry: true,
        },
      ],
    });

    render(<FileUpload upload={upload} />);
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ลองใหม่/ })).toBeInTheDocument();
  });

  it("calls remove when delete button is clicked", async () => {
    const removeMock = vi.fn();
    const upload = mockUploadState({
      remove: removeMock,
      items: [
        {
          id: "item1",
          file: new File([""], "done.png"),
          previewUrl: null,
          status: "done",
          progress: 1,
          objectKey: "done.png",
          error: null,
          canRetry: false,
        },
      ],
    });

    const user = userEvent.setup();
    render(<FileUpload upload={upload} />);
    
    const removeBtn = screen.getByRole("button", { name: /ลบ done.png/i });
    await user.click(removeBtn);
    
    expect(removeMock).toHaveBeenCalledWith("item1");
  });

  it("calls retry when retry button is clicked", async () => {
    const retryMock = vi.fn();
    const upload = mockUploadState({
      retry: retryMock,
      items: [
        {
          id: "item1",
          file: new File([""], "fail.png"),
          previewUrl: null,
          status: "error",
          progress: 0,
          objectKey: null,
          error: "Failed",
          canRetry: true,
        },
      ],
    });

    const user = userEvent.setup();
    render(<FileUpload upload={upload} />);
    
    const retryBtn = screen.getByRole("button", { name: /ลองใหม่/i });
    await user.click(retryBtn);
    
    expect(retryMock).toHaveBeenCalledWith("item1");
  });
});
