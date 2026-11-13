import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { I18nProvider } from "@/lib/i18n";
import { LanguageSwitch } from "@/lib/i18n/LanguageSwitch";

const STORAGE_KEY = "__tolgee_currentLanguage";

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  document.documentElement.lang = "th";
});

describe("LanguageSwitch [TCG-562]", () => {
  it("is a keyboard switch that flips TH ⇄ EN, updates <html lang> and remembers the choice", async () => {
    const user = userEvent.setup();
    render(<I18nProvider><LanguageSwitch /></I18nProvider>);

    const toggle = await screen.findByRole("switch", { name: "ภาษาอังกฤษ / English" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    toggle.focus();
    await user.keyboard(" ");
    const enToggle = await screen.findByRole("switch", { name: "English / ภาษาอังกฤษ" });
    expect(enToggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");

    await user.click(enToggle);
    expect(await screen.findByRole("switch", { name: "ภาษาอังกฤษ / English" })).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.lang).toBe("th");
  });
});
