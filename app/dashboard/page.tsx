import { Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { formatAmount, formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { switchOrganization } from "@/actions/organization";
import { Select } from "@/components/ui/select";
import { hasPermission } from "@/lib/authorization/permissions";
import { requirePageAccess } from "@/lib/authorization/page";
import { expenseScope, leaseScope, paymentScope, propertyScope, tenantScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const context = await requirePageAccess();
  const { locale, t } = await getI18n();
  const showCore = hasPermission(context.role, "properties:manage");
  const showFinance = hasPermission(context.role, "finance:manage");

  const paid = { ...paymentScope(context), status: "PAID" as const };
  const [propertyCount, tenantCount, activeLeaseCount, paidPaymentCount, revenue, expenses] = await Promise.all([
    prisma.property.count({ where: propertyScope(context) }),
    prisma.tenant.count({ where: tenantScope(context) }),
    prisma.lease.count({ where: { ...leaseScope(context), status: "ACTIVE" } }),
    prisma.payment.count({ where: paid }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: paid }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: expenseScope(context) }),
  ]);

  // Decimal arithmetic: sums and the net figure never pass through floating point.
  const totalRevenue = revenue._sum.amount ?? new Prisma.Decimal(0);
  const totalExpenses = expenses._sum.amount ?? new Prisma.Decimal(0);
  const netIncome = totalRevenue.minus(totalExpenses);

  const stats: { label: string; value: string }[] = [];
  if (showCore) {
    stats.push(
      { label: t("dashboard.properties"), value: formatNumber(locale, propertyCount) },
      { label: t("dashboard.tenants"), value: formatNumber(locale, tenantCount) },
      { label: t("dashboard.activeLeases"), value: formatNumber(locale, activeLeaseCount) },
    );
  }
  if (showCore || showFinance) stats.push({ label: t("dashboard.paidPayments"), value: formatNumber(locale, paidPaymentCount) });

  const displayName = context.user.name || context.user.email || "";

  return (
    <AppShell role={context.role} active="/dashboard" title={t("dashboard.title")}>
      <section className="mb-8 rounded-3xl bg-primary p-7 text-primary-fg">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm opacity-80">{t("dashboard.organization", { name: context.organization.name })}</span>
          {context.memberships.length > 1 && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await switchOrganization(formData);
              }}
              className="flex items-center gap-2"
            >
              <Select name="organizationId" defaultValue={context.organizationId} aria-label={t("dashboard.switch")} className="h-9 w-auto text-fg">
                {context.memberships.map((membership) => (
                  <option key={membership.organizationId} value={membership.organizationId}>
                    {membership.organization.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="outline" size="sm">
                {t("dashboard.switch")}
              </Button>
            </form>
          )}
        </div>
        <p className="text-sm opacity-80">{t("dashboard.welcome", { name: displayName })}</p>
        <h2 className="mt-2 text-3xl font-bold">{t("dashboard.headline")}</h2>
        <p className="mt-3 text-sm opacity-80">{t("dashboard.subline")}</p>
      </section>

      {stats.length > 0 && (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent>
                <p className="text-sm text-fg-muted">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {showFinance && (
        <section className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            { label: t("dashboard.revenue"), value: totalRevenue },
            { label: t("dashboard.expenses"), value: totalExpenses },
            { label: t("dashboard.netIncome"), value: netIncome },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-6">
                <p className="text-sm text-fg-muted">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">{formatAmount(locale, item.value)}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </AppShell>
  );
}
