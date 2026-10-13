import { parseEnv } from "./env.schema";

/** Validated runtime configuration. Importing this module fails fast on a bad environment. */
export const env = parseEnv(process.env);
