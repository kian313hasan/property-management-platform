"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { logger } from "@/lib/logging/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    logger.error("render_error", { digest: error.digest });
  }, [error.digest]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{t("states.errorTitle")}</h1>
      <p className="text-sm text-fg-muted">{t("states.errorHint")}</p>
      <Button onClick={() => reset()}>{t("common.retry")}</Button>
    </main>
  );
}
