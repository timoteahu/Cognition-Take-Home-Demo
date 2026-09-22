import { prisma } from "./db";

/**
 * Append an audit-trail event. Every mutating action in a tool should call this
 * so regulated workflows (KYC decisions, refunds, disputes) have a durable record
 * of who did what.
 */
export async function logAudit(event: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entity: event.entity,
      entityId: event.entityId,
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
    },
  });
}

export async function listAuditEvents(filter?: {
  entity?: string;
  entityId?: string;
  take?: number;
}) {
  return prisma.auditEvent.findMany({
    where: { entity: filter?.entity, entityId: filter?.entityId },
    orderBy: { createdAt: "desc" },
    take: filter?.take ?? 100,
  });
}
