import { ClaimTicket } from "./ClaimTicket";
import { claimTicketState, type ClaimTicketState } from "./claim.format";
import type { ClaimableCode, ClaimSource } from "./claim.types";
import { useClaimFlow } from "./useClaimFlow";
import { useTranslate } from "@/lib/i18n";

export interface ClaimTicketRailProps {
  codes: ClaimableCode[];
  source: ClaimSource;
  /** A shop on its own store page sees its codes without buttons. */
  ownerView?: boolean;
}

const ORDER: Record<ClaimTicketState, number> = { claimable: 0, claimed: 1, soldOut: 2 };

/**
 * Tickets 292 px wide — four fill the 1216 px row on the home page, more
 * scroll sideways. Claimable first, then collected, sold out last (H1).
 */
export function ClaimTicketRail({ codes, source, ownerView = false }: ClaimTicketRailProps) {
  const { t } = useTranslate("promotions");
  const { claim, claimingId, openTerms, dialogs } = useClaimFlow(source, { ownerView });
  const ordered = [...codes].sort((a, b) => ORDER[claimTicketState(a)] - ORDER[claimTicketState(b)]);

  return (
    <>
      <ul className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pt-2.5 pb-3" aria-label={t("buyer.claimTicketRail.ariaLabel", "โค้ดส่วนลด")}>
        {ordered.map((code) => (
          <li key={code.id} className="w-[292px] shrink-0 snap-start">
            <ClaimTicket
              promotion={code}
              hideAction={ownerView}
              claiming={claimingId === code.id}
              onClaim={() => claim(code)}
              onOpenTerms={() => openTerms(code.code)}
            />
          </li>
        ))}
      </ul>
      {dialogs}
    </>
  );
}
