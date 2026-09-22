import { afterAll, describe, expect, it } from "vitest";

import { authedRequest, prisma } from "@internal-tools/framework";
import { GET, POST } from "../app/api/disputes/route";
import { GET as GET_DISPUTE, PATCH } from "../app/api/disputes/[id]/route";

const ctx = (params: Record<string, string>) => ({
  params: Promise.resolve(params),
});

const createdIds: number[] = [];
const txnId = () => `txn_test_${crypto.randomUUID()}`;

async function createDispute(transactionId = txnId()) {
  const res = await POST(
    authedRequest("http://x/api/disputes", "dev-builder-token", {
      method: "POST",
      body: JSON.stringify({
        transactionId,
        cardholderName: "Test Holder",
        amountCents: 4200,
        reason: "fraudulent",
      }),
    }),
    {},
  );
  const body = await res.json();
  if (body.dispute) createdIds.push(body.dispute.id);
  return { res, body };
}

afterAll(async () => {
  await prisma.auditEvent.deleteMany({
    where: { entity: "Chargeback", entityId: { in: createdIds.map(String) } },
  });
  await prisma.chargeback.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

describe("GET /api/disputes", () => {
  it("returns 401 without a token", async () => {
    const res = await GET(new Request("http://x/api/disputes"), {});
    expect(res.status).toBe(401);
  });

  it("lists disputes for a viewer", async () => {
    await createDispute();
    const res = await GET(
      authedRequest("http://x/api/disputes", "dev-viewer-token"),
      {},
    );
    expect(res.status).toBe(200);
    const { disputes } = await res.json();
    expect(disputes.length).toBeGreaterThan(0);
  });
});

describe("POST /api/disputes", () => {
  it("returns 403 for a viewer", async () => {
    const res = await POST(
      authedRequest("http://x/api/disputes", "dev-viewer-token", {
        method: "POST",
        body: JSON.stringify({
          transactionId: txnId(),
          cardholderName: "Nope",
          amountCents: 100,
          reason: "fraudulent",
        }),
      }),
      {},
    );
    expect(res.status).toBe(403);
  });

  it("creates a dispute and writes an audit event", async () => {
    const { res, body } = await createDispute();
    expect(res.status).toBe(201);
    expect(body.dispute.status).toBe("open");
    const audit = await prisma.auditEvent.findFirst({
      where: { entity: "Chargeback", entityId: String(body.dispute.id) },
    });
    expect(audit?.action).toBe("chargeback.create");
    expect(audit?.actorId).toBe("u-builder");
  });

  it("returns 400 for a non-positive amountCents", async () => {
    const res = await POST(
      authedRequest("http://x/api/disputes", "dev-builder-token", {
        method: "POST",
        body: JSON.stringify({
          transactionId: txnId(),
          cardholderName: "Bad",
          amountCents: 0,
          reason: "fraudulent",
        }),
      }),
      {},
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 for a duplicate transactionId", async () => {
    const id = txnId();
    await createDispute(id);
    const { res } = await createDispute(id);
    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/disputes/[id]", () => {
  it("records evidence and audits the action", async () => {
    const { body } = await createDispute();
    const res = await PATCH(
      authedRequest(
        `http://x/api/disputes/${body.dispute.id}`,
        "dev-builder-token",
        { method: "PATCH", body: JSON.stringify({ action: "submit_evidence" }) },
      ),
      ctx({ id: String(body.dispute.id) }),
    );
    expect(res.status).toBe(200);
    const { dispute } = await res.json();
    expect(dispute.status).toBe("evidence_submitted");
    const audit = await prisma.auditEvent.findFirst({
      where: {
        entity: "Chargeback",
        entityId: String(body.dispute.id),
        action: "chargeback.submit_evidence",
      },
    });
    expect(audit).not.toBeNull();
  });

  it("resolves a dispute as won and records the resolver", async () => {
    const { body } = await createDispute();
    const res = await PATCH(
      authedRequest(
        `http://x/api/disputes/${body.dispute.id}`,
        "dev-builder-token",
        { method: "PATCH", body: JSON.stringify({ action: "win" }) },
      ),
      ctx({ id: String(body.dispute.id) }),
    );
    expect(res.status).toBe(200);
    const { dispute } = await res.json();
    expect(dispute.status).toBe("won");
    expect(dispute.resolvedById).toBe("u-builder");
  });

  it("returns 409 when acting on a resolved dispute", async () => {
    const { body } = await createDispute();
    const id = String(body.dispute.id);
    const url = `http://x/api/disputes/${id}`;
    await PATCH(
      authedRequest(url, "dev-builder-token", {
        method: "PATCH",
        body: JSON.stringify({ action: "lose" }),
      }),
      ctx({ id }),
    );
    const res = await PATCH(
      authedRequest(url, "dev-builder-token", {
        method: "PATCH",
        body: JSON.stringify({ action: "win" }),
      }),
      ctx({ id }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for an unknown action", async () => {
    const { body } = await createDispute();
    const res = await PATCH(
      authedRequest(
        `http://x/api/disputes/${body.dispute.id}`,
        "dev-builder-token",
        { method: "PATCH", body: JSON.stringify({ action: "yeet" }) },
      ),
      ctx({ id: String(body.dispute.id) }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when a viewer tries to act", async () => {
    const { body } = await createDispute();
    const res = await PATCH(
      authedRequest(
        `http://x/api/disputes/${body.dispute.id}`,
        "dev-viewer-token",
        { method: "PATCH", body: JSON.stringify({ action: "win" }) },
      ),
      ctx({ id: String(body.dispute.id) }),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/disputes/[id]", () => {
  it("returns 404 for a missing dispute", async () => {
    const res = await GET_DISPUTE(
      authedRequest("http://x/api/disputes/999999", "dev-viewer-token"),
      ctx({ id: "999999" }),
    );
    expect(res.status).toBe(404);
  });
});
