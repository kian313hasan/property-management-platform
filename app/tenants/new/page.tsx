import { createTenant } from "@/actions/tenants";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";

export default async function NewTenantPage() {
  await requirePageAccess("properties:manage", "/tenants");
  const { t } = await getI18n();

  return (
    <FormPage backHref="/tenants" backLabel={t("tenants.backToList")} title={t("tenants.addTitle")} hint={t("tenants.addHint")}>
      <ActionForm action={createTenant} submitLabel={t("tenants.submit")}>
        <Field htmlFor="name" label={t("tenants.fullName")}>
          <Input id="name" name="name" required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="email" label={t("tenants.email")}>
            <Input id="email" name="email" type="email" placeholder={t("auth.emailPlaceholder")} dir="ltr" />
          </Field>
          <Field htmlFor="phone" label={t("tenants.phone")}>
            <Input id="phone" name="phone" type="tel" dir="ltr" />
          </Field>
        </div>
        <Field htmlFor="nationalId" label={t("tenants.nationalId")}>
          <Input id="nationalId" name="nationalId" dir="ltr" />
        </Field>
        <Field htmlFor="address" label={t("tenants.address")}>
          <Textarea id="address" name="address" rows={3} />
        </Field>
      </ActionForm>
    </FormPage>
  );
}
