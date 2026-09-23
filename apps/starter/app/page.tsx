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
          const host = tool.url ? new URL(tool.url).host : null;
          return (
            <Card key={tool.id} href={tool.url ?? undefined}>
              <div className="card-title">{tool.name}</div>
              <div className="card-desc">{tool.description}</div>
              <div className="card-footer">
                {host ? (
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
    </AppShell>
  );
}
