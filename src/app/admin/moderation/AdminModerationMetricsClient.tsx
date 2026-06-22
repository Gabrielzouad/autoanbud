"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";

import "@/lib/sentry";
import type { ModerationMetrics } from "@/lib/services/moderation";

export function AdminModerationMetricsClient({
  metrics,
}: {
  metrics: ModerationMetrics;
}) {
  React.useEffect(() => {
    Sentry.metrics.count("moderation.dashboard_client_viewed", 1);
    Sentry.metrics.gauge("moderation.client.open_queue", metrics.openQueue);
    Sentry.metrics.gauge("moderation.client.total_flags", metrics.total);

    if (metrics.averageResolutionHours !== null) {
      Sentry.metrics.distribution(
        "moderation.client.resolution_hours",
        metrics.averageResolutionHours,
        { unit: "hour" },
      );
    }
  }, [metrics.averageResolutionHours, metrics.openQueue, metrics.total]);

  return null;
}
