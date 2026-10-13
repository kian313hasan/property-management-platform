import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatAmount, formatDate } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { paymentScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

const STATUS_TONE = { PAID: "success", PENDING: "info", OVERDUE: "danger", CANCELLED: "neutral" } as const;

export default async function PaymentsPage() {
  const context = await requirePageAccess("finance:manage");
  const { locale, t } = await getI18n();

  const payments = await prisma.payment.findMany({
    where: paymentScope(context),
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    orderBy: { dueDate: "desc" },
  });

  const addLink = (
    <Link href="/payments/new" className={buttonVariants({ size: "sm" })}>
      {t("payments.record")}
    </Link>
  );
  const dash = t("common.none");

  return (
    <AppShell role={context.role} active="/payments" title={t("payments.title")} actions={addLink}>
      {payments.length === 0 ? (
        <EmptyState title={t("payments.emptyTitle")} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{payment.lease.tenant.name}</h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      {t("leases.unitOption", { property: payment.lease.unit.property.name, unit: payment.lease.unit.unitNumber })}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[payment.status]}>{t(`enums.paymentStatus.${payment.status}`)}</Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-fg-muted">
                  <span>{t("payments.amountLabel", { value: formatAmount(locale, payment.amount) })}</span>
                  <span>{t("payments.dueLabel", { date: formatDate(locale, payment.dueDate) })}</span>
                  <span>{t("payments.paidLabel", { date: payment.paidDate ? formatDate(locale, payment.paidDate) : dash })}</span>
                  <span>{t("payments.methodLabel", { value: payment.method ?? dash })}</span>
                </div>
                {payment.reference && <p className="mt-3 text-xs text-fg-muted">{t("payments.referenceLabel", { value: payment.reference })}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
