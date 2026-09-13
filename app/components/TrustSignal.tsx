import * as React from "react";

export function TrustSignal({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3.5 items-start p-3 rounded-2xl transition-colors hover:bg-muted/50 border border-transparent hover:border-border/60">
      <div className="mt-0.5 p-1.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-foreground leading-snug">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default TrustSignal;
