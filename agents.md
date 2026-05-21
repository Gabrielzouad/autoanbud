# Project Agents

This file describes the set of agents, roles, and responsibilities for the AutoAnbud project. It is intended to help the team understand what we want, what we do not want, and where responsibilities are split.

## Why we need this

- Clarifies the intended scope for each role.
- Helps avoid overlap and confusion.
- Gives a quick reference for contributors and AI assistants.
- Keeps decisions aligned with product goals.

## Project Goals

- Build a clean, trustworthy Norwegian car marketplace that connects buyers and dealers.
- Create a role-specific experience for buyers and dealers with clear separation.
- Prioritize a simple, polished onboarding and request-to-offer workflow.
- Deliver a smart, explainable matching system that improves relevance and trust.
- Keep implementation maintainable, testable, and deployment-ready.

## Marketplace Strategy (Critical)

### What this product should become
- A **demand-driven matching platform** with strong supplier controls, not an open auction board.
- A **qualified lead engine** for dealers, where buyers describe needs and dealers receive curated, high-intent requests.
- A **trust-first marketplace** that values service, local fit, and dealer reputation over raw price.
- Later: a transaction facilitation layer if conditions support it. Early stage: stay in matching/lead mode.

### Key marketplace controls to prevent reverse-auction dynamics
- Do not expose price as the primary decision driver in UI.
- Limit the number of offers per request (start with 4).
- Rank offers using quality signals, not just price.
- Require dealers to submit value-oriented offer details: delivery, warranties, inspection, financing, service packages.
- Let buyers choose based on "best fit" criteria, not price-only comparison.

### How to preserve dealer margins
- Charge dealers for **qualified access**, not for "winning on price."
- Prevent buyers from thinking the platform is a "lowest bid wins" marketplace.
- Encourage dealers to sell value-added packages: service plans, warranties, financing, delivery, inspection.
- Avoid "pay per response" models unless it is for very high-intent deals.

### How to increase dealer trust
- Give dealers **control** over which requests they can respond to.
- Provide transparent delivery metrics: response rate, acceptance rate, average deal value, lead quality.
- Show dealers the expected request quality before they commit.
- Create a dealer verification system with badges and performance signals.

### How to differentiate from Finn.no
- Finn.no is broad classifieds. AutoAnbud should be:
  - request-driven, not listing-driven
  - curated, not open marketplace
  - local and service-oriented, not just a search engine
  - focused on reducing friction for buyers and dealers, not on volume of ads

## Agent roles

## Development Philosophy
Build feature by feature.
For every feature:
1. Read this file first.

2. Keep the implementation simple.

3. Avoid overengineering.

4. Prefer readable code over clever code.

5. Build the smallest useful version first.

6. Refactor only when repetition appears.
---
## Decision Making

If something is unclear or could be improved, suggest a better
approach. If a new library would significantly help, recommend it,
explain why, and ask before adding it.
Do not install new libraries without approval.

### 1. Product / Strategy Agent

**What we want**
- Define the buyer and dealer experience clearly.
- Prioritize features that support the two-sided marketplace.
- Keep the product aligned with the Norwegian market and automotive focus.
- Communicate the value proposition: stress-free car search, verified dealer offers, clear role separation.

**What we do not want**
- Feature creep that distracts from the core marketplace flow.
- Copying unrelated marketplace models without adaptation.
- Launching without a simple, polished buyer/dealer onboarding.

### 2. Frontend Agent

**What we want**
- Implement and refine the Next.js + React UI.
- Use the existing design system, color palette, and typography.
- Keep buyer and dealer dashboards intuitive and responsive.
- Build accessible components and consistent UX across pages.

**What we do not want**
- Unnecessary third-party UI frameworks beyond the current shadcn/ui + Tailwind setup.
- Slow pages or unstable hydration issues.
- Inconsistent navigation or broken role-based flows.

### 3. Backend / Data Agent

**What we want**
- Keep the database schema clean and easy to maintain.
- Implement secure user roles, request handling, offers, and notifications.
- Maintain the matching algorithm and improve scoring logic.
- Ensure validation and server-side business rules are correct.

**What we do not want**
- Ad hoc data models that are hard to query or reason about.
- Role logic that leaks across buyer/dealer boundaries.
- Insecure API endpoints or missing validation.

### 4. Matching / Algorithm Agent

**What we want**
- Maintain and improve the smart matching algorithm.
- Score matches based on location, make/model, year, mileage, fuel type, and budget.
- Keep the algorithm explainable and extensible.
- Add tests for matching behavior and edge cases.

**What we do not want**
- A black-box matching system with unclear rules.
- Overcomplicated scoring without measurable benefit.
- Ignoring the importance of service radius or dealer capabilities.

### 5. DevOps / Deployment Agent

**What we want**
- Make the app deployable and production-ready.
- Document deployment flow and environment dependencies.
- Use managed services and best practices where possible.
- Monitor performance and handle error reporting.

**What we do not want**
- A fragile deployment process that only works locally.
- Missing production readiness details like DB migrations, env setup, or CI.
- Neglecting security posture for auth, email, and data storage.

### 6. QA / Testing Agent

**What we want**
- Keep tests for services, validation, and critical flows.
- Ensure the app behaves correctly for both user roles.
- Use automated tests for backend logic and UI invariants.
- Track bugs and regressions early.

**What we do not want**
- No tests for core business logic.
- Manual-only validation of buyer/dealer flows.
- Ignoring failing tests or unstable coverage.

## How to use this file

- Refer to this file when assigning work or reviewing changes.
- Use it to decide whether a proposed task fits the current project direction.
- Update it as priorities shift or new agents emerge.

## Notes for contributors

- Keep the marketplace simple and focused.
- Always think in terms of buyers and dealers as separate experiences.
- Prefer incremental improvements over large rewrites.
- Make decisions that support a reliable, usable product.
