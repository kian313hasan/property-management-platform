-- Make "AuditLog" append-only at the database level (docs/SECURITY.md, ADR-013).
--
-- * DELETE and TRUNCATE are always rejected.
-- * UPDATE is rejected except for the referential nulling that PostgreSQL itself performs through the
--   ON DELETE SET NULL foreign keys (organizationId / actorUserId set to NULL when the organization or
--   user is removed). Every other column is immutable.
--
-- A database superuser or the table owner can still drop the trigger; that is outside the application
-- trust boundary and must be controlled by database access policy.

CREATE OR REPLACE FUNCTION audit_log_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'AuditLog rows cannot be deleted' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'AuditLog cannot be truncated' USING ERRCODE = '42501';
  END IF;

  IF NEW."id" IS DISTINCT FROM OLD."id"
     OR NEW."action" IS DISTINCT FROM OLD."action"
     OR NEW."resourceType" IS DISTINCT FROM OLD."resourceType"
     OR NEW."resourceId" IS DISTINCT FROM OLD."resourceId"
     OR NEW."requestId" IS DISTINCT FROM OLD."requestId"
     OR NEW."metadata" IS DISTINCT FROM OLD."metadata"
     OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
     OR (NEW."organizationId" IS NOT NULL AND NEW."organizationId" IS DISTINCT FROM OLD."organizationId")
     OR (NEW."actorUserId" IS NOT NULL AND NEW."actorUserId" IS DISTINCT FROM OLD."actorUserId") THEN
    RAISE EXCEPTION 'AuditLog rows are immutable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "AuditLog_row_guard" ON "AuditLog";
CREATE TRIGGER "AuditLog_row_guard"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_guard();

DROP TRIGGER IF EXISTS "AuditLog_truncate_guard" ON "AuditLog";
CREATE TRIGGER "AuditLog_truncate_guard"
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_guard();
