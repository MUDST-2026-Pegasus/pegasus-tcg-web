import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { addRecentSearch } from "./search-history";
import { searchHref, type SearchOption } from "./search-options";

export type NavbarSearchState = ReturnType<typeof useNavbarSearch>;

/** state ที่ช่องค้นหา desktop กับ mobile ใช้ร่วมกัน — Navbar เรียกครั้งเดียวแล้วส่งให้ทั้งสองช่อง */
export function useNavbarSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(null);
  const query = draft?.key === location.key ? draft.value : (searchParams.get("q") ?? "");
  const setQuery = (value: string) => setDraft({ key: location.key, value });
  const [openAt, setOpenAt] = useState<{ key: string; mode: "popover" | "screen" } | null>(null);
  const mode = openAt?.key === location.key ? openAt.mode : null;
  const open = (next: "popover" | "screen") => setOpenAt({ key: location.key, mode: next });
  const close = () => setOpenAt(null);

  const hrefFor = (term: string, extra?: Record<string, string>) =>
    searchHref(term, { pathname: location.pathname, params: searchParams }, extra);

  const go = (href: string, term?: string) => {
    if (term) addRecentSearch(term);
    close();
    navigate(href);
  };
  return {
    query,
    setQuery,
    mode,
    open,
    close,
    hrefFor,
    select: (option: SearchOption) => go(option.href, option.term),
    submit: (event: FormEvent) => {
      event.preventDefault();
      go(hrefFor(query), query.trim());
    },
  };
}
