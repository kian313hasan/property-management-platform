import { createProperty } from "@/actions/properties";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";

const PROPERTY_TYPES = ["RESIDENTIAL", "COMMERCIAL", "MIXED", "OTHER"] as const;

export default async function NewPropertyPage() {
  await requirePageAccess("properties:manage", "/properties");
  const { t } = await getI18n();

  return (
    <FormPage backHref="/properties" backLabel={t("properties.backToList")} title={t("properties.addTitle")} hint={t("properties.addHint")}>
      <ActionForm action={createProperty} submitLabel={t("properties.submit")}>
        <Field htmlFor="name" label={t("properties.name")}>
          <Input id="name" name="name" required placeholder={t("properties.namePlaceholder")} />
        </Field>
        <Field htmlFor="address" label={t("properties.address")}>
          <Input id="address" name="address" required placeholder={t("properties.addressPlaceholder")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="city" label={t("properties.city")}>
            <Input id="city" name="city" required placeholder={t("properties.cityPlaceholder")} />
          </Field>
          <Field htmlFor="country" label={t("properties.country")}>
            <Input id="country" name="country" required placeholder={t("properties.countryPlaceholder")} />
          </Field>
        </div>
        <Field htmlFor="type" label={t("properties.type")}>
          <Select id="type" name="type" defaultValue="RESIDENTIAL">
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`enums.propertyType.${type}`)}
              </option>
            ))}
          </Select>
        </Field>
      </ActionForm>
    </FormPage>
  );
}
