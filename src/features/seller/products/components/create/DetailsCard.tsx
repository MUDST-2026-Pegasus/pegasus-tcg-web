import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type {
  ListingDraft,
  ListingOptionId,
  ProductCreateData,
} from "../../product-create.types";

type DetailsCardProps = ProductCreateData["details"] & {
  description: string;
  onDescriptionChange: (value: string) => void;
  optionValues: ListingDraft["options"];
  onOptionChange: (id: ListingOptionId, enabled: boolean) => void;
};

export function DetailsCard({
  title,
  placeholder,
  options,
  description,
  onDescriptionChange,
  optionValues,
  onOptionChange,
}: DetailsCardProps) {
  return (
    <Card className="w-full gap-3.5 rounded-xl border border-border p-5 shadow-none ring-0">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>

      <Textarea
        aria-label={title}
        placeholder={placeholder}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        className="min-h-20 rounded-lg border-input bg-background px-2.5 py-2 text-sm placeholder:text-gray-400"
      />

      {options.map((option) => (
        <div
          key={option.id}
          className="flex items-center gap-3.5 rounded-lg border border-gray-100 bg-neutral-50 px-3.5 py-3"
        >
          <div className="flex flex-1 flex-col gap-[3px]">
            <p className="text-xs font-medium text-zinc-950">{option.title}</p>
            <p className="text-xs text-gray-500">{option.description}</p>
          </div>
          <Switch
            aria-label={option.title}
            checked={optionValues[option.id]}
            onCheckedChange={(checked) => onOptionChange(option.id, checked)}
            disabled={!option.available}
          />
        </div>
      ))}
    </Card>
  );
}
