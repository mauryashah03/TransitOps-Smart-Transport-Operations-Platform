const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: "rgba(62,201,122,0.12)", text: "#3ec97a", dot: "#3ec97a" },
  on_trip: { bg: "rgba(76,141,255,0.12)", text: "#4c8dff", dot: "#4c8dff" },
  in_shop: { bg: "rgba(224,161,63,0.12)", text: "#e0a13f", dot: "#e0a13f" },
  retired: { bg: "rgba(230,90,90,0.12)", text: "#e65a5a", dot: "#e65a5a" },
  off_duty: { bg: "rgba(125,132,148,0.15)", text: "#9199a8", dot: "#9199a8" },
  suspended: { bg: "rgba(224,161,63,0.12)", text: "#e0a13f", dot: "#e0a13f" },
  draft: { bg: "rgba(125,132,148,0.15)", text: "#9199a8", dot: "#9199a8" },
  dispatched: { bg: "rgba(76,141,255,0.12)", text: "#4c8dff", dot: "#4c8dff" },
  completed: { bg: "rgba(62,201,122,0.12)", text: "#3ec97a", dot: "#3ec97a" },
  cancelled: { bg: "rgba(230,90,90,0.12)", text: "#e65a5a", dot: "#e65a5a" },
  active: { bg: "rgba(224,161,63,0.12)", text: "#e0a13f", dot: "#e0a13f" },
  closed: { bg: "rgba(62,201,122,0.12)", text: "#3ec97a", dot: "#3ec97a" },
};

const LABEL_MAP: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  in_shop: "In Shop",
  retired: "Retired",
  off_duty: "Off Duty",
  suspended: "Suspended",
  draft: "Draft",
  dispatched: "Dispatched",
  completed: "Completed",
  cancelled: "Cancelled",
  active: "Active",
  closed: "Closed",
};

export default function StatusBadge({ status }: { status: string }) {
  const colors = COLOR_MAP[status] ?? COLOR_MAP.draft;
  return (
    <span className="badge" style={{ background: colors.bg, color: colors.text }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: colors.dot,
          display: "inline-block",
        }}
      />
      {LABEL_MAP[status] ?? status}
    </span>
  );
}
