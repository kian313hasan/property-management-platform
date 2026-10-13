import Link from "next/link";
import { updateUserRole } from "@/actions/users";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { getI18n } from "@/i18n/server";
import { requirePageAccess } from "@/lib/authorization/page";
import { ROLES } from "@/lib/authorization/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const context = await requirePageAccess("users:manage");
  const { t } = await getI18n();

  const memberships = await prisma.organizationMember.findMany({
    where: { organizationId: context.organizationId },
    select: { userId: true, role: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const addLink = (
    <Link href="/admin/users/new" className={buttonVariants({ size: "sm" })}>
      {t("users.add")}
    </Link>
  );
  const dash = t("common.none");

  return (
    <AppShell role={context.role} active="/admin/users" title={t("users.title")} actions={addLink}>
      <Table>
        <THead>
          <Tr>
            <Th>{t("users.name")}</Th>
            <Th>{t("users.email")}</Th>
            <Th>{t("users.role")}</Th>
            <Th>{t("users.actions")}</Th>
          </Tr>
        </THead>
        <TBody>
          {memberships.map((membership) => (
            <Tr key={membership.userId}>
              <Td className="font-semibold">{membership.user.name ?? dash}</Td>
              <Td dir="auto">{membership.user.email ?? dash}</Td>
              <Td>{t(`roles.${membership.role}`)}</Td>
              <Td>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await updateUserRole(formData);
                  }}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="userId" value={membership.userId} />
                  <Select name="role" defaultValue={membership.role} aria-label={t("users.role")} className="h-9 w-auto">
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(`roles.${role}`)}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline" size="sm">
                    {t("users.save")}
                  </Button>
                </form>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </AppShell>
  );
}
