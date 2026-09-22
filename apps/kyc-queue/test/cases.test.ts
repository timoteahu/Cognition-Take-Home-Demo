import { afterAll, describe, expect, it } from "vitest";

import { authedRequest, prisma } from "@internal-tools/framework";
import { GET, POST } from "../app/api/cases/route";
import { GET as GET_CASE, PATCH } from "../app/api/cases/[id]/route";

const ctx = (params: Record<string, string>) => ({
  params: Promise.resolve(params),
});

const createdCaseIds: number[] = [];
const customerId = () => `test-${crypto.randomUUID()}`;

async function createCase(id = customerId()) {
  const res = await POST(
    authedRequest("http://x/api/cases", "dev-builder-token", {
      method: "POST",
      body: JSON.stringify({ customerId: id, customerName: "Test Customer" }),
    }),
    {},
  );
  const body = await res.json();
  if (body.case) createdCaseIds.push(body.case.id);
  return { res, body };
}

afterAll(async () => {
  await prisma.auditEvent.deleteMany({
    where: { entity: "KycCase", entityId: { in: createdCaseIds.map(String) } },
  });
  await prisma.kycCase.deleteMany({ where: { id: { in: createdCaseIds } } });
  await prisma.$disconnect();
});

describe("GET /api/cases", () => {
  it("returns 401 without a token", async () => {
    const res = await GET(new Request("http://x/api/cases"), {});
    expect(res.status).toBe(401);
  });

  it("lists cases for a viewer", async () => {
    await createCase();
    const res = await GET(authedRequest("http://x/api/cases", "dev-viewer-token"), {});
    expect(res.status).toBe(200);
    const { cases } = await res.json();
    expect(cases.length).toBeGreaterThan(0);
  });
});

describe("POST /api/cases", () => {
  it("returns 403 for a viewer", async () => {
    const res = await POST(
      authedRequest("http://x/api/cases", "dev-viewer-token", {
        method: "POST",
        body: JSON.stringify({ customerId: customerId(), customerName: "Nope" }),
      }),
      {},
    );
    expect(res.status).toBe(403);
  });

  it("creates a case and writes an audit event", async () => {
    const { res, body } = await createCase();
    expect(res.status).toBe(201);
    expect(body.case.status).toBe("pending");
    const audit = await prisma.auditEvent.findFirst({
      where: { entity: "KycCase", entityId: String(body.case.id) },
    });
    expect(audit?.action).toBe("kyc_case.create");
    expect(audit?.actorId).toBe("u-builder");
  });

  it("returns 409 when an open case exists for the customer", async () => {
    const id = customerId();
    await createCase(id);
    const { res } = await createCase(id);
    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/cases/[id]", () => {
  it("approves a pending case and audits the decision", async () => {
    const { body } = await createCase();
    const res = await PATCH(
      authedRequest(`http://x/api/cases/${body.case.id}`, "dev-builder-token", {
        method: "PATCH",
        body: JSON.stringify({ decision: "approve" }),
      }),
      ctx({ id: String(body.case.id) }),
    );
    expect(res.status).toBe(200);
    const { case: updated } = await res.json();
    expect(updated.status).toBe("approved");
    expect(updated.decidedById).toBe("u-builder");
    const audit = await prisma.auditEvent.findFirst({
      where: {
        entity: "KycCase",
        entityId: String(body.case.id),
        action: "kyc_case.approve",
      },
    });
    expect(audit).not.toBeNull();
  });

  it("returns 400 for an unknown decision", async () => {
    const { body } = await createCase();
    const res = await PATCH(
      authedRequest(`http://x/api/cases/${body.case.id}`, "dev-builder-token", {
        method: "PATCH",
        body: JSON.stringify({ decision: "yolo" }),
      }),
      ctx({ id: String(body.case.id) }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when a viewer tries to decide", async () => {
    const { body } = await createCase();
    const res = await PATCH(
      authedRequest(`http://x/api/cases/${body.case.id}`, "dev-viewer-token", {
        method: "PATCH",
        body: JSON.stringify({ decision: "approve" }),
      }),
      ctx({ id: String(body.case.id) }),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/cases/[id]", () => {
  it("returns 404 for a missing case", async () => {
    const res = await GET_CASE(
      authedRequest("http://x/api/cases/999999", "dev-viewer-token"),
      ctx({ id: "999999" }),
    );
    expect(res.status).toBe(404);
  });
});
