import { createMaintenance } from "@/actions/maintenance";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { propertyScope, tenantScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export default async function NewMaintenancePage() {
  const context = await requirePageAccess("maintenance:manage", "/maintenance");
  const { t } = await getI18n();

  const [properties, tenants, members] = await Promise.all([
    prisma.property.findMany({
      where: propertyScope(context),
      select: { id: true, name: true, units: { select: { id: true, unitNumber: true }, orderBy: { unitNumber: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.tenant.findMany({ where: tenantScope(context), select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.organizationMember.findMany({
      where: { organizationId: context.organizationId, role: { in: ["MAINTENANCE_MANAGER", "STAFF"] } },
      select: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const staff = members.map(({ user }) => user);
  // Staff are always assigned to themselves server-side, so the selector is not offered to them.
  const canAssign = context.role !== "STAFF";

  return (
    <FormPage backHref="/maintenance" backLabel={t("maintenance.backToList")} title={t("maintenance.newTitle")}>
      <ActionForm action={createMaintenance} submitLabel={t("maintenance.submit")} disabled={properties.length === 0}>
        <Field htmlFor="propertyId" label={t("maintenance.property")}>
          <Select id="propertyId" name="propertyId" required>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="unitId" label={t("maintenance.unit")}>
          <Select id="unitId" name="unitId" defaultValue="">
            <option value="">{t("maintenance.unspecified")}</option>
            {properties.flatMap((property) =>
              property.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {property.name} — {unit.unitNumber}
                </option>
              )),
            )}
          </Select>
        </Field>
        <Field htmlFor="tenantId" label={t("maintenance.tenant")}>
          <Select id="tenantId" name="tenantId" defaultValue="">
            <option value="">{t("maintenance.unspecified")}</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </Select>
        </Field>
        {canAssign && (
          <Field htmlFor="assignedToId" label={t("maintenance.assignee")}>
            <Select id="assignedToId" name="assignedToId" defaultValue="">
              <option value="">{t("maintenance.unassigned")}</option>
              {staff.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field htmlFor="title" label={t("maintenance.requestTitle")}>
          <Input id="title" name="title" required />
        </Field>
        <Field htmlFor="description" label={t("maintenance.description")}>
          <Textarea id="description" name="description" rows={3} placeholder={t("maintenance.descriptionPlaceholder")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field htmlFor="priority" label={t("maintenance.priority")}>
            <Select id="priority" name="priority" defaultValue="MEDIUM">
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`enums.priority.${priority}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="status" label={t("maintenance.status")}>
            <Select id="status" name="status" defaultValue="OPEN">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`enums.maintenanceStatus.${status}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="cost" label={t("maintenance.cost")}>
            <Input id="cost" name="cost" inputMode="decimal" dir="ltr" />
          </Field>
        </div>
      </ActionForm>
    </FormPage>
  );
}
