const PENDING_CLAIM_KEY = "pegasus.promotions.pendingClaim";

/** Only same-site paths, so `?next=` can't send someone off to another site. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}

/** M3 "เข้าสู่ระบบเพื่อเก็บโค้ด": `/login?next=<this page>&claim=<id>`. */
export function claimAuthUrl(page: "/login" | "/register", next: string, promotionId: number): string {
  const params = new URLSearchParams({ next, claim: String(promotionId) });
  return `${page}?${params.toString()}`;
}

type FromState = { from?: { pathname?: string; search?: string } } | null;

/** Where to land after signing in: `?next=`, else the page RequireAuth bounced from, else home. */
export function authRedirectTarget(search: string, state: unknown, fallback = "/"): string {
  const next = safeNextPath(new URLSearchParams(search).get("next"));
  if (next) return next;
  const from = (state as FromState)?.from;
  return from?.pathname ? `${from.pathname}${from.search ?? ""}` : fallback;
}

/** Called once the buyer is signed in; the claim itself runs on the page they return to. */
export function rememberPendingClaim(search: string) {
  const id = Number(new URLSearchParams(search).get("claim"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    sessionStorage.setItem(PENDING_CLAIM_KEY, String(id));
  } catch {
    // Storage blocked: the buyer can still press เก็บโค้ด again.
  }
}

export function takePendingClaim(): number | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CLAIM_KEY);
    sessionStorage.removeItem(PENDING_CLAIM_KEY);
    const id = Number(raw);
    return raw && Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
