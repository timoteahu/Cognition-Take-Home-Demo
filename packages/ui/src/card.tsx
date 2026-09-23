import type { ReactNode } from "react";

export function Card({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const cls = className ? `card ${className}` : "card";
  if (href) {
    return (
      <a className={cls} href={href}>
        {children}
      </a>
    );
  }
  return <div className={cls}>{children}</div>;
}
