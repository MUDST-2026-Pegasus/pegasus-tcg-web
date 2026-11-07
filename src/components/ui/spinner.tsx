import { translate, useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  useLanguage();
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label={translate("กำลังโหลด", "Loading")} className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
