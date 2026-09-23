import type { ReactNode } from "react";

export function Meta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `meta ${className}` : "meta"}>{children}</div>
  );
}
