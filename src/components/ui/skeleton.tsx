import { cn } from "@/lib/utils"

type SkeletonProps = React.ComponentProps<"div"> & {
  tone?: "default" | "contrast"
}

function Skeleton({
  className,
  tone = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-2xl",
        tone === "contrast" ? "bg-muted-foreground/20" : "bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
