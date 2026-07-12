export default function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="card px-4 py-3 flex-1 min-w-[140px]">
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div
        className="text-2xl font-semibold mt-1"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
