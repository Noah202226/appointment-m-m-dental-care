function TrustSignal({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-xs font-black text-zinc-800">{title}</p>
        <p className="text-[11px] text-zinc-500 leading-tight">{desc}</p>
      </div>
    </div>
  );
}

export default TrustSignal;
