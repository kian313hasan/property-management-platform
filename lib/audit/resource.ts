import { randomUUID } from "node:crypto";
import { recordAuditEvent } from "./service";
import type { AuditEvent } from "./types";

type ResourceAction = Extract<AuditEvent["action"], "RESOURCE_CREATED" | "RESOURCE_UPDATED" | "RESOURCE_DELETED">;

/**
 * Records a sensitive resource change. The organization and actor always come from the server-side
 * organization context. Never pass personal data in `metadata`; record identifiers and field names.
 */
export async function auditResourceChange(
  context: { userId: string; organizationId: string },
  action: ResourceAction,
  resourceType: string,
  resourceId: string,
  metadata?: AuditEvent["metadata"],
): Promise<void> {
  await recordAuditEvent({
    action,
    actorUserId: context.userId,
    organizationId: context.organizationId,
    resourceType,
    resourceId,
    requestId: randomUUID(),
    metadata,
  });
}
