import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logging/logger";
import type { AuditEvent } from "./types";

export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        actorUserId: event.actorUserId,
        organizationId: event.organizationId,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        requestId: event.requestId,
        metadata: event.metadata,
      },
    });
  } catch (error) {
    logger.error("audit_write_failed", {
      action: event.action,
      requestId: event.requestId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
