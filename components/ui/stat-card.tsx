export function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "emerald" | "blue" | "amber" | "rose";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/80 text-emerald-900",
    blue: "border-blue-100 bg-blue-50/80 text-blue-900",
    amber: "border-amber-100 bg-amber-50/80 text-amber-900",
    rose: "border-rose-100 bg-rose-50/80 text-rose-900",
  };

  return (
    <section className={`rounded-lg border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-normal">{value}</p>
      {detail ? <p className="mt-1 text-sm opacity-75">{detail}</p> : null}
    </section>
  );
}
