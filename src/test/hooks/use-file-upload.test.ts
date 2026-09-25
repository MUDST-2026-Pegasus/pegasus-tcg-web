import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileUpload } from "@/hooks/use-file-upload";
import * as uploadLib from "@/lib/upload";

vi.mock("@/lib/upload", () => {
  return {
    UPLOAD_RULES: {
      TEST_PURPOSE: {
        maxBytes: 1024,
        allowedTypes: ["image/jpeg"],
      }
    },
    acceptFor: vi.fn(() => "image/jpeg"),
    describeRule: vi.fn(() => "hint string"),
    uploadFile: vi.fn(),
    validateFile: vi.fn(),
    uploadErrorMessage: vi.fn(),
  };
});

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => "blob:test");
global.URL.revokeObjectURL = vi.fn();

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize correctly", () => {
    const { result } = renderHook(() =>
      useFileUpload({ purpose: "TEST_PURPOSE" as unknown })
    );

    expect(result.current.items).toEqual([]);
    expect(result.current.objectKeys).toEqual([]);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.multiple).toBe(false);
    expect(result.current.accept).toBe("image/jpeg");
    expect(result.current.hint).toBe("hint string");
  });

  it("should handle addFiles rejecting invalid file", () => {
    vi.mocked(uploadLib.validateFile).mockReturnValue("Invalid file type");

    const { result } = renderHook(() =>
      useFileUpload({ purpose: "TEST_PURPOSE" as unknown })
    );

    act(() => {
      const file = new File(["dummy content"], "test.txt", { type: "text/plain" });
      result.current.addFiles([file]);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].status).toBe("error");
    expect(result.current.items[0].error).toBe("Invalid file type");
  });

  it("should handle addFiles success path", async () => {
    vi.mocked(uploadLib.validateFile).mockReturnValue(null);
    let resolveUpload: (value: string) => void;
    vi.mocked(uploadLib.uploadFile).mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );

    const { result } = renderHook(() =>
      useFileUpload({ purpose: "TEST_PURPOSE" as unknown })
    );

    const file = new File(["dummy image"], "test.jpg", { type: "image/jpeg" });
    
    act(() => {
      result.current.addFiles([file]);
    });

    expect(result.current.items[0].status).toBe("uploading");
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolveUpload("object-key-123");
    });

    expect(result.current.items[0].status).toBe("done");
    expect(result.current.items[0].objectKey).toBe("object-key-123");
    expect(result.current.objectKeys).toEqual(["object-key-123"]);
    expect(result.current.isUploading).toBe(false);
  });

  it("should clear items on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useFileUpload({ purpose: "TEST_PURPOSE" as unknown })
    );

    vi.mocked(uploadLib.validateFile).mockReturnValue(null);
    vi.mocked(uploadLib.uploadFile).mockReturnValue(new Promise(() => {})); // Never resolves

    const file = new File(["dummy image"], "test.jpg", { type: "image/jpeg" });
    act(() => {
      result.current.addFiles([file]);
    });

    expect(result.current.items).toHaveLength(1);

    unmount();
    
    // RevokeObjectURL should be called
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
