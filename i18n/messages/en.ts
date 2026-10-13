export const en = {
  common: {
    appName: "Property Management Platform",
    loading: "Loading",
    error: "An unexpected error occurred",
    unauthorized: "Authentication required",
    forbidden: "You do not have permission",
    retry: "Try again",
    save: "Save",
    cancel: "Cancel",
    language: "Language",
  },
  nav: {
    dashboard: "Dashboard",
    properties: "Properties",
    tenants: "Tenants",
    leases: "Leases",
    payments: "Payments",
    expenses: "Expenses",
    maintenance: "Maintenance",
    users: "Users",
    signOut: "Sign out",
  },
  auth: {
    loginTitle: "Sign in",
    loginSubtitle: "Property management platform",
    email: "Email",
    password: "Password",
    emailPlaceholder: "name@example.com",
    signIn: "Sign in",
    signingIn: "Signing in…",
    forgotPassword: "Forgot your password?",
    registrationClosed: "Public registration is not available. Ask your organization administrator to create your account.",
    passwordResetSuccess: "Your password was changed. Sign in with the new password.",
    errors: {
      invalid_input: "Check the data you entered.",
      invalid_credentials: "Incorrect email or password.",
      unexpected: "Something went wrong while signing in. Please try again.",
    },
  },
  errors: {
    UNAUTHORIZED: "Please sign in to continue.",
    FORBIDDEN: "You do not have permission to do that.",
    NOT_FOUND: "We could not find what you were looking for.",
    VALIDATION_ERROR: "Some of the data is not valid.",
    CONFLICT: "This conflicts with existing data.",
    RATE_LIMITED: "Too many attempts. Please wait and try again.",
    INTERNAL_ERROR: "An unexpected error occurred.",
  },
  states: {
    emptyTitle: "Nothing here yet",
    emptyHint: "Items you add will appear here.",
    errorTitle: "Something went wrong",
    errorHint: "Please try again. If the problem continues, contact your administrator.",
  },
} as const;

type Widen<T> = T extends string ? string : { -readonly [K in keyof T]: Widen<T[K]> };
/** Every locale must provide exactly this shape, so a missing translation is a compile error. */
export type Messages = Widen<typeof en>;
