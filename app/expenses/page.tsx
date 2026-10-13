import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { formatAmount, formatDate } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { expenseScope } from "@/lib/authorization/scope";
import { prisma } from "@/lib/prisma";

export default async function ExpensesPage() {
  const context = await requirePageAccess("finance:manage");
  const { locale, t } = await getI18n();
  const where = expenseScope(context);

  const [expenses, totals] = await Promise.all([
    prisma.expense.findMany({ where, include: { property: true, unit: true }, orderBy: { date: "desc" } }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);
  // The total is summed in the database (Decimal), never through floating point.
  const total = totals._sum.amount ?? new Prisma.Decimal(0);

  const addLink = (
    <Link href="/expenses/new" className={buttonVariants({ size: "sm" })}>
      {t("expenses.new")}
    </Link>
  );
  const dash = t("common.none");

  return (
    <AppShell role={context.role} active="/expenses" title={t("expenses.title")} actions={addLink}>
      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="text-sm text-fg-muted">{t("expenses.total")}</p>
          <p className="mt-1 text-2xl font-bold">{formatAmount(locale, total)}</p>
        </CardContent>
      </Card>
      {expenses.length === 0 ? (
        <EmptyState title={t("expenses.emptyTitle")} />
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>{t("expenses.date")}</Th>
              <Th>{t("expenses.property")}</Th>
              <Th>{t("expenses.unit")}</Th>
              <Th>{t("expenses.category")}</Th>
              <Th>{t("expenses.vendor")}</Th>
              <Th>{t("expenses.amount")}</Th>
            </Tr>
          </THead>
          <TBody>
            {expenses.map((expense) => (
              <Tr key={expense.id}>
                <Td>{formatDate(locale, expense.date)}</Td>
                <Td className="font-semibold">{expense.property.name}</Td>
                <Td>{expense.unit?.unitNumber ?? t("expenses.general")}</Td>
                <Td>{expense.category}</Td>
                <Td>{expense.vendor ?? dash}</Td>
                <Td className="font-semibold">{formatAmount(locale, expense.amount)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
