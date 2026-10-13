/** Shared description of the data created by global-setup. Passwords are throw-away test values. */
export const E2E_PASSWORD = "E2e-Passw0rd!x";

export function seedNames(suffix: string) {
  return {
    orgA: `e2e-a-${suffix}`,
    orgB: `e2e-b-${suffix}`,
    adminEmail: `e2e-admin-${suffix}@example.test`,
    accountantEmail: `e2e-accountant-${suffix}@example.test`,
    staffEmail: `e2e-staff-${suffix}@example.test`,
    otherAdminEmail: `e2e-other-${suffix}@example.test`,
    foreignPropertyName: `Foreign Tower ${suffix}`,
  };
}

export function seeded(): { suffix: string; foreignPropertyId: string } | undefined {
  const suffix = process.env.E2E_SUFFIX;
  const foreignPropertyId = process.env.E2E_FOREIGN_PROPERTY_ID;
  return suffix && foreignPropertyId ? { suffix, foreignPropertyId } : undefined;
}
