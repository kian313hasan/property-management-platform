import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatAmount, formatDate } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { maintenanceScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
type Priority = (typeof PRIORITIES)[number];
type Status = (typeof STATUSES)[number];

const PRIORITY_TONE: Record<Priority, "neutral" | "info" | "warning" | "danger"> = { LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "danger" };

// `priority` and `status` are free strings in the schema (known gap, docs/STATUS.md); narrow them safely.
const isPriority = (value: string): value is Priority => (PRIORITIES as readonly string[]).includes(value);
const isStatus = (value: string): value is Status => (STATUSES as readonly string[]).includes(value);

export default async function MaintenancePage() {
  const context = await requirePageAccess("maintenance:manage");
  const { locale, t } = await getI18n();

  const requests = await prisma.maintenanceRequest.findMany({
    where: maintenanceScope(context),
    include: { property: true, unit: true, tenant: true, assignedTo: true },
    orderBy: { openedAt: "desc" },
  });

  const addLink = (
    <Link href="/maintenance/new" className={buttonVariants({ size: "sm" })}>
      {t("maintenance.new")}
    </Link>
  );
  const dash = t("common.none");

  return (
    <AppShell role={context.role} active="/maintenance" title={t("maintenance.title")} actions={addLink}>
      {requests.length === 0 ? (
        <EmptyState title={t("maintenance.emptyTitle")} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      {request.property.name}
                      {request.unit ? ` — ${t("maintenance.unitInline", { number: request.unit.unitNumber })}` : ""}
                      {request.tenant ? ` — ${request.tenant.name}` : ""}
                    </p>
                  </div>
                  {isPriority(request.priority) && <Badge tone={PRIORITY_TONE[request.priority]}>{t(`enums.priority.${request.priority}`)}</Badge>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-fg-muted">
                  <span>{t("maintenance.statusLabel", { value: isStatus(request.status) ? t(`enums.maintenanceStatus.${request.status}`) : request.status })}</span>
                  <span>{t("maintenance.costLabel", { value: request.cost ? formatAmount(locale, request.cost) : dash })}</span>
                  <span>{t("maintenance.assigneeLabel", { value: request.assignedTo?.name ?? t("maintenance.unassigned") })}</span>
                  <span>{t("maintenance.openedLabel", { date: formatDate(locale, request.openedAt) })}</span>
                </div>
                {request.description && <p className="mt-4 text-sm text-fg-muted">{request.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
