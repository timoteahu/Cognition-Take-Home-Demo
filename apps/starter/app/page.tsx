import { prisma } from "@internal-tools/framework";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });

  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Internal Tools</h1>
      <p style={{ color: "#666" }}>
        Starter app — tools are loaded from SQLite via Prisma.
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tools.map((tool) => (
          <li
            key={tool.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 8,
            }}
          >
            <strong>{tool.name}</strong>
            <div style={{ color: "#666", fontSize: 14 }}>{tool.description}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
