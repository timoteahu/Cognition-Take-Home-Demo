import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "ok" | "warn" | "danger" | "info";

export function Badge({
  tone = "neutral",
  mono = false,
  children,
}: {
  tone?: BadgeTone;
  mono?: boolean;
  children: ReactNode;
}) {
  const cls = mono ? `badge badge-${tone} badge-mono` : `badge badge-${tone}`;
  return <span className={cls}>{children}</span>;
}
