# AutoAnbud — Homepage Design Brief (Open Design)

## What is AutoAnbud?

AutoAnbud is a Norwegian two-sided marketplace for car buying. Buyers describe the car they want and receive competing offers from verified dealers. Dealers see live buyer requests, send tailored offers, and close deals through the platform.

The platform is built with Next.js 15 App Router, TypeScript, Tailwind CSS, and shadcn/ui components.

---

## The Core Concept

**For buyers:** Instead of visiting dealerships or browsing classifieds, a buyer fills in one request describing their dream car — make, model, budget, preferences. Verified dealers then compete by sending tailored offers. The buyer compares offers, chats with dealers, and accepts the best one.

**For dealers:** Instead of cold outreach or expensive ads, dealers see a live feed of buyer requests that match their inventory. They send an offer directly to the buyer, chat in-platform, and close the deal.

**Critical rule:** Buyers and dealers are completely separate user types with separate accounts. You choose your role once at sign-up — it is permanent and cannot be changed. The platform enforces this strictly.

---

## What the Homepage Needs to Do

1. Immediately explain what AutoAnbud is and why it's different
2. Make it obvious there are two distinct user types (buyer vs dealer)
3. Communicate that roles are chosen once and are permanent — this is a feature, not a limitation
4. Guide each visitor to the right starting point
5. Build trust — this is a financial transaction platform dealing with cars worth hundreds of thousands of kroner
6. Feel premium and Norwegian — not generic SaaS

---

## Sections Required

### Header / Navigation
- Logo: "AutoAnbud" with a small car icon
- Navigation links to: how it works, for dealers, about
- The right side of the header must be **state-aware**:
  - Logged-out visitor → "Logg inn" + "Kom i gang gratis" (→ /select-role)
  - Logged-in buyer → "Mine forespørsler" (→ /buyer/requests)
  - Logged-in dealer → "Min forhandlerside" (→ /dealer)
- This is implemented via a server-side `getMarketingNavigationState()` function that returns the correct hrefs and labels

### Hero Section
- Strong headline that sells the concept for buyers
- Supporting text explaining how it works in one sentence
- Primary CTA for logged-out users: "Kom i gang gratis" → /select-role
- Logged-in users see their relevant dashboard button instead

### Two Paths Section (logged-out users only)
- Visually split section showing the buyer path and dealer path
- Must make it clear these are separate, distinct roles
- Both paths lead to /select-role
- Must include a visible warning that the role choice is permanent and the two account types are fully separate

### How It Works — Buyer Flow
A step-by-step explanation of the buyer experience:
1. Create a request (describe the car you want, set budget, location)
2. Receive offers from dealers (with full car specs, price, photos)
3. Compare offers, chat with dealers in-platform
4. Accept the best offer (closes the request, other offers auto-rejected)

### How It Works — Dealer Flow
A step-by-step explanation of the dealer experience:
1. Browse live buyer requests with a match score based on your inventory preferences
2. Send a tailored offer (reg number, VIN, make/model/year/km, price, photos, message)
3. Chat directly with the buyer
4. Buyer accepts your offer — you arrange delivery offline

### Trust Section
Must communicate:
- Verified dealers only
- Platform-mediated communication (no personal contact until deal is done)
- The buyer is always in control — they accept or reject each offer

### Footer
Links to: how it works for buyers (/how-it-works/buyers), for dealers (/how-it-works/dealers), about (/about), sign in (/handler/sign-in), register (/select-role)

---

## Features Already Built (for accurate copy)

### Buyer features
- Detailed request form: make, model, year range, km range, condition, fuel type, gearbox, body type, budget min/max, location with radius, trade-in option, financing option, description, photo upload
- Norwegian address autocomplete (Norgeskart API)
- Offer inbox per request showing all received offers
- Per-offer chat thread with dealer
- Accept / reject buttons on each offer
- Accepting locks the request and rejects all other offers automatically
- In-app notifications + email for new offers and messages
- Notification bell with unread badge count

### Dealer features
- Onboarding: company name, org number, address, service area, supported brands, car types, price range
- Request feed with AI-style match score per request
- Offer form: reg nr, VIN, make/model/variant/year/km, exterior/interior colour, price, message to buyer, photo upload
- Per-offer chat with buyer
- Dashboard stats: open requests matched, active offers sent, accepted offers, average response time
- Edit contact info (phone, email, address) inline via modal
- Notification bell with unread badge count

### Role system
- New users land on /select-role to pick buyer or dealer
- Role is locked after first selection
- Buyers can only access /buyer/* routes
- Dealers can only access /dealer/* routes
- Attempting cross-access redirects to your own home

---

## Tone and Language

- Norwegian (Bokmål) for all visible text
- Warm but professional — this platform handles significant financial decisions
- Confident, not salesy
- Clear over clever — Norwegians distrust hype

---

## Technical Notes for Implementation

The homepage is a Next.js server component at `src/app/(marketing)/page.tsx`.

The `getMarketingNavigationState()` function (already exists at `src/lib/marketing/navigation.ts`) returns:
```ts
{
  headerPrimaryHref: string      // where the main CTA goes
  headerPrimaryLabel: string     // label for the main CTA
  headerSecondaryHref: string | null
  headerSecondaryLabel: string | null
  userRole: 'buyer' | 'dealer' | 'admin' | null  // null = logged out
}
```

Use `userRole === null` to conditionally show sections only for logged-out visitors (like the "choose your role" split section).

Images live in `/public/images/`. Available:
- `luxury-car-interior-minimalist.jpg`
- `modern-car-dealership-showroom-architecture.jpg`
- `handshake-car-keys-luxury-dark.jpg`

Use `next/image` with `fill` and `object-cover` for all images.
