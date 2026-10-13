import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatAmount, formatDate } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { leaseScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function LeasesPage() {
  const context = await requirePageAccess("properties:manage");
  const { locale, t } = await getI18n();

  const leases = await prisma.lease.findMany({
    where: leaseScope(context),
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { createdAt: "desc" },
  });

  const addLink = (
    <Link href="/leases/new" className={buttonVariants({ size: "sm" })}>
      {t("leases.new")}
    </Link>
  );

  return (
    <AppShell role={context.role} active="/leases" title={t("leases.title")} actions={addLink}>
      {leases.length === 0 ? (
        <EmptyState
          title={t("leases.emptyTitle")}
          action={
            <Link href="/leases/new" className={buttonVariants()}>
              {t("leases.createFirst")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {leases.map((lease) => (
            <Card key={lease.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{lease.tenant.name}</h2>
                    <p className="mt-1 text-sm text-fg-muted">{t("leases.unitOption", { property: lease.unit.property.name, unit: lease.unit.unitNumber })}</p>
                  </div>
                  <Badge tone={lease.status === "ACTIVE" ? "success" : "neutral"}>{t(`enums.leaseStatus.${lease.status}`)}</Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-fg-muted">
                  <span>{t("leases.from", { date: formatDate(locale, lease.startDate) })}</span>
                  <span>{t("leases.to", { date: formatDate(locale, lease.endDate) })}</span>
                  <span>{t("leases.rentLabel", { value: formatAmount(locale, lease.rentAmount) })}</span>
                  <span>{t("leases.depositLabel", { value: lease.depositAmount ? formatAmount(locale, lease.depositAmount) : t("common.none") })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
