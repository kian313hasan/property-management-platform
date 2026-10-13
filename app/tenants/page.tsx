import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { tenantScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function TenantsPage() {
  const context = await requirePageAccess("properties:manage");
  const { locale, t } = await getI18n();

  const tenants = await prisma.tenant.findMany({
    where: tenantScope(context),
    include: { _count: { select: { leases: true } } },
    orderBy: { createdAt: "desc" },
  });

  const addLink = (
    <Link href="/tenants/new" className={buttonVariants({ size: "sm" })}>
      {t("tenants.add")}
    </Link>
  );

  return (
    <AppShell role={context.role} active="/tenants" title={t("tenants.title")} actions={addLink}>
      {tenants.length === 0 ? (
        <EmptyState
          title={t("tenants.emptyTitle")}
          action={
            <Link href="/tenants/new" className={buttonVariants()}>
              {t("tenants.addFirst")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent>
                <h2 className="text-lg font-bold">{tenant.name}</h2>
                <p className="mt-2 text-sm text-fg-muted" dir="auto">
                  {tenant.email ?? t("tenants.noEmail")}
                </p>
                <p className="mt-1 text-sm text-fg-muted" dir="auto">
                  {tenant.phone ?? t("tenants.noPhone")}
                </p>
                <div className="mt-5 border-t border-border pt-4 text-sm text-fg-muted">
                  {t("tenants.leasesCount", { count: formatNumber(locale, tenant._count.leases) })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
