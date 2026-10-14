-- Make "AuditLog" append-only at the database level.
--
-- * DELETE and TRUNCATE are always rejected.
-- * UPDATE is rejected, with one exception: the foreign keys use ON DELETE SET NULL, so when an
--   organization or user is deleted PostgreSQL nulls "organizationId" / "actorUserId". That
--   referential action (and only that: a non-null value becoming NULL with every other column
--   unchanged) is allowed so that the audit trail survives the deletion of its subjects.
--
-- The guard also applies to the table owner, so a compromised application connection cannot rewrite
-- history. A superuser can still drop the trigger; production should additionally run the app with
-- a role that has no ALTER/TRIGGER privilege on the table (docs/SECURITY.md).

CREATE OR REPLACE FUNCTION audit_log_guard() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."id" IS NOT DISTINCT FROM OLD."id"
       AND NEW."action" IS NOT DISTINCT FROM OLD."action"
       AND NEW."resourceType" IS NOT DISTINCT FROM OLD."resourceType"
       AND NEW."resourceId" IS NOT DISTINCT FROM OLD."resourceId"
       AND NEW."requestId" IS NOT DISTINCT FROM OLD."requestId"
       AND NEW."metadata" IS NOT DISTINCT FROM OLD."metadata"
       AND NEW."createdAt" IS NOT DISTINCT FROM OLD."createdAt"
       AND (NEW."organizationId" IS NOT DISTINCT FROM OLD."organizationId" OR NEW."organizationId" IS NULL)
       AND (NEW."actorUserId" IS NOT DISTINCT FROM OLD."actorUserId" OR NEW."actorUserId" IS NULL)
    THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'AuditLog is append-only (% rejected)', TG_OP USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER "AuditLog_append_only_row"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_guard();

CREATE TRIGGER "AuditLog_append_only_truncate"
  BEFORE TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_guard();
