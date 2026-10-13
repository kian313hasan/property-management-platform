import { createUser } from "@/actions/users";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { ROLES } from "@/lib/authorization/permissions";

export default async function NewUserPage() {
  await requirePageAccess("users:manage");
  const { t } = await getI18n();

  return (
    <FormPage backHref="/admin/users" backLabel={t("common.back")} title={t("users.addTitle")}>
      <ActionForm action={createUser} submitLabel={t("users.submit")} successHref="/admin/users">
        <Field htmlFor="name" label={t("users.name")}>
          <Input id="name" name="name" required />
        </Field>
        <Field htmlFor="email" label={t("users.email")}>
          <Input id="email" name="email" type="email" required dir="ltr" />
        </Field>
        <Field htmlFor="password" label={t("users.password")} hint={t("users.passwordHint")}>
          <Input id="password" name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" dir="ltr" aria-describedby="password-hint" />
        </Field>
        <Field htmlFor="role" label={t("users.role")}>
          <Select id="role" name="role" defaultValue="STAFF">
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </Select>
        </Field>
      </ActionForm>
    </FormPage>
  );
}
