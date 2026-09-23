import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  hubUrl,
  children,
}: {
  title: string;
  subtitle?: string;
  hubUrl?: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="app-shell-bar">
        <div className="app-shell-bar-inner">
          <div className="app-shell-left">
            {hubUrl ? (
              <a className="hub-link" href={hubUrl}>
                ← All tools
              </a>
            ) : null}
            <span className="app-shell-title">{title}</span>
            {subtitle ? (
              <span className="app-shell-subtitle">{subtitle}</span>
            ) : null}
          </div>
          <span className="env-badge">dev</span>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
