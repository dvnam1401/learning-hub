type Tone = "green" | "yellow" | "red" | "gray" | "blue";

const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  yellow: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  gray: "bg-accent text-muted",
  blue: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
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
