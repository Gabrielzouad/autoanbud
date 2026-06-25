// src/lib/analytics.ts
/**
 * Analytics event tracking integrated with Sentry.
 * Events are captured in Sentry and can be viewed in the Sentry dashboard.
 */
import * as Sentry from '@sentry/nextjs';

type AnalyticsPayload = Record<string, unknown>;
type MetricAttributes = Record<string, string | number | boolean>;

export interface AnalyticsEvent {
  eventName: string;
  payload: AnalyticsPayload;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

/**
 * Track a user-agnostic event
 */
export function trackEvent(eventName: string, payload: AnalyticsPayload = {}): void {
  const event: AnalyticsEvent = {
    eventName,
    payload,
    timestamp: new Date(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event.eventName, event.payload);
  }

  // Send to Sentry for analytics tracking
  Sentry.captureMessage(eventName, {
    level: 'info',
    tags: {
      category: 'analytics',
    },
    extra: payload,
  });
}

/**
 * Track a user-specific event
 */
export function trackUserEvent(
  userId: string,
  eventName: string,
  payload: AnalyticsPayload = {},
): void {
  const event: AnalyticsEvent = {
    eventName,
    payload: {
      userId,
      ...payload,
    },
    timestamp: new Date(),
    userId,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event.eventName, event.payload);
  }

  // Identify user in Sentry and capture event
  Sentry.setUser({ id: userId });
  Sentry.captureMessage(eventName, {
    level: 'info',
    tags: {
      category: 'analytics',
      userId,
    },
    extra: {
      userId,
      ...payload,
    },
  });
}

/**
 * Track a buyer-specific event
 */
export function trackBuyerEvent(
  buyerId: string,
  eventName: string,
  payload: AnalyticsPayload = {},
): void {
  trackUserEvent(buyerId, eventName, {
    actorRole: "buyer",
    ...payload,
  });
}

/**
 * Track a dealer-specific event
 */
export function trackDealerEvent(
  dealershipId: string,
  eventName: string,
  payload: AnalyticsPayload = {},
): void {
  trackUserEvent(dealershipId, eventName, {
    actorRole: "dealer",
    dealershipId,
    ...payload,
  });
}

function captureMetric(callback: () => void): void {
  try {
    callback();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics metric failed]", error);
    }
  }
}

export function trackMetricCount(
  metricName: string,
  value = 1,
  attributes: MetricAttributes = {},
): void {
  captureMetric(() => {
    Sentry.metrics.count(metricName, value, { attributes });
  });
}

export function trackMetricGauge(
  metricName: string,
  value: number,
  attributes: MetricAttributes = {},
): void {
  captureMetric(() => {
    Sentry.metrics.gauge(metricName, value, { attributes });
  });
}

export function trackMetricDistribution(
  metricName: string,
  value: number,
  attributes: MetricAttributes = {},
  unit?: string,
): void {
  captureMetric(() => {
    Sentry.metrics.distribution(metricName, value, { attributes, unit });
  });
}

/**
 * Core marketplace events to track
 */
export const MarketplaceEvents = {
  // Request lifecycle events
  REQUEST_CREATED: "request.created",
  REQUEST_OPEN_CREATED: "request.open_created",
  REQUEST_FIXED_CREATED: "request.fixed_created",
  REQUEST_CREATE_FAILED: "request.create_failed",
  REQUEST_VALIDATION_FAILED: "request.validation_failed",
  REQUEST_SCORED: "request.scored",
  REQUEST_ASSIGNED: "request.assigned",
  REQUEST_ASSIGNMENT_FAILED: "request.assignment_failed",
  REQUEST_OFFER_LIMIT_REACHED: "request.offer_limit_reached",
  REQUEST_DECLINED: "request.declined",
  REQUEST_BOOKMARKED: "request.bookmarked",
  REQUEST_INTERESTED: "request.interested",

  // Buyer events
  BUYER_REQUEST_CREATED: "buyer.request_created",
  BUYER_REQUEST_SCORED: "buyer.request_scored",
  BUYER_REQUEST_ABANDONED: "buyer.request_abandoned",
  BUYER_OFFER_COMPARISON_VIEWED: "buyer.offer_comparison_viewed",
  BUYER_OFFER_VIEWED: "buyer.offer_viewed",
  BUYER_OFFER_SELECTED: "buyer.offer_selected",
  BUYER_PRICE_VS_VALUE_CLICK: "buyer.price_vs_value_click",
  BUYER_DEALER_REVIEW_SUBMITTED: "buyer.dealer_review_submitted",

  // Dealer events
  DEALER_ONBOARDED: "dealer.onboarded",
  DEALER_REQUEST_ASSIGNED: "dealer.request_assigned",
  DEALER_REQUEST_DECLINED: "dealer.request_declined",
  DEALER_OFFER_SUBMITTED: "dealer.offer_submitted",
  DEALER_OFFER_ACCEPTED: "dealer.offer_accepted",
  DEALER_OFFER_REJECTED: "dealer.offer_rejected",
  DEALER_BADGE_AWARDED: "dealer.badge_awarded",
  DEALER_METRICS_UPDATED: "dealer.metrics_updated",
  DEALER_REVIEW_SUBMITTED: "dealer.review_submitted",
  DEALER_PERFORMANCE_DASHBOARD_VIEWED: "dealer.performance.dashboard_viewed",
  DEALER_PERFORMANCE_UPDATED: "dealer.performance.updated",

  // Matching events
  MATCHING_ASSIGNMENTS_GENERATED: "matching.assignments_generated",
  MATCHING_NO_DEALERS_FOUND: "matching.no_dealers_found",
  MATCHING_OPEN_SEARCH_USED: "matching.open_search_used",
  MATCHING_LOW_CONFIDENCE_MATCH: "matching.low_confidence_match",
  MATCHING_BROAD_MATCH_GENERATED: "matching.broad_match_generated",
  MATCH_JOB_STARTED: "match.job_started",
  MATCH_JOB_COMPLETED: "match.job_completed",
  MATCH_DB_QUERY: "match.db_query",

  // Dealer verification events
  DEALER_VERIFICATION_STARTED: "dealer.verification_started",
  DEALER_VERIFICATION_COMPLETED: "dealer.verification_completed",
  DEALER_VERIFIED: "dealer.verified",
  DEALER_VERIFICATION_FAILED: "dealer.verification_failed",

  // Offer events
  OFFER_SUBMITTED: "offer.submitted",
  OFFER_QUALITY_SCORED: "offer.quality_scored",
  OFFER_COMPLETENESS_SCORED: "offer.completeness_scored",
  OFFER_INCOMPLETE_ATTEMPT: "offer.incomplete_attempt",
  OFFER_BLOCKED_INCOMPLETE: "offer.blocked_incomplete",
  OFFER_ACCEPTED: "offer.accepted",
  OFFER_REJECTED: "offer.rejected",
  OFFER_SUBMISSION_BLOCKED: "offer.submission_blocked",
  OFFER_CAP_REACHED: "offer.cap_reached",
  OFFER_ASSIGNMENT_BLOCKED: "offer.assignment_blocked",

  // Authorization events
  AUTH_CHECK_FAILED: "auth.check_failed",
  AUTH_UNAUTHORIZED_ATTEMPT: "auth.unauthorized_attempt",

  // Image upload events
  IMAGE_UPLOAD_STARTED: "image.upload_started",
  IMAGE_UPLOADED: "image.uploaded",
  IMAGE_UPLOAD_ERROR: "image.upload_error",

  // Moderation events
  MODERATION_FLAGGED: "moderation.flagged",
  MODERATION_REVIEWING: "moderation.reviewing",
  MODERATION_RESOLVED: "moderation.resolved",
  MODERATION_DISMISSED: "moderation.dismissed",
  MODERATION_DASHBOARD_VIEWED: "moderation.dashboard_viewed",
  MODERATION_METRICS_RECORDED: "moderation.metrics_recorded",
  SPAM_DETECTED: "spam.detected",

  // System events
  SYSTEM_ERROR: "system.error",
};
