# Implementation Roadmap

This file contains the detailed technical implementation plan, database schema changes, and development tasks. Use this alongside `agents.md` for strategic direction.

---

## Priority 1: Critical Safety & Marketplace Control

These must be implemented first to prevent reverse-auction dynamics and build marketplace health.

### 1.1 Offer cap per request ✅ IMPLEMENTED
**Why**: Prevents spam, protects buyers, reduces noise for dealers.
- ✅ Add `buyerRequests.offerCap` (default 4)
- ✅ Add `buyerRequests.activeOfferCount` (computed)
- ✅ Create `request_assignments` table to gate who can respond
- ✅ Reject offer creation if `activeOfferCount >= offerCap`
- ✅ Analytics: `offer.submission_blocked`, `request.offer_limit_reached`

**Files affected**: `src/db/schema.ts`, `src/lib/services/offers.ts`, `src/lib/algorithms/carMatching.ts`, `src/app/actions/offers.ts`

**Implementation Summary**:
- Created migration `0005_request_assignments_and_offer_controls.sql` with schema changes
- Built `src/lib/services/requestAssignments.ts` with:
  - `assignDealersToRequest()` - assigns top 3-5 dealers to each request
  - `calculateRequestQualityScore()` - scores requests 0-100 based on completeness
  - `getActiveAssignmentsForRequest()` - fetches active assignments for offer cap enforcement
  - `isDealershipAssignedToRequest()` - authorization check
  - `getActiveOfferCount()` - counts submitted offers
  - `updateRequestOfferCount()` - updates persistent count
- Updated `src/lib/services/offers.ts` to:
  - Check dealership assignment before creating offer
  - Enforce offer cap (reject if at limit)
  - Track offer count per request
- Updated `src/lib/services/buyerRequests.ts` to:
  - Trigger assignment job after request creation (fire-and-forget)
  - Calculate and track quality score
- Created `src/lib/analytics.ts` with event tracking infrastructure
- Wired analytics events for:
  - Request creation, scoring, assignment
  - Offer submission, cap reached, assignment blocked
  - Matching success/failure

**Next**: Move to task 1.2 (Dealer verification state)

### 1.2 Dealer verification state ✅ IMPLEMENTED
**Why**: Creates trust signal and prevents anonymous sellers.
- Add `dealerships.verificationState` enum: `draft | pending | verified | rejected`
- Add `dealerships.verifiedAt`: timestamp
- Block unverified dealers from responding to requests
- Show verification badge in buyer-facing views
- Analytics: `dealer.verification_started`, `dealer.verified`, `dealer.verification_failed`

**Files affected**: `src/db/schema.ts`, `src/lib/services/dealerships.ts`, `src/app/actions/dealerOnboarding.ts`

### 1.3 Request quality score ✅ IMPLEMENTED
**Why**: Triages better leads and helps dealers quickly prioritize.
- Add `buyerRequests.qualityScore` (0-100)
- Calculate on request creation based on: specificity, budget clarity, location accuracy
- Show score to buyer during creation (guidance)
- Show score to dealers in request list
- Analytics: `request.scored`, `request.quality_changed`

**Files affected**: `src/db/schema.ts`, `src/lib/services/buyerRequests.ts`, buyer request form

### 1.4 Improved offer model with quality scoring ✅ IMPLEMENTED
**Why**: Enables comparison on service value, not just price.
- Add required fields: `deliveryEstimate`, `inspectionIncluded`, `financingPossible`, `warrantySummary`
- Add `offerQualityScore` (computed from field completeness + dealer reputation)
- Block incomplete offers from submission
- Analytics: `offer.quality_scored`, `offer.incomplete_attempt`

**Files affected**: `src/db/schema.ts`, `src/app/actions/offers.ts`, `src/lib/services/offers.ts`

### 1.5 Request assignment & routing ✅ IMPLEMENTED
**Why**: Prevents broadcast-to-all behavior; curates matches.
- ✅ Create `request_assignments` table with fields: `id`, `requestId`, `dealershipId`, `assignedAt`, `isActive`, `status`
- ✅ Implement `assignDealersToRequest(requestId)` service (queries geography + capability + verification, assigns top 3-5 dealers by match score)
- ✅ Enforce: only assigned dealers can submit offers
- ✅ Matching algorithm hardened to require explicit make match for capability-filtered dealers
- ✅ Dealer UI updated to show only assigned/matching requests with capability labels
- ✅ Analytics wired to Sentry: `request.assigned`, `request.assignment_failed`, `matching.assignments_generated`, `dealer.request_assigned`, `offer.assignment_blocked`
- ✅ E2E verified: Volvo-only dealers see only Volvo requests
- ✅ Legacy assignments backfilled for open requests

**Implementation Summary**:
- Created `src/lib/services/requestAssignments.ts` with assignment logic
- Hardened `src/lib/algorithms/carMatching.ts` to enforce capability matching
- Updated dealer dashboard & requests pages to show assigned requests with capability labels
- Integrated `src/lib/analytics.ts` with Sentry for event tracking
- Created backfill script for legacy data
- All unit tests passing; TypeScript compilation clean

**Files affected**: `src/db/schema.ts`, `src/lib/services/requestAssignments.ts`, `src/lib/algorithms/carMatching.ts`, `src/lib/analytics.ts`, dealer dashboard/requests pages

### 1.6 Authorization checks in services ✅ IMPLEMENTED
**Why**: Prevents cross-user/cross-dealership data leaks.
- ✅ Add service-level validation in `createOfferForRequest`:
  - ✅ verify dealershipId belongs to dealerUserId
  - ✅ verify request is assigned to dealershipId
  - ✅ verify dealer is verified or pending
- ✅ Add similar checks to buyer request, dealership, dealer capability, verification, and offer acceptance/rejection writes
- ✅ Analytics: `auth.check_failed`, `auth.unauthorized_attempt`

**Files affected**: `src/lib/services/offers.ts`, `src/lib/services/dealerships.ts`, `src/lib/services/authorization.ts`, `src/lib/services/dealerCapabilities.ts`, `src/lib/services/dealerVerification.ts`, `src/lib/services/buyerRequests.ts`, `src/app/actions/dealerOnboarding.ts`, `src/app/actions/dealerCapabilities.ts`, `src/lib/analytics.ts`

**Implementation Summary**:
- Added centralized authorization analytics helpers and marketplace event names.
- Hardened offer creation with dealership membership, assignment, and verification-state checks.
- Hardened buyer offer accept/reject paths with unauthorized-attempt tracking.
- Required authenticated dealership manager access for dealership and capability updates.
- Required authenticated admin access for dealer verification state changes.
- Updated dealer onboarding and capability server actions to pass authenticated user IDs into services.

### 1.7 Basic analytics instrumentation ✅ IMPLEMENTED
**Why**: See early marketplace health.
- ✅ Create `src/lib/analytics.ts` or use existing event tracking
- ✅ Instrument:
  - ✅ request creation, scoring, assignment
  - ✅ offer submission, quality scoring
  - ✅ offer acceptance, rejection
  - ✅ dealer verification flow
- ✅ Use consistent event names across codebase

**Files affected**: `src/lib/analytics.ts` (new), all services and actions

**Implementation Summary**:
- Normalized analytics helpers so role-specific tracking no longer double-prefixes event names.
- Added canonical marketplace events for request lifecycle, offer lifecycle, verification outcomes, blocked submissions, and offer-limit events.
- Added request scoring and creation events after request persistence.
- Added non-blocking assignment failure tracking for the background assignment job.
- Added request assignment success/failure events in assignment routing.
- Added offer quality scoring, incomplete attempt, submission blocked, accepted, and rejected events.
- Added verification outcome events for verified and rejected dealers.

### 1.8 Image upload & storage decision
**Why**: Avoid rework; images build trust for requests/offers.
- Decide: Vercel Blob or S3-compatible
- Implement signed upload flow
- Store URLs in `buyerRequests.imageUrls` and `offers.imageUrls`
- Validate file type and size on client and server
- Analytics: `image.upload_started`, `image.uploaded`, `image.upload_error`

**Files affected**: `src/lib/storage.ts` (new), request/offer forms, schema

---

## Priority 2: Trust & UX Improvements

### 2.1 Offer comparison UX improvement
**Why**: Discourage price-first selection; emphasize value.
- Rank offers by `offerQualityScore`, not price
- Show trust signals first: verified badge, dealer rating, response time
- Hide price until expanded/detail view
- Show warranty, delivery, service package prominently
- Analytics: `buyer.offer_comparison_viewed`, `buyer.offer_selected`, `buyer.price_vs_value_click`

**Files affected**: buyer offer list/detail pages

### 2.2 Dealer reputation & badges
**Why**: Elevates high-quality supply; creates differentiation.
- Add `dealerships.ratingAverage`, `completedMatches`, `responseRate`
- Award badges:
  - ✓ Verified
  - ⭐ High Rating (4.5+)
  - 🚀 Fast Response (<2 hours)
  - 🏆 Top Performer
- Update metrics on offer acceptance/rejection
- Show in buyer offer cards and dealer profile
- Analytics: `dealer.badge_awarded`, `dealer.metrics_updated`

**Files affected**: schema, dealer profile components, buyer offer cards

### 2.3 Dealer request controls
**Why**: Gives dealers agency; reduces churn.
- Add `dealer_request_actions` table:
  - `id`, `requestId`, `dealershipId`, `userId`, `action` (`declined` | `bookmarked` | `interested`), `reason`
- Implement decline/bookmark/interested flows in dealer matching page
- Use actions to tune future routing
- Analytics: `request.declined`, `request.bookmarked`, `request.interested`

**Files affected**: dealer matching page, new service `dealerRequestActions`

### 2.4 Offer completeness scoring
**Why**: Raise average offer quality; block low-effort submissions.
- Score offers based on field completeness:
  - required: price, year, km, make, model
  - value-add: warranty, delivery, financing, inspection, message
- Compute `completenessScore` before and after submission
- Block offers with < 60% completeness (configurable)
- show inline feedback on form
- Analytics: `offer.completeness_scored`, `offer.blocked_incomplete`

**Files affected**: `src/lib/services/offers.ts`, dealer offer form

### 2.5 Notification system foundation
**Why**: Engagement and response speed.
- Expand notification types: `request_assigned`, `offer_assigned`, `offer_accepted`, `offer_rejected`, `dealer_verified`, `request_expiring`
- Implement notification service with email + in-app
- Add unread count tracking
- Show notifications prominently in buyer/dealer dashboards
- Analytics: `notification.sent`, `notification.read`, `notification.actioned`

**Files affected**: `src/lib/services/notifications.ts`, notification components

---

## Priority 3: Scaling & Monetization Foundation

### 3.1 Improved matching queries
**Why**: Necessary for nationwide expansion; current code is O(N).
- Refactor `carMatching.ts`:
  - filter dealers by geography at DB level (use PostGIS or spatial index)
  - filter by capability (verified, makes overlap) before scoring
  - use indexed queries for status and location
  - cache results or use background jobs for assignment
- Move assignment out of synchronous request flow to background job
- Analytics: `match.job_started`, `match.job_completed`, `match.cache_hit`

**Files affected**: `src/lib/algorithms/carMatching.ts`, new background job or queue

### 3.2 Dealer performance metrics dashboard
**Why**: Supply-side visibility improves retention.
- Compute aggregated metrics:
  - response rate (responded / assigned)
  - acceptance rate (accepted / submitted offers)
  - average time to response
  - average offer quality score
  - completed deals
- Display on dealer dashboard with trends
- Use for prioritizing future routing
- Analytics: `dealer.metrics_viewed`, `dealer.performance_updated`

**Files affected**: dealer dashboard, new aggregated queries

### 3.3 Lead credits / subscription readiness
**Why**: Prepare monetization without forcing early.
- Design credit schema:
  - `dealerships.hasActiveSubscription`, `creditsRemaining`
  - `offer_submissions.credit_used` (true/false)
- Implement feature flag to enable/disable credit checking
- Wire lead assignment to check credits before routing
- Do not enforce until dealer base is stable
- Analytics: `credits.checked`, `credits.insufficient`, `credits.refilled`

**Files affected**: `src/db/schema.ts`, `src/lib/services/offers.ts`

### 3.4 Admin moderation dashboard
**Why**: Maintain quality at scale.
- Create admin route: `/admin/moderation`
- Add moderation flags table:
  - `id`, `entityType` (request | offer | dealership), `entityId`, `reason`, `reporterId`, `status` (flagged | reviewing | resolved | dismissed)
- UI to review flagged content, take action (suspend, remove, contact)
- Analytics: `moderation.flagged`, `moderation.resolved`, `spam.detected`

**Files affected**: `src/db/schema.ts`, new admin route, moderation service

### 3.5 Event-based notification queue design
**Why**: Support higher volume and retry logic.
- Design notification queue (Bull, Inngest, or similar):
  - consume events: request_assigned, offer_submitted, offer_accepted, etc.
  - queue email + in-app notifications
  - implement retry logic
  - store delivery status
- Do not implement immediately; design the interface
- Analytics: `queue.item_processed`, `queue.retry_exceeded`

**Files affected**: `src/lib/queue/` (design), event emitters across services

---

## Schema Changes

### New tables

```sql
-- Request assignments
CREATE TABLE request_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(32) DEFAULT 'assigned',
  UNIQUE(request_id, dealership_id)
);

-- Dealer request actions
CREATE TABLE dealer_request_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'declined', 'bookmarked', 'interested'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, dealership_id, action)
);

-- Moderation flags
CREATE TABLE moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(32) NOT NULL, -- 'request', 'offer', 'dealership'
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  reporter_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  status VARCHAR(32) DEFAULT 'flagged', -- 'flagged', 'reviewing', 'resolved', 'dismissed'
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

### Modified tables

```sql
-- Add to dealerships
ALTER TABLE dealerships ADD COLUMN verification_state VARCHAR(32) DEFAULT 'draft';
ALTER TABLE dealerships ADD COLUMN verified_at TIMESTAMPTZ;
ALTER TABLE dealerships ADD COLUMN response_rate INTEGER DEFAULT 0;
ALTER TABLE dealerships ADD COLUMN rating_average DOUBLE PRECISION;
ALTER TABLE dealerships ADD COLUMN completed_matches INTEGER DEFAULT 0;

-- Fix GPS coordinates
ALTER TABLE dealerships ALTER COLUMN lat TYPE DOUBLE PRECISION USING lat::DOUBLE PRECISION;
ALTER TABLE dealerships ALTER COLUMN lng TYPE DOUBLE PRECISION USING lng::DOUBLE PRECISION;

-- Add to buyer_requests
ALTER TABLE buyer_requests ADD COLUMN quality_score INTEGER DEFAULT 0;
ALTER TABLE buyer_requests ADD COLUMN intent_score INTEGER DEFAULT 0;
ALTER TABLE buyer_requests ADD COLUMN assignment_status VARCHAR(32) DEFAULT 'pending';
ALTER TABLE buyer_requests ADD COLUMN offer_cap INTEGER DEFAULT 4;
ALTER TABLE buyer_requests ADD COLUMN active_offer_count INTEGER DEFAULT 0;

-- Add to offers
ALTER TABLE offers ADD COLUMN offer_quality_score INTEGER DEFAULT 0;
ALTER TABLE offers ADD COLUMN completeness_score INTEGER DEFAULT 0;
ALTER TABLE offers ADD COLUMN delivery_estimate VARCHAR(200);
ALTER TABLE offers ADD COLUMN service_package TEXT;
ALTER TABLE offers ADD COLUMN inspection_included BOOLEAN;
ALTER TABLE offers ADD COLUMN response_time_seconds INTEGER;

-- Indexes
CREATE INDEX idx_buyer_requests_status ON buyer_requests(status);
CREATE INDEX idx_buyer_requests_location ON buyer_requests(location_city);
CREATE INDEX idx_dealerships_verified ON dealerships(verified);
CREATE INDEX idx_offers_request_id ON offers(request_id);
CREATE INDEX idx_offers_dealership_id ON offers(dealership_id);
```

---

## Service Functions to Create/Update

### New services

**`src/lib/services/matching.ts`**
```ts
export async function assignDealersToRequest(requestId: string): Promise<void>
export async function getAssignedRequestsForDealer(dealershipId: string, limit?: number): Promise<AssignedRequest[]>
export async function getAvailableDealersForRequest(requestId: string): Promise<Dealer[]>
export async function calculateRequestQualityScore(request: BuyerRequest): number
```

**`src/lib/services/dealerVerification.ts`**
```ts
export async function startDealerVerification(dealershipId: string, payload: any): Promise<void>
export async function updateDealerVerificationState(dealershipId: string, state: VerificationState, notes?: string): Promise<void>
export async function getDealerPerformanceMetrics(dealershipId: string): Promise<PerformanceMetrics>
```

**`src/lib/services/dealerRequestActions.ts`**
```ts
export async function declineBuyerRequest(requestId: string, dealershipId: string, reason?: string): Promise<void>
export async function bookmarkBuyerRequest(requestId: string, dealershipId: string): Promise<void>
export async function markRequestAsInterested(requestId: string, dealershipId: string): Promise<void>
```

**`src/lib/services/analytics.ts`**
```ts
export function trackEvent(eventName: string, payload: Record<string, any>): void
export function trackBuyerEvent(buyerId: string, eventName: string, payload: Record<string, any>): void
export function trackDealerEvent(dealershipId: string, eventName: string, payload: Record<string, any>): void
```

**`src/lib/services/moderation.ts`**
```ts
export async function flagEntity(entityType: string, entityId: string, reason: string, reporterId: string): Promise<void>
export async function reviewFlaggedItem(flagId: string, action: 'dismiss' | 'suspend' | 'remove', notes?: string): Promise<void>
export async function listFlaggedItems(status?: string, limit?: number): Promise<Flag[]>
```

### Updated services

**`src/lib/services/offers.ts`**
- Add offer cap check in `createOfferForRequest`
- Add dealer verification check
- Add request assignment verification
- Add offer quality scoring
- Calculate completeness score

**`src/lib/services/buyerRequests.ts`**
- Calculate quality score on creation
- Calculate intent score on creation
- Trigger assignment job on creation

---

## Server Actions

Create or update these in `src/app/actions/`:

- `createBuyerRequestAction` — calculate quality/intent, trigger assignment
- `createOfferAction` — check cap, verify dealer, compute quality
- `acceptOfferAction` — accept offer, reject others, notify
- `rejectOfferAction` — reject offer, notify
- `declineBuyerRequestAction` — dealer declines request
- `bookmarkBuyerRequestAction` — dealer bookmarks request
- `submitVerificationDocuments` — dealer submits verification
- `adminResolveFlagAction` — moderator takes action on flagged content

---

## Analytics Events

### Buyer events
- `buyer.request_created` → include quality_score, intent_score
- `buyer.request_viewed`
- `buyer.offer_comparison_viewed` → include offer_count
- `buyer.offer_selected` → include offer_id, price, quality_score
- `buyer.request_abandoned`

### Dealer events
- `dealer.onboarded`
- `dealer.verification_submitted`
- `dealer.verified` or `dealer.verification_rejected`
- `dealer.request_assigned`
- `dealer.request_declined`
- `dealer.offer_submitted` → include quality_score, completeness_score
- `dealer.offer_accepted` → include offer_value
- `dealer.offer_rejected`

### Matching events
- `matching.assignments_generated` → include request_count, dealer_count
- `matching.no_dealers_found` → include request_id, reason
- `matching.cache_hit` or `match.db_query`

### Notification events
- `notification.sent` → include type, recipient_role
- `notification.read`

---

## Testing Checklist

### Unit tests to add
- `calculateRequestQualityScore` with various input combinations
- `calculateOfferQualityScore` with missing vs complete fields
- `assignDealersToRequest` routing logic
- `createOfferForRequest` rejects when:
  - offer cap reached
  - request not assigned to dealer
  - dealer not verified
- `getDealerPerformanceMetrics` calculations
- Authorization checks in each service

### Integration tests to add
- End-to-end: buyer request → matching → dealer assignment → offer submission
- Dealer decline → reassignment to next dealer
- Offer comparison UI ranks by quality, not price
- Image upload validation
- Notification delivery

### Security tests to add
- Dealer cannot see other dealerships' requests
- Buyer cannot access other buyers' requests
- Unauthorized user cannot create offers
- Cross-dealership offer rejection blocked

### Performance tests
- Matching for 1,000 dealers should not scan full table
- Assignment response < 500ms
- Request detail page loads within 1s

---

## Implementation order

1. Create `request_assignments` table and assignment service
2. Add dealer verification state and checks
3. Add request quality scoring
4. Add offer quality model and completeness scoring
5. Add offer cap enforcement
6. Add dealer reputation metrics
7. Improve matching queries
8. Add admin moderation
9. Add analytics instrumentation
10. Add notification foundation

**Critical path**: complete items 1–4 before expanding features. These form the foundation for a healthy marketplace.

---

## Questions to resolve early

- **Image storage**: Vercel Blob or S3? Signed URLs or direct serving?
- **Background jobs**: Bull Queue, Inngest, pg_boss, or cron?
- **Cache strategy**: Redis, in-process, or pre-computed?
- **Notification queue**: Real-time or async?
- **Moderation scale**: Manual review only or automated flags?
- **Lead credits pricing**: Subscription tier or pay-per-response?

---

## Do-first summary

Focus on these three in the first sprint:
1. **Request assignment + offer cap** — stop broadcast behavior
2. **Dealer verification state** — enable trust signal
3. **Offer quality model** — prevent price-only comparison

Once those are solid, everything else becomes incremental UI and operational improvements.
