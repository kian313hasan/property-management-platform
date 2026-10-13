import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatAmount, formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { propertyScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requirePageAccess("properties:manage");
  const { locale, t } = await getI18n();
  const { id } = await params;

  // A foreign or unmanaged id is indistinguishable from a missing one (no existence leak).
  const property = await prisma.property.findFirst({
    where: { id, ...propertyScope(context) },
    include: { units: { orderBy: { unitNumber: "asc" } } },
  });
  if (!property) notFound();

  const addUnit = (
    <Link href={`/properties/${property.id}/units/new`} className={buttonVariants({ size: "sm" })}>
      {t("properties.addUnit")}
    </Link>
  );
  const dash = t("common.none");

  return (
    <AppShell role={context.role} active="/properties" title={property.name} actions={addUnit}>
      <Link href="/properties" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:underline">
        <span aria-hidden="true" className="rtl:rotate-180">
          ←
        </span>
        {t("properties.backToList")}
      </Link>
      <section className="mb-7 rounded-3xl bg-primary p-7 text-primary-fg">
        <p className="text-sm opacity-80">
          {property.city}, {property.country}
        </p>
        <h2 className="mt-2 text-3xl font-bold">{property.name}</h2>
        <p className="mt-2 text-sm opacity-80">{property.address}</p>
      </section>
      <h2 className="mb-5 text-2xl font-bold">{t("properties.units", { count: formatNumber(locale, property.units.length) })}</h2>
      {property.units.length === 0 ? (
        <EmptyState title={t("properties.noUnits")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {property.units.map((unit) => (
            <Card key={unit.id}>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">{t("properties.unitTitle", { number: unit.unitNumber })}</h3>
                  <Badge tone={unit.status === "AVAILABLE" ? "success" : "neutral"}>{t(`enums.unitStatus.${unit.status}`)}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-fg-muted">
                  <span>{t("properties.floor", { value: unit.floor === null ? dash : formatNumber(locale, unit.floor) })}</span>
                  <span>{t("properties.bedrooms", { value: unit.bedrooms === null ? dash : formatNumber(locale, unit.bedrooms) })}</span>
                  <span>{t("properties.bathrooms", { value: unit.bathrooms === null ? dash : formatNumber(locale, unit.bathrooms) })}</span>
                  <span>{t("properties.area", { value: unit.area === null ? dash : formatNumber(locale, unit.area) })}</span>
                </div>
                <p className="mt-5 text-xl font-bold">
                  {formatAmount(locale, unit.rentAmount)} <span className="text-sm font-normal text-fg-muted">{t("properties.perMonth")}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
