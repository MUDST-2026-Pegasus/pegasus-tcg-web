import { listingText as t } from "@/lib/listing-detail.messages";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CONDITION_LABELS } from "../catalog.mappers";
import type { CardCondition } from "../catalog.types";
export function ConditionGuide({ condition }: { condition: CardCondition }) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="link" size="sm" className="ml-auto px-0" />}
      >
        {t.conditionGuide}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t.conditionGuideTitle}</DialogTitle>
        <dl className="space-y-3">
          {Object.entries(CONDITION_LABELS).map(([key, label]) => (
            <div
              key={key}
              className={key === condition ? "font-semibold text-primary" : ""}
            >
              <dt>{key}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
