export const AUDIT_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "ROLE_CHANGED",
  "PERMISSION_CHANGED",
  "RESOURCE_CREATED",
  "RESOURCE_UPDATED",
  "RESOURCE_DELETED",
  "FILE_UPLOADED",
  "FILE_DELETED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEvent = {
  action: AuditAction;
  actorUserId: string | null;
  organizationId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string;
  metadata?: Record<string, string | number | boolean | null>;
};
