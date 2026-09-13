import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
        success:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
        warning:
          "bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40",
        destructive:
          "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30",
        outline:
          "border border-border text-foreground/80 bg-background/50",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
