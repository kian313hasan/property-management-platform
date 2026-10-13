import { createPayment } from "@/actions/payments";
import { ActionForm } from "@/components/forms/action-form";
import { FormPage } from "@/components/layout/form-page";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { leaseScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

const STATUSES = ["PAID", "PENDING", "OVERDUE", "CANCELLED"] as const;

export default async function NewPaymentPage() {
  const context = await requirePageAccess("finance:manage", "/payments");
  const { t } = await getI18n();

  const leases = await prisma.lease.findMany({
    where: { ...leaseScope(context), status: "ACTIVE" },
    select: { id: true, tenant: { select: { name: true } }, unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <FormPage backHref="/payments" backLabel={t("payments.backToList")} title={t("payments.recordTitle")}>
      <ActionForm action={createPayment} submitLabel={t("payments.submit")} disabled={leases.length === 0}>
        <Field htmlFor="leaseId" label={t("payments.lease")}>
          <Select id="leaseId" name="leaseId" required>
            {leases.map((lease) => (
              <option key={lease.id} value={lease.id}>
                {lease.tenant.name} — {t("leases.unitOption", { property: lease.unit.property.name, unit: lease.unit.unitNumber })}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field htmlFor="amount" label={t("payments.amount")}>
            <Input id="amount" name="amount" inputMode="decimal" required placeholder="1500" dir="ltr" />
          </Field>
          <Field htmlFor="dueDate" label={t("payments.dueDate")}>
            <Input id="dueDate" name="dueDate" type="date" required dir="ltr" />
          </Field>
          <Field htmlFor="paidDate" label={t("payments.paidDate")}>
            <Input id="paidDate" name="paidDate" type="date" dir="ltr" />
          </Field>
          <Field htmlFor="method" label={t("payments.method")}>
            <Input id="method" name="method" placeholder={t("payments.methodPlaceholder")} />
          </Field>
          <Field htmlFor="reference" label={t("payments.reference")}>
            <Input id="reference" name="reference" placeholder="INV-001" dir="ltr" />
          </Field>
          <Field htmlFor="status" label={t("payments.status")}>
            <Select id="status" name="status" defaultValue="PAID">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`enums.paymentStatus.${status}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field htmlFor="notes" label={t("payments.notes")}>
          <Textarea id="notes" name="notes" rows={3} />
        </Field>
        {leases.length === 0 && <Alert tone="warning">{t("payments.noActiveLeases")}</Alert>}
      </ActionForm>
    </FormPage>
  );
}
