import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileDropzone } from "@/components/common/FileDropzone";

describe("FileDropzone", () => {
  it("renders children correctly", () => {
    render(
      <FileDropzone onFiles={vi.fn()}>
        <div>Drop here</div>
      </FileDropzone>
    );
    expect(screen.getByText("Drop here")).toBeInTheDocument();
  });

  it("handles click to open file dialog", async () => {
    const onFiles = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <FileDropzone onFiles={onFiles} id="test-dropzone">
        <div data-testid="drop-area">Drop here</div>
      </FileDropzone>
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    await user.click(screen.getByTestId("drop-area"));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("handles file input change", async () => {
    const onFiles = vi.fn();
    const user = userEvent.setup();

    render(
      <FileDropzone onFiles={onFiles} id="file-input">
        <label htmlFor="file-input">Upload</label>
      </FileDropzone>
    );

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByLabelText("Upload") as HTMLInputElement;

    await user.upload(input, file);
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("does not trigger click when disabled", async () => {
    const onFiles = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <FileDropzone onFiles={onFiles} disabled>
        <div data-testid="drop-area">Drop here</div>
      </FileDropzone>
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    await user.click(screen.getByTestId("drop-area"));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("handles drag and drop events", () => {
    const onFiles = vi.fn();
    render(
      <FileDropzone onFiles={onFiles}>
        <div data-testid="drop-area">Drop here</div>
      </FileDropzone>
    );

    const dropArea = screen.getByTestId("dropzone-container");

    // fireEvent used intentionally: userEvent does not support
    // drag-and-drop in jsdom (https://github.com/testing-library/user-event/issues/440)
    fireEvent.dragOver(dropArea);
    expect(dropArea).toHaveAttribute("data-dragging", "true");

    // Drag leave
    fireEvent.dragLeave(dropArea);
    expect(dropArea).not.toHaveAttribute("data-dragging");

    // Drop
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [file] }
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
    expect(dropArea).not.toHaveAttribute("data-dragging");
  });
});
