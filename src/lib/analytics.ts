// src/lib/analytics.ts
/**
 * Analytics event tracking integrated with Sentry.
 * Events are captured in Sentry and can be viewed in the Sentry dashboard.
 */
import * as Sentry from '@sentry/nextjs';

export interface AnalyticsEvent {
  eventName: string;
  payload: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

/**
 * Track a user-agnostic event
 */
export function trackEvent(eventName: string, payload: Record<string, any> = {}): void {
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
  payload: Record<string, any> = {},
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
  payload: Record<string, any> = {},
): void {
  trackUserEvent(buyerId, `buyer.${eventName}`, payload);
}

/**
 * Track a dealer-specific event
 */
export function trackDealerEvent(
  dealershipId: string,
  eventName: string,
  payload: Record<string, any> = {},
): void {
  trackUserEvent(dealershipId, `dealer.${eventName}`, payload);
}

/**
 * Core marketplace events to track
 */
export const MarketplaceEvents = {
  // Buyer events
  BUYER_REQUEST_CREATED: "buyer.request_created",
  BUYER_REQUEST_SCORED: "buyer.request_scored",
  BUYER_REQUEST_ABANDONED: "buyer.request_abandoned",
  BUYER_OFFER_VIEWED: "buyer.offer_viewed",
  BUYER_OFFER_SELECTED: "buyer.offer_selected",

  // Dealer events
  DEALER_ONBOARDED: "dealer.onboarded",
  DEALER_REQUEST_ASSIGNED: "dealer.request_assigned",
  DEALER_REQUEST_DECLINED: "dealer.request_declined",
  DEALER_OFFER_SUBMITTED: "dealer.offer_submitted",
  DEALER_OFFER_ACCEPTED: "dealer.offer_accepted",
  DEALER_OFFER_REJECTED: "dealer.offer_rejected",

  // Matching events
  MATCHING_ASSIGNMENTS_GENERATED: "matching.assignments_generated",
  MATCHING_NO_DEALERS_FOUND: "matching.no_dealers_found",

  // Dealer verification events
  DEALER_VERIFICATION_STARTED: "dealer.verification_started",
  DEALER_VERIFICATION_COMPLETED: "dealer.verification_completed",

  // Offer events
  OFFER_SUBMITTED: "offer.submitted",
  OFFER_CAP_REACHED: "offer.cap_reached",
  OFFER_ASSIGNMENT_BLOCKED: "offer.assignment_blocked",

  // Authorization events
  AUTH_CHECK_FAILED: "auth.check_failed",
  AUTH_UNAUTHORIZED_ATTEMPT: "auth.unauthorized_attempt",

  // System events
  SYSTEM_ERROR: "system.error",
};
