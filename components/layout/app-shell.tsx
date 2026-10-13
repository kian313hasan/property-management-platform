import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { NavList, type NavItem } from "@/components/ui/nav";
import type { MessageKey } from "@/i18n";
import { getI18n } from "@/i18n/server";
import { signOut } from "@/lib/auth";
import { hasPermission, type Permission, type Role } from "@/lib/authorization/permissions";

const NAV: ReadonlyArray<{ href: string; label: MessageKey; permission?: Permission }> = [
  { href: "/dashboard", label: "nav.dashboard" },
  { href: "/properties", label: "nav.properties", permission: "properties:manage" },
  { href: "/tenants", label: "nav.tenants", permission: "properties:manage" },
  { href: "/leases", label: "nav.leases", permission: "properties:manage" },
  { href: "/payments", label: "nav.payments", permission: "finance:manage" },
  { href: "/expenses", label: "nav.expenses", permission: "finance:manage" },
  { href: "/maintenance", label: "nav.maintenance", permission: "maintenance:manage" },
  { href: "/admin/users", label: "nav.users", permission: "users:manage" },
];

type AppShellProps = {
  role: Role;
  /** `href` of the current section, used for `aria-current`. */
  active: string;
  title: string;
  /** Page-level actions (e.g. the "add" button), shown next to the title. */
  actions?: ReactNode;
  children: ReactNode;
};

/** Authenticated page chrome: title, role-aware navigation, language switcher and sign-out. */
export async function AppShell({ role, active, title, actions, children }: AppShellProps) {
  const { locale, t } = await getI18n();
  const items: NavItem[] = NAV.filter((item) => !item.permission || hasPermission(role, item.permission)).map((item) => ({
    href: item.href,
    label: t(item.label),
  }));

  return (
    <div className="min-h-screen bg-surface-muted text-fg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-fg-muted">{t("common.appName")}</p>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LocaleSwitcher locale={locale} label={t("common.language")} />
            {actions}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                {t("nav.signOut")}
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-3">
          <NavList items={items} activeHref={active} label={t("nav.label")} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
