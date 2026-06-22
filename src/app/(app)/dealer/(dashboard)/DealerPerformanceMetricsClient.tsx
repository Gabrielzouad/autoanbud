"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";

import "@/lib/sentry";
import type { DealerPerformanceMetrics } from "@/lib/services/dealerPerformance";

export function DealerPerformanceMetricsClient({
  dealershipId,
  metrics,
}: {
  dealershipId: string;
  metrics: DealerPerformanceMetrics;
}) {
  React.useEffect(() => {
    const attributes = {
      dealershipId,
      source: "dealer_dashboard_client",
    };

    Sentry.metrics.count("dealer.performance.dashboard_viewed", 1, {
      attributes,
    });
    Sentry.metrics.gauge("dealer.performance.response_rate", metrics.responseRate, {
      attributes,
    });
    Sentry.metrics.gauge("dealer.performance.acceptance_rate", metrics.acceptanceRate, {
      attributes,
    });
    Sentry.metrics.gauge("dealer.performance.open_assignments", metrics.openAssignments, {
      attributes,
    });
    Sentry.metrics.gauge("dealer.performance.average_offer_quality", metrics.averageOfferQuality ?? 0, {
      attributes,
    });

    if (metrics.averageResponseHours !== null) {
      Sentry.metrics.gauge(
        "dealer.performance.average_response_hours",
        metrics.averageResponseHours,
        { attributes },
      );
    }
  }, [
    dealershipId,
    metrics.acceptanceRate,
    metrics.averageOfferQuality,
    metrics.averageResponseHours,
    metrics.openAssignments,
    metrics.responseRate,
  ]);

  return null;
}
