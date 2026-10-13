import { notFound } from "next/navigation";
import { createUnit } from "@/actions/units";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { propertyScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requirePageAccess("properties:manage", "/properties");
  const { t } = await getI18n();
  const { id } = await params;

  const property = await prisma.property.findFirst({ where: { id, ...propertyScope(context) }, select: { id: true, name: true } });
  if (!property) notFound();

  return (
    <FormPage backHref={`/properties/${property.id}`} backLabel={t("units.backToProperty")} title={t("units.addTitle")} hint={property.name}>
      <ActionForm action={createUnit} submitLabel={t("units.submit")}>
        <input type="hidden" name="propertyId" value={property.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="unitNumber" label={t("units.number")}>
            <Input id="unitNumber" name="unitNumber" required placeholder="101" dir="ltr" />
          </Field>
          <Field htmlFor="floor" label={t("units.floor")}>
            <Input id="floor" name="floor" type="number" step="1" placeholder="1" dir="ltr" />
          </Field>
          <Field htmlFor="bedrooms" label={t("units.bedrooms")}>
            <Input id="bedrooms" name="bedrooms" type="number" min="0" step="1" placeholder="2" dir="ltr" />
          </Field>
          <Field htmlFor="bathrooms" label={t("units.bathrooms")}>
            <Input id="bathrooms" name="bathrooms" type="number" min="0" step="any" placeholder="1" dir="ltr" />
          </Field>
          <Field htmlFor="area" label={t("units.area")}>
            <Input id="area" name="area" type="number" min="0" step="any" placeholder="120" dir="ltr" />
          </Field>
          <Field htmlFor="rentAmount" label={t("units.rent")}>
            <Input id="rentAmount" name="rentAmount" type="text" inputMode="decimal" required placeholder="1500" dir="ltr" />
          </Field>
        </div>
      </ActionForm>
    </FormPage>
  );
}
