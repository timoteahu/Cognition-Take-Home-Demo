import type { BadgeTone } from "./badge";

export type Stat = {
  label: string;
  value: string | number;
  tone?: BadgeTone;
};

const toneColor: Record<BadgeTone, string> = {
  neutral: "var(--fg)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  info: "var(--info)",
};

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="stat-grid">
      {stats.map((s) => (
        <div className="card" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div
            className="stat-value"
            style={s.tone ? { color: toneColor[s.tone] } : undefined}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
