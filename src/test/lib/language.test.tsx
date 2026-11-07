import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageSwitch } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getLanguage, setLanguage } from "@/lib/language";

afterEach(() => {
  vi.restoreAllMocks();
  setLanguage("en");
  localStorage.removeItem("pegasus.language");
});

describe("language selection", () => {
  it("changes visible shared text and remembers the selected language", () => {
    setLanguage("en");
    render(<MemoryRouter><LanguageSwitch /><Footer /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch to Thai" }));
    expect(screen.getByRole("link", { name: "นโยบายความเป็นส่วนตัว" })).toBeInTheDocument();
    expect(localStorage.getItem("pegasus.language")).toBe("th");
    expect(document.documentElement.lang).toBe("th");
    fireEvent.click(screen.getByRole("button", { name: "เปลี่ยนภาษาเป็นอังกฤษ" }));
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("still switches when local storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => setLanguage("th")).not.toThrow();
    expect(getLanguage()).toBe("th");
  });
});
