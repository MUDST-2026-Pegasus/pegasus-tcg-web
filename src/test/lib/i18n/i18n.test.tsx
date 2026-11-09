import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { NotFoundPage } from "@/features/not-found/pages/NotFoundPage";
import { createTolgee, formatDate, I18nProvider, useLanguage, useTranslate } from "@/lib/i18n";
import { renderWithProviders } from "@/test/utils";

const STORAGE_KEY = "__tolgee_currentLanguage";

function LanguageProbe() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslate();
  return (
    <>
      <output>{language}</output>
      <p>{t("nav.loginHint")}</p>
      <button type="button" onClick={() => void setLanguage("en")}>en</button>
    </>
  );
}

// ไม่ได้ subscribe ภาษาเอง — ได้ภาษาใหม่เพราะ I18nProvider remount
function PlainDate() {
  return <time>{formatDate("2026-10-19T07:05:00Z")}</time>;
}

function LazyNamespace() {
  const { t } = useTranslate("buyer");
  return <h1>{t("notFound.title")}</h1>;
}

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  document.documentElement.lang = "th";
});

describe("i18n setup", () => {
  it("defaults to Thai and syncs <html lang>", async () => {
    render(<I18nProvider><LanguageProbe /></I18nProvider>);
    expect(await screen.findByText("เข้าสู่ระบบเพื่อดูคำสั่งซื้อและคอลเลกชันของคุณ")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("th");
    expect(document.documentElement.lang).toBe("th");
  });

  it("switches language, updates <html lang> and remembers it after reload", async () => {
    const first = render(<I18nProvider><LanguageProbe /></I18nProvider>);
    const button = await screen.findByRole("button", { name: "en" });
    await act(async () => button.click());
    expect(await screen.findByText("Log in to see your orders and collection")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
    first.unmount();

    // reload = instance ใหม่อ่านภาษาที่จำไว้
    render(<I18nProvider><LanguageProbe /></I18nProvider>);
    expect(await screen.findByText("Log in to see your orders and collection")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("en");
  });

  it("suspends a lazy namespace into the nearest Suspense, keeping the layout and never showing raw keys", async () => {
    const tolgee = createTolgee({ language: "th", live: false });
    const seen = new Set<string>();
    const observer = new MutationObserver(() => seen.add(document.body.textContent ?? ""));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    render(
      <I18nProvider tolgee={tolgee}>
        <LanguageProbe />
        <Suspense fallback={<p>page-skeleton</p>}>
          <LazyNamespace />
        </Suspense>
      </I18nProvider>,
    );
    expect(await screen.findByRole("heading", { name: "ไม่พบหน้าที่คุณกำลังหา" })).toBeInTheDocument();
    observer.disconnect();
    expect([...seen].some((text) => text.includes("notFound.title"))).toBe(false);
  });

  it("renderWithProviders renders in the requested language", () => {
    renderWithProviders(<NotFoundPage />, { language: "en" });
    expect(screen.getByRole("heading", { name: "We couldn't find that page" })).toBeInTheDocument();
  });

  it("remounts on language change so plain format helpers switch too", async () => {
    render(<I18nProvider><LanguageProbe /><PlainDate /></I18nProvider>);
    expect(await screen.findByText("19 ต.ค. 2569")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "en" });
    await act(async () => button.click());
    expect(await screen.findByText("19 Oct 2026")).toBeInTheDocument();
  });
});
