type Tone = "green" | "yellow" | "red" | "gray" | "blue";

const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-indigo-50 text-indigo-700",
};

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
