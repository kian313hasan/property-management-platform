import { createExpense } from "@/actions/expenses";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { propertyScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function NewExpensePage() {
  const context = await requirePageAccess("finance:manage", "/expenses");
  const { t } = await getI18n();

  const properties = await prisma.property.findMany({
    where: propertyScope(context),
    select: { id: true, name: true, units: { select: { id: true, unitNumber: true }, orderBy: { unitNumber: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <FormPage backHref="/expenses" backLabel={t("expenses.backToList")} title={t("expenses.newTitle")}>
      <ActionForm action={createExpense} submitLabel={t("expenses.submit")} disabled={properties.length === 0}>
        <Field htmlFor="propertyId" label={t("expenses.property")}>
          <Select id="propertyId" name="propertyId" required>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="unitId" label={t("expenses.unitOptional")}>
          <Select id="unitId" name="unitId" defaultValue="">
            <option value="">{t("expenses.generalOnProperty")}</option>
            {properties.flatMap((property) =>
              property.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {property.name} — {unit.unitNumber}
                </option>
              )),
            )}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="category" label={t("expenses.category")}>
            <Input id="category" name="category" required placeholder={t("expenses.categoryPlaceholder")} />
          </Field>
          <Field htmlFor="amount" label={t("expenses.amount")}>
            <Input id="amount" name="amount" inputMode="decimal" required placeholder="500" dir="ltr" />
          </Field>
          <Field htmlFor="date" label={t("expenses.date")}>
            <Input id="date" name="date" type="date" required dir="ltr" />
          </Field>
          <Field htmlFor="vendor" label={t("expenses.vendor")}>
            <Input id="vendor" name="vendor" placeholder={t("expenses.vendorPlaceholder")} />
          </Field>
        </div>
        <Field htmlFor="notes" label={t("expenses.notes")}>
          <Textarea id="notes" name="notes" rows={3} />
        </Field>
      </ActionForm>
    </FormPage>
  );
}
