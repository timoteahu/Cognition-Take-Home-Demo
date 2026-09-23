import { prisma } from "@internal-tools/framework";
import { AppShell, Badge, Card, PageHeader } from "@internal-tools/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });

  return (
    <AppShell title="Internal Tools">
      <PageHeader
        title="Internal Tools"
        description="Every internal tool registered on the platform. Click a tool to open it."
      />
      <div className="tool-grid">
        {tools.map((tool) => {
          const internal = tool.url?.startsWith("/") ?? false;
          const host = tool.url && !internal ? new URL(tool.url).host : null;
          return (
            <Card key={tool.id} href={tool.url ?? undefined}>
              <div className="card-title">{tool.name}</div>
              <div className="card-desc">{tool.description}</div>
              <div className="card-footer">
                {internal ? (
                  <Badge tone="info" mono>{tool.url}</Badge>
                ) : host ? (
                  <Badge tone="info" mono>{host}</Badge>
                ) : (
                  <Badge tone="neutral">not deployed</Badge>
                )}
                {tool.url ? <span className="accent-link">Open →</span> : null}
              </div>
            </Card>
          );
        })}
      </div>
      <h2 className="section-title">Shared platform</h2>
      <Card className="card-compact">
        <div className="card-desc">
          Every tool on this hub runs on the same{" "}
          <code>@internal-tools/framework</code>: one bearer-token auth layer,
          one set of role-based permissions, one audit trail, and one SQLite
          database. Resources are shared across all internal tools, so every
          record is protected the same way — the same dev tokens
          (<code>dev-viewer-token</code>, <code>dev-builder-token</code>,{" "}
          <code>dev-admin-token</code>) authorize reads and writes in every app.
        </div>
      </Card>
    </AppShell>
  );
}
