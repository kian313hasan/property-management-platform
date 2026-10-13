import { prisma } from "@/lib/prisma";
import { logger, serializeError } from "@/lib/logging/logger";
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
    // Best effort by design: a failed audit write must not break the user action, but it is logged.
    logger.error("audit_write_failed", {
      action: event.action,
      requestId: event.requestId,
      ...serializeError(error),
    });
  }
}
