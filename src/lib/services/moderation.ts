import { desc, eq } from "drizzle-orm";

import {
  buyerRequests,
  dealerships,
  db,
  moderationFlags,
  offers,
} from "@/db";
import { AppError, isValidUUID } from "@/lib/errors";
import {
  MarketplaceEvents,
  trackEvent,
  trackMetricCount,
  trackMetricDistribution,
  trackMetricGauge,
} from "@/lib/analytics";
import { verifyAdminUser } from "@/lib/services/authorization";

export type ModerationEntityType = "request" | "offer" | "dealership";
export type ModerationStatus = "flagged" | "reviewing" | "resolved" | "dismissed";

export type ModerationFlagView = {
  id: string;
  entityType: ModerationEntityType;
  entityId: string;
  reason: string;
  reporterId: string;
  status: ModerationStatus;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  entityTitle: string;
  entitySubtitle: string;
};

export type ModerationMetrics = {
  total: number;
  openQueue: number;
  flagged: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
  requestFlags: number;
  offerFlags: number;
  dealershipFlags: number;
  resolvedLast7Days: number;
  averageResolutionHours: number | null;
};

const terminalStatuses = new Set<ModerationStatus>(["resolved", "dismissed"]);

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function assertModerationEntityType(value: string): ModerationEntityType {
  if (value === "request" || value === "offer" || value === "dealership") {
    return value;
  }

  throw new AppError("Ugyldig modereringsobjekt", "VALIDATION");
}

function assertModerationStatus(value: string): ModerationStatus {
  if (
    value === "flagged" ||
    value === "reviewing" ||
    value === "resolved" ||
    value === "dismissed"
  ) {
    return value;
  }

  throw new AppError("Ugyldig modereringsstatus", "VALIDATION");
}

async function ensureEntityExists(entityType: ModerationEntityType, entityId: string) {
  if (!isValidUUID(entityId)) {
    throw new AppError("Ugyldig objekt-ID", "VALIDATION");
  }

  if (entityType === "request") {
    const [row] = await db
      .select({ id: buyerRequests.id })
      .from(buyerRequests)
      .where(eq(buyerRequests.id, entityId));
    if (!row) throw new AppError("Forespørselen finnes ikke", "NOT_FOUND");
    return;
  }

  if (entityType === "offer") {
    const [row] = await db
      .select({ id: offers.id })
      .from(offers)
      .where(eq(offers.id, entityId));
    if (!row) throw new AppError("Tilbudet finnes ikke", "NOT_FOUND");
    return;
  }

  const [row] = await db
    .select({ id: dealerships.id })
    .from(dealerships)
    .where(eq(dealerships.id, entityId));
  if (!row) throw new AppError("Forhandleren finnes ikke", "NOT_FOUND");
}

async function getEntitySummary(
  entityType: ModerationEntityType,
  entityId: string,
): Promise<{ title: string; subtitle: string }> {
  if (entityType === "request") {
    const [row] = await db
      .select({
        title: buyerRequests.title,
        make: buyerRequests.make,
        model: buyerRequests.model,
        status: buyerRequests.status,
        city: buyerRequests.locationCity,
      })
      .from(buyerRequests)
      .where(eq(buyerRequests.id, entityId));

    return row
      ? {
          title: row.title,
          subtitle: `${row.make} ${row.model} · ${row.status}${row.city ? ` · ${row.city}` : ""}`,
        }
      : { title: "Forespørsel finnes ikke", subtitle: entityId };
  }

  if (entityType === "offer") {
    const [row] = await db
      .select({
        carMake: offers.carMake,
        carModel: offers.carModel,
        status: offers.status,
        priceTotal: offers.priceTotal,
      })
      .from(offers)
      .where(eq(offers.id, entityId));

    return row
      ? {
          title: `${row.carMake} ${row.carModel}`,
          subtitle: `${row.status} · ${new Intl.NumberFormat("nb-NO").format(row.priceTotal)} kr`,
        }
      : { title: "Tilbud finnes ikke", subtitle: entityId };
  }

  const [row] = await db
    .select({
      name: dealerships.name,
      orgNumber: dealerships.orgNumber,
      city: dealerships.city,
      verificationState: dealerships.verificationState,
    })
    .from(dealerships)
    .where(eq(dealerships.id, entityId));

  return row
    ? {
        title: row.name,
        subtitle: `${row.orgNumber} · ${row.verificationState}${row.city ? ` · ${row.city}` : ""}`,
      }
    : { title: "Forhandler finnes ikke", subtitle: entityId };
}

function calculateModerationMetrics(
  flags: Array<{
    entityType: ModerationEntityType;
    status: ModerationStatus;
    createdAt: Date;
    resolvedAt: Date | null;
  }>,
): ModerationMetrics {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const resolutionHours: number[] = [];

  const metrics: ModerationMetrics = {
    total: flags.length,
    openQueue: 0,
    flagged: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
    requestFlags: 0,
    offerFlags: 0,
    dealershipFlags: 0,
    resolvedLast7Days: 0,
    averageResolutionHours: null,
  };

  for (const flag of flags) {
    metrics[flag.status] += 1;

    if (flag.status === "flagged" || flag.status === "reviewing") {
      metrics.openQueue += 1;
    }

    if (flag.entityType === "request") metrics.requestFlags += 1;
    if (flag.entityType === "offer") metrics.offerFlags += 1;
    if (flag.entityType === "dealership") metrics.dealershipFlags += 1;

    if (flag.resolvedAt) {
      if (flag.resolvedAt.getTime() >= sevenDaysAgo) {
        metrics.resolvedLast7Days += 1;
      }

      const createdAt = flag.createdAt.getTime();
      const resolvedAt = flag.resolvedAt.getTime();
      if (resolvedAt >= createdAt) {
        resolutionHours.push((resolvedAt - createdAt) / (1000 * 60 * 60));
      }
    }
  }

  if (resolutionHours.length > 0) {
    metrics.averageResolutionHours =
      resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length;
  }

  return metrics;
}

function recordModerationMetricSnapshot(metrics: ModerationMetrics, source: string) {
  const attributes = { source };

  trackMetricGauge("moderation.flags.total", metrics.total, attributes);
  trackMetricGauge("moderation.flags.open_queue", metrics.openQueue, attributes);
  trackMetricGauge("moderation.flags.flagged", metrics.flagged, attributes);
  trackMetricGauge("moderation.flags.reviewing", metrics.reviewing, attributes);
  trackMetricGauge("moderation.flags.resolved", metrics.resolved, attributes);
  trackMetricGauge("moderation.flags.dismissed", metrics.dismissed, attributes);
  trackMetricGauge("moderation.flags.requests", metrics.requestFlags, attributes);
  trackMetricGauge("moderation.flags.offers", metrics.offerFlags, attributes);
  trackMetricGauge("moderation.flags.dealerships", metrics.dealershipFlags, attributes);

  if (metrics.averageResolutionHours !== null) {
    trackMetricDistribution(
      "moderation.resolution_hours",
      metrics.averageResolutionHours,
      attributes,
      "hour",
    );
  }

  trackEvent(MarketplaceEvents.MODERATION_METRICS_RECORDED, {
    ...metrics,
    source,
  });
}

export async function flagEntity(input: {
  entityType: string;
  entityId: string;
  reason: string;
  reporterId: string;
}) {
  const entityType = assertModerationEntityType(input.entityType);
  const reason = input.reason.trim();

  if (reason.length < 3) {
    throw new AppError("Årsak må være minst 3 tegn", "VALIDATION");
  }

  await ensureEntityExists(entityType, input.entityId);

  const [created] = await db
    .insert(moderationFlags)
    .values({
      entityType,
      entityId: input.entityId,
      reason,
      reporterId: input.reporterId,
      status: "flagged",
    })
    .returning();

  trackEvent(MarketplaceEvents.MODERATION_FLAGGED, {
    flagId: created.id,
    entityType,
    entityId: input.entityId,
    reporterId: input.reporterId,
  });
  trackMetricCount("moderation.flagged", 1, { entityType });

  if (reason.toLowerCase().includes("spam")) {
    trackEvent(MarketplaceEvents.SPAM_DETECTED, {
      flagId: created.id,
      entityType,
      entityId: input.entityId,
    });
    trackMetricCount("moderation.spam_detected", 1, { entityType });
  }

  return created;
}

export async function reviewFlaggedItem(input: {
  adminUserId: string;
  flagId: string;
  status: string;
  notes?: string;
}) {
  await verifyAdminUser(input.adminUserId);

  if (!isValidUUID(input.flagId)) {
    throw new AppError("Ugyldig flagg-ID", "VALIDATION");
  }

  const status = assertModerationStatus(input.status);
  const resolvedAt = terminalStatuses.has(status) ? new Date() : null;

  const [updated] = await db
    .update(moderationFlags)
    .set({
      status,
      resolutionNotes: input.notes?.trim() ?? "",
      updatedAt: new Date(),
      resolvedAt,
    })
    .where(eq(moderationFlags.id, input.flagId))
    .returning();

  if (!updated) {
    throw new AppError("Modereringselementet finnes ikke", "NOT_FOUND");
  }

  const eventName =
    status === "resolved"
      ? MarketplaceEvents.MODERATION_RESOLVED
      : status === "dismissed"
        ? MarketplaceEvents.MODERATION_DISMISSED
        : MarketplaceEvents.MODERATION_REVIEWING;

  trackEvent(eventName, {
    flagId: updated.id,
    entityType: updated.entityType,
    entityId: updated.entityId,
    adminUserId: input.adminUserId,
    status,
  });
  trackMetricCount(`moderation.${status}`, 1, {
    entityType: updated.entityType,
  });

  if (resolvedAt) {
    const resolutionHours =
      (resolvedAt.getTime() - updated.createdAt.getTime()) / (1000 * 60 * 60);
    trackMetricDistribution(
      "moderation.item_resolution_hours",
      Math.max(resolutionHours, 0),
      { entityType: updated.entityType, status },
      "hour",
    );
  }

  return updated;
}

export async function listFlaggedItems(status?: string): Promise<ModerationFlagView[]> {
  const parsedStatus = status && status !== "all" ? assertModerationStatus(status) : null;
  const rows = await db
    .select()
    .from(moderationFlags)
    .where(parsedStatus ? eq(moderationFlags.status, parsedStatus) : undefined)
    .orderBy(desc(moderationFlags.createdAt))
    .limit(50);

  return Promise.all(
    rows.map(async (row) => {
      const summary = await getEntitySummary(row.entityType, row.entityId);

      return {
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        reason: row.reason,
        reporterId: row.reporterId,
        status: row.status,
        resolutionNotes: row.resolutionNotes,
        createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
        updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
        resolvedAt: toIso(row.resolvedAt),
        entityTitle: summary.title,
        entitySubtitle: summary.subtitle,
      };
    }),
  );
}

export async function getModerationMetrics(): Promise<ModerationMetrics> {
  const rows = await db
    .select({
      entityType: moderationFlags.entityType,
      status: moderationFlags.status,
      createdAt: moderationFlags.createdAt,
      resolvedAt: moderationFlags.resolvedAt,
    })
    .from(moderationFlags);

  return calculateModerationMetrics(rows);
}

export async function getModerationDashboardData(input: {
  adminUserId: string;
  status?: string;
}) {
  await verifyAdminUser(input.adminUserId);

  const startedAt = Date.now();
  const [metrics, flags] = await Promise.all([
    getModerationMetrics(),
    listFlaggedItems(input.status),
  ]);
  const loadMs = Date.now() - startedAt;

  recordModerationMetricSnapshot(metrics, "admin_dashboard");
  trackMetricDistribution("moderation.dashboard_load_ms", loadMs, {
    source: "admin_dashboard",
  }, "millisecond");
  trackMetricCount("moderation.dashboard_viewed", 1, {
    status: input.status ?? "all",
  });
  trackEvent(MarketplaceEvents.MODERATION_DASHBOARD_VIEWED, {
    adminUserId: input.adminUserId,
    status: input.status ?? "all",
    openQueue: metrics.openQueue,
    loadMs,
  });

  return {
    metrics,
    flags,
  };
}
