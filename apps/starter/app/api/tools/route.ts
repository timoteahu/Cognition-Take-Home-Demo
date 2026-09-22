import { logAudit, prisma, withAuth } from "@internal-tools/framework";

// Demonstrates the shared framework contract: any route can opt into
// bearer auth + permission checks with one wrapper.

export const GET = withAuth("tools:read", async () => {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });
  return Response.json({ tools });
});

export const POST = withAuth("tools:write", async (request, user) => {
  const body = (await request.json()) as { name?: string; description?: string };
  if (!body.name || !body.description) {
    return Response.json(
      { error: "name and description are required" },
      { status: 400 },
    );
  }
  const existing = await prisma.tool.findUnique({ where: { name: body.name } });
  if (existing) {
    return Response.json({ error: "a tool with that name exists" }, { status: 409 });
  }
  const tool = await prisma.tool.create({
    data: { name: body.name, description: body.description },
  });
  await logAudit({
    actorId: user.id,
    action: "tool.create",
    entity: "Tool",
    entityId: String(tool.id),
    metadata: { name: tool.name },
  });
  return Response.json({ tool }, { status: 201 });
});
