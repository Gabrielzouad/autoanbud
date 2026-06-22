# Implementation Roadmap

This file contains the detailed technical implementation plan, database schema changes, and development tasks. Use this alongside `agents.md` for strategic direction.

---

# Priority 1: Critical Safety & Marketplace Control

These must be implemented first to prevent reverse-auction dynamics and build marketplace health.

## 1.1 Offer cap per request ✅ IMPLEMENTED

**Why**: Prevents spam, protects buyers, reduces noise for dealers.

* ✅ Add `buyerRequests.offerCap` (default 4)
* ✅ Add `buyerRequests.activeOfferCount` (computed)
* ✅ Create `request_assignments` table to gate who can respond
* ✅ Reject offer creation if `activeOfferCount >= offerCap`
* ✅ Analytics: `offer.submission_blocked`, `request.offer_limit_reached`

---

## 1.2 Dealer verification state ✅ IMPLEMENTED

**Why**: Creates trust signal and prevents anonymous sellers.

* Add `dealerships.verificationState` enum: `draft | pending | verified | rejected`
* Add `dealerships.verifiedAt`: timestamp
* Block unverified dealers from responding to requests
* Show verification badge in buyer-facing views
* Analytics: `dealer.verification_started`, `dealer.verified`, `dealer.verification_failed`

---

## 1.3 Request quality score ✅ IMPLEMENTED

**Why**: Triages better leads and helps dealers quickly prioritize.

* Add `buyerRequests.qualityScore` (0-100)
* Calculate on request creation based on: specificity, budget clarity, location accuracy
* Show score to buyer during creation (guidance)
* Show score to dealers in request list
* Analytics: `request.scored`, `request.quality_changed`

---

## 1.4 Improved offer model with quality scoring ✅ IMPLEMENTED

**Why**: Enables comparison on service value, not just price.

* Add required fields: `deliveryEstimate`, `inspectionIncluded`, `financingPossible`, `warrantySummary`
* Add `offerQualityScore` (computed from field completeness + dealer reputation)
* Block incomplete offers from submission
* Analytics: `offer.quality_scored`, `offer.incomplete_attempt`

---

## 1.5 Request assignment & routing ✅ IMPLEMENTED

**Why**: Prevents broadcast-to-all behavior; curates matches.

* Create `request_assignments` table
* Implement dealer assignment service
* Enforce assignment-based offer submission
* Harden matching logic
* Analytics wired to Sentry

---

## 1.6 Authorization checks in services ✅ IMPLEMENTED

**Why**: Prevents cross-user/cross-dealership data leaks.

* Add service-level validation
* Add assignment authorization
* Add verification-state checks
* Analytics: `auth.check_failed`, `auth.unauthorized_attempt`

---

## 1.7 Basic analytics instrumentation ✅ IMPLEMENTED

**Why**: See early marketplace health.

* Instrument request creation
* Instrument offer lifecycle
* Instrument verification flow
* Use consistent analytics naming

---

## 1.8 Image upload & storage decision ✅ IMPLEMENTED

**Why**: Avoid rework; images build trust for requests/offers.

* Vercel Blob upload flow
* Request image storage
* Validation for image uploads
* Analytics for upload lifecycle

---

# Priority 2: Trust & UX Improvements

## 2.1 Offer comparison UX improvement ✅ IMPLEMENTED

**Why**: Discourage price-first selection; emphasize value.

* Rank by quality instead of price
* Show trust signals first
* Hide price until expanded view
* Show warranty, financing, delivery prominently

---

## 2.2 Dealer reputation & badges ✅ IMPLEMENTED

**Why**: Elevates high-quality supply.

* Add dealer metrics
* Add dealer review system
* Badge system
* Reputation recalculation

---

## 2.3 Dealer request controls ✅ IMPLEMENTED

**Why**: Gives dealers agency; reduces churn.

* Dealer actions table
* Decline/bookmark/interested flows
* Queue prioritization
* Analytics for dealer actions

---

## 2.4 Offer completeness scoring ✅ IMPLEMENTED

**Why**: Raise average offer quality.

* Score offer completeness
* Block low-quality offers
* Dealer feedback UI
* Completeness analytics

---

## 2.5 Notification system foundation ⏸ DEFERRED

**Why**: Engagement and response speed.

* Deferred until production email/domain setup exists
* In-app + email notifications
* Unread tracking
* Dashboard notifications

---

## 2.6 Open Search vs Fixed Search Request Handling 🚧 PLANNED

**Why**: The marketplace currently assumes structured vehicle requests (`make/model`). Open-ended buyer intent breaks matching and dealer routing.

### Problem

There are now two buyer request types:

### Fixed Search

Buyer specifies:

* make
* model
* year
* gearbox
* fuel type
* etc.

### Open Search

Buyer does NOT specify:

* make
* model

Instead they may describe:

* budget
* SUV/family car
* electric vehicle
* towing needs
* city driving
* cargo requirements
* seat count
* general preferences

Current matching logic assumes make/model always exists, which creates issues with:

* dealer assignment
* SQL make overlap filters
* scoring algorithms
* dealer feeds
* ranking logic
* matching quality

---

### Required Database Changes

Add request type support:

```sql
ALTER TABLE buyer_requests
ADD COLUMN request_type VARCHAR(20) DEFAULT 'fixed';
```

Allowed values:

* `fixed`
* `open`

---

### Matching Logic Refactor

#### Fixed Search

Continue using:

* make/model weighted matching
* strict capability matching
* current assignment logic

#### Open Search

Fallback matching should use:

* body type
* fuel type
* budget range
* location proximity
* dealer specialization
* dealership inventory categories
* free-text request analysis
* broad category scoring

Example:

```txt
"Looking for a family SUV under 400k"
```

Should match:

* SUV dealerships
* family vehicle specialists
* nearby dealerships
* dealers within price range

without requiring make/model.

---

### Matching Algorithm Changes

#### `src/lib/algorithms/carMatching.ts`

Refactor matching paths:

```ts
if (request.requestType === 'open') {
  // broad matching logic
} else {
  // current make/model matching
}
```

Required changes:

* bypass strict make overlap SQL filters
* avoid `ANY()` make matching for open requests
* create separate scoring weights
* reduce dependency on exact capability arrays
* add confidence scoring for broad matches

---

### Dealer UI Improvements

#### Fixed Search Example

```txt
Volvo XC90 2022
```

#### Open Search Example

```txt
Open Search:
Looking for family SUV under 400k
```

Add visual indicators:

* Fixed Match
* Open Search
* AI Suggested
* Broad Match

---

### Analytics

Track:

* `request.open_created`
* `request.fixed_created`
* `matching.open_search_used`
* `matching.low_confidence_match`
* `matching.broad_match_generated`

---

## 2.7 Buyer Request Upload Failure Investigation 🚧 PLANNED

**Why**: Buyer request creation is currently failing in some flows.

### Investigation Areas

Investigate:

* server action failures
* upload validation errors
* image upload race conditions
* database insert failures
* payload size limits
* authentication/session issues
* form state resets
* file upload completion timing
* server timeout handling

---

### Add Diagnostics

Add structured logging:

* payload size
* uploaded image count
* upload duration
* validation failures
* DB insert timing
* user/session information
* upload completion state

---

### Error Tracking

Integrate:

* Sentry breadcrumbs
* upload tracing
* request creation tracing
* server action error reporting
* failed payload snapshots

---

### Recovery UX

Improve user recovery:

* local draft persistence
* retry uploads
* partial save support
* upload progress states
* better validation messages
* upload retry queue

---

### Analytics

Track:

* `request.create_failed`
* `request.upload_failed`
* `request.validation_failed`
* `request.retry_success`
* `request.partial_saved`

---

## 2.8 Authentication, Geolocation & UX Stabilization 🚧 PLANNED

**Why**: Signup/login instability directly affects matching quality, onboarding, and conversion.

### Current Problems

#### Geolocation API Failures

Location retrieval currently fails during:

* signup
* onboarding
* buyer request creation
* dealer onboarding

This impacts:

* dealership matching
* routing quality
* assignment accuracy
* search relevance
* location-based recommendations

---

### Required Changes

#### Fallback Location Strategy

Implement layered fallback logic:

1. Browser Geolocation API
2. IP-based geolocation
3. Manual city/address entry
4. Deferred location completion

Location failures should NEVER block signup.

---

### Signup vs Signin UX Issues

Current UX confusion:

* unclear separation between signup and login
* onboarding flow ambiguity
* unclear buyer vs dealer entry paths
* role selection confusion
* inconsistent redirect handling

---

### UX Improvements

#### Separate Authentication Flows

Clearly separate:

* Sign In
* Create Account

Avoid mixing flows in one screen.

---

### Multi-Step Signup Flow

Suggested onboarding flow:

#### Step 1

* email
* password

#### Step 2

* select role

  * buyer
  * dealer

#### Step 3

* optional location permission

#### Step 4

* profile completion

---

### Geolocation UX Improvements

Add:

* loading states
* retry button
* skip option
* manual override
* address autocomplete
* fallback city selection

---

### Matching Safety Fallbacks

If GPS is unavailable:

* fallback to city-based matching
* lower confidence score
* prompt later for precise location
* continue onboarding without blocking

---

### Analytics

Track:

* `auth.signup_started`
* `auth.signup_completed`
* `auth.location_denied`
* `auth.location_failed`
* `auth.location_manual_entry`
* `auth.signup_abandoned`
* `auth.role_selected`

---

# Priority 3: Scaling & Monetization Foundation

## 3.1 Improved matching queries ✅ IMPLEMENTED

**Why**: Necessary for nationwide expansion.

* DB-level filtering
* make overlap optimization
* location normalization
* indexed matching queries
* non-blocking assignment jobs

---

## 3.2 Dealer performance metrics dashboard ✅ IMPLEMENTED

* ✅ Added shared dealer performance calculation service.
* ✅ Computes:
  * response rate
  * acceptance rate
  * average response time
  * average offer quality
  * average offer completeness
  * completed deals
  * assigned requests
  * submitted, active, accepted, and rejected offers
  * open assignments
  * saved, interested, and declined requests
  * 7-day dashboard trend counters
* ✅ Added dealer dashboard performance cards for acceptance rate, response time, offer quality, and worklist status.
* ✅ Added server-side Sentry metrics on dealer dashboard load.
* ✅ Added client-side Sentry metrics on dealer dashboard view.
* ✅ Sentry metrics emitted:
  * `dealer.performance.dashboard_viewed`
  * `dealer.performance.updated`
  * `dealer.performance.response_rate`
  * `dealer.performance.acceptance_rate`
  * `dealer.performance.average_response_hours`
  * `dealer.performance.response_hours_distribution`
  * `dealer.performance.average_offer_quality`
  * `dealer.performance.completed_deals`
  * `dealer.performance.assigned_requests`
  * `dealer.performance.submitted_offers`
  * `dealer.performance.accepted_offers`
  * `dealer.performance.rejected_offers`
  * `dealer.performance.open_assignments`
  * `dealer.performance.saved_requests`
  * `dealer.performance.interested_requests`
  * `dealer.performance.declined_requests`
  * `dealer.performance.metrics_load_ms`

**Files affected**: `src/lib/services/dealerPerformance.ts`, `src/lib/services/__tests__/dealerPerformance.test.ts`, dealer dashboard page, `src/app/(app)/dealer/(dashboard)/DealerPerformanceMetricsClient.tsx`, `src/lib/analytics.ts`

---

## 3.3 Lead credits / subscription readiness 🚧 PLANNED

* creditsRemaining
* subscription support
* feature flags
* lead monetization readiness

---

## 3.4 Admin moderation dashboard ✅ IMPLEMENTED

* ✅ Added `moderation_flags` table for request, offer, and dealership moderation.
* ✅ Added admin-only `/admin/moderation` dashboard with queue filters, manual flag creation, status actions, and moderation metrics.
* ✅ Added moderation service and admin server actions with admin authorization checks.
* ✅ Added Sentry metrics for dashboard views, queue gauges, flag creation, resolution, dismissal, spam detection, and resolution time.
* ✅ Updated Sentry test script to emit metrics.

**Files affected**: `src/db/schema.ts`, `src/lib/services/moderation.ts`, `src/app/actions/moderation.ts`, `src/app/admin/moderation/page.tsx`, `src/app/admin/moderation/AdminModerationMetricsClient.tsx`, `src/lib/analytics.ts`, `.env.example`, `scripts/test-sentry.ts`

---

## 3.5 Event-based notification queue design 🚧 PLANNED

* queue architecture
* retry logic
* delivery status
* async notification processing

---

# Schema Changes

## New Planned Fields

```sql
ALTER TABLE buyer_requests
ADD COLUMN request_type VARCHAR(20) DEFAULT 'fixed';
```

Allowed values:

* `fixed`
* `open`

---

# Testing Checklist

## Open Search Tests

* Open request routes correctly
* No make/model request does not crash matching
* Dealer assignment works without make
* Open requests still score properly
* Broad matching confidence scoring works
* Open requests appear correctly in dealer dashboard

---

## Upload Failure Tests

* Large uploads succeed
* Retry uploads work
* Draft persistence works
* Multiple images upload correctly
* Partial upload recovery works
* Failed uploads surface correct errors

---

## Authentication & Geolocation Tests

* Signup works without GPS
* Manual location fallback works
* IP-based fallback works
* Role selection works consistently
* Redirect flow remains stable
* Dealer onboarding works without geolocation

---

# Updated Implementation Order

1. Request assignment + offer cap
2. Dealer verification state
3. Offer quality model
4. Open search vs fixed search support
5. Upload failure investigation
6. Authentication/geolocation stabilization
7. Improved matching queries
8. Notification system
9. Moderation dashboard
10. Monetization foundation

---

# Current High Priority Issues

## Critical

### Open Search Compatibility

Current matching assumes make/model exists and breaks broad search requests.

### Buyer Request Upload Failures

Request creation occasionally fails and needs diagnostics + stabilization.

### Authentication & Geolocation Stability

Signup/login flow and location handling need stabilization before scaling.

---

# Do-First Summary

Focus on these immediately:

1. Open search compatibility in matching/routing
2. Stabilize buyer request uploads
3. Fix authentication + geolocation onboarding issues
4. Improve signup vs signin UX clarity

These are now foundational before expanding marketplace scale and onboarding more dealerships.
