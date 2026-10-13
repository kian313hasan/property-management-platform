import { createLease } from "@/actions/leases";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { tenantScope, unitScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function NewLeasePage() {
  const context = await requirePageAccess("properties:manage", "/leases");
  const { t } = await getI18n();

  const [units, tenants] = await Promise.all([
    prisma.unit.findMany({
      where: { ...unitScope(context), status: "AVAILABLE" },
      select: { id: true, unitNumber: true, property: { select: { name: true } } },
      orderBy: [{ property: { name: "asc" } }, { unitNumber: "asc" }],
    }),
    prisma.tenant.findMany({ where: tenantScope(context), select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <FormPage backHref="/leases" backLabel={t("leases.backToList")} title={t("leases.newTitle")} hint={t("leases.newHint")}>
      <ActionForm action={createLease} submitLabel={t("leases.submit")} disabled={units.length === 0 || tenants.length === 0}>
        <Field htmlFor="unitId" label={t("leases.unit")}>
          <Select id="unitId" name="unitId" required>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {t("leases.unitOption", { property: unit.property.name, unit: unit.unitNumber })}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="tenantId" label={t("leases.tenant")}>
          <Select id="tenantId" name="tenantId" required>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="startDate" label={t("leases.startDate")}>
            <Input id="startDate" name="startDate" type="date" required dir="ltr" />
          </Field>
          <Field htmlFor="endDate" label={t("leases.endDate")}>
            <Input id="endDate" name="endDate" type="date" required dir="ltr" />
          </Field>
          <Field htmlFor="rentAmount" label={t("leases.rent")}>
            <Input id="rentAmount" name="rentAmount" inputMode="decimal" required placeholder="1500" dir="ltr" />
          </Field>
          <Field htmlFor="depositAmount" label={t("leases.deposit")}>
            <Input id="depositAmount" name="depositAmount" inputMode="decimal" placeholder="1500" dir="ltr" />
          </Field>
          <Field htmlFor="paymentDueDay" label={t("leases.dueDay")}>
            <Input id="paymentDueDay" name="paymentDueDay" type="number" min="1" max="28" step="1" defaultValue="1" required dir="ltr" />
          </Field>
        </div>
        <Field htmlFor="notes" label={t("leases.notes")}>
          <Textarea id="notes" name="notes" rows={3} />
        </Field>
        {units.length === 0 && <Alert tone="warning">{t("leases.noUnitsAvailable")}</Alert>}
      </ActionForm>
    </FormPage>
  );
}
