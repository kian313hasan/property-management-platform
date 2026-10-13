import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { propertyScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function PropertiesPage() {
  const context = await requirePageAccess("properties:manage");
  const { locale, t } = await getI18n();

  const properties = await prisma.property.findMany({
    where: propertyScope(context),
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: "desc" },
  });

  const addLink = (
    <Link href="/properties/new" className={buttonVariants({ size: "sm" })}>
      {t("properties.add")}
    </Link>
  );

  return (
    <AppShell role={context.role} active="/properties" title={t("properties.title")} actions={addLink}>
      {properties.length === 0 ? (
        <EmptyState
          title={t("properties.emptyTitle")}
          hint={t("properties.emptyHint")}
          action={
            <Link href="/properties/new" className={buttonVariants()}>
              {t("properties.addFirst")}
            </Link>
          }
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      <Link href={`/properties/${property.id}`} className="hover:underline">
                        {property.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      {property.city}, {property.country}
                    </p>
                  </div>
                  <Badge>{t(`enums.propertyType.${property.type}`)}</Badge>
                </div>
                <p className="mt-4 text-sm text-fg-muted">{property.address}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span className="text-fg-muted">{t("properties.unitsCount", { count: formatNumber(locale, property._count.units) })}</span>
                  <Badge tone={property.status === "ACTIVE" ? "success" : "neutral"}>{property.status === "ACTIVE" ? t("properties.active") : t("enums.unitStatus.INACTIVE")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </AppShell>
  );
}
