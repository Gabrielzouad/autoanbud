# AutoAnbud — Homepage Design Brief

## What is AutoAnbud?

AutoAnbud is a Norwegian two-sided marketplace for car buying. Buyers describe the car they want and receive competing offers from verified dealers. Dealers see live buyer requests, send tailored offers, and close deals through the platform.

**Key differentiator:** Buyers and dealers are completely separate accounts. You choose your role once at registration — it cannot be changed. This creates a clean, focused experience for each side.

---

## Design System

### Brand

- **Name:** AutoAnbud (never "BilMarked" or other variants)
- **Tagline:** "Finn din drømmebil uten stress" / "La forhandlerne komme til deg"
- **Tone:** Premium, trustworthy, clean — not startup-flashy. Think Finn.no meets a luxury car brand.
- **Language:** Norwegian (Bokmål) throughout

### Typography

- **Serif font:** Libre Baskerville — used for all headings (`font-serif`), hero text, step numbers, card titles. This is the brand personality font.
- **Sans font:** Geist — used for all body text, labels, nav, UI elements.
- **Scale examples:**
  - Hero h1: `font-serif text-5xl md:text-7xl font-medium tracking-tight leading-[1.1]`
  - Section h2: `font-serif text-3xl md:text-4xl`
  - Card title: `font-serif text-xl font-medium`
  - Body: `text-base text-stone-600 leading-relaxed`

### Colour Palette

**Primary brand colour — Emerald (dark):**
- `bg-emerald-900` — primary CTAs, logo background, nav buttons
- `bg-emerald-800` — hover state on primary CTAs
- `bg-emerald-700` — secondary buttons, step cards
- `text-emerald-700` — active nav links, icon accents, inline highlights
- `bg-emerald-100` / `text-emerald-700` — light accent chips, benefit icon backgrounds
- `text-emerald-400` — accents on dark backgrounds (stone-900 sections)

**Neutral stone palette (primary background system):**
- `bg-white` — cards, headers, clean content sections
- `bg-stone-50` — default page background, alternating sections
- `bg-stone-100` — subtle card backgrounds, avatar fallbacks
- `bg-stone-200` — borders, dividers (`border-stone-200`)
- `text-stone-900` — primary headings and body
- `text-stone-600` — secondary body text
- `text-stone-500` — captions, subtitles
- `text-stone-400` — muted text (timestamps, helper text)

**Dark sections:**
- `bg-stone-900 text-white` — trust/CTA sections, contrast hero areas
- `text-stone-400` — body text on dark backgrounds
- `text-stone-300` — secondary text on dark backgrounds

**Status colours:**
- Red (`bg-red-100`, `text-red-600`) — errors, rejected offers
- Amber (`bg-amber-50`, `text-amber-800`) — warnings, role-lock notices
- Blue — not used (keep everything emerald/stone)

### Spacing & Layout

- Max content width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section vertical padding: `py-20` (standard) / `py-24` (feature sections) / `py-32` (hero)
- Card gap: `gap-6` or `gap-8`
- Component radius: `rounded-xl` (cards), `rounded-2xl` (feature cards), `rounded-3xl` (image cards), `rounded-full` (buttons, badges, avatars)

### Components (shadcn/ui based)

- **Buttons:**
  - Primary: `bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-8`
  - Outline: `variant='outline' rounded-full bg-white`
  - Ghost: `variant='ghost'`
  - Sizes: `size='lg'` for hero CTAs (`h-12 px-8 text-base`), `size='sm'` for nav
- **Cards:** `bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow`
- **Badges:** `rounded-full px-3 py-1 text-sm` with colour-coded backgrounds
- **Inputs:** `border border-stone-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-600`

### Header

```
Sticky, z-50, border-b border-stone-200, bg-white/80 backdrop-blur-md
Height: h-16
Logo: font-serif text-xl font-bold | w-8 h-8 bg-emerald-900 text-white rounded-full
Nav links: text-sm font-medium text-stone-600 hover:text-emerald-700
Right: NotificationBell (if logged in) + UserDropdown (if logged in) OR [Logg inn ghost] + [primary CTA]
```

### Logo mark
```tsx
<div className='w-8 h-8 bg-emerald-900 text-white rounded-full flex items-center justify-center'>
  <CarFront className='w-4 h-4' />
</div>
AutoAnbud
```

---

## Homepage Requirements

### Audience

The homepage is shown to everyone — logged-out visitors, buyers, and dealers. It must:
- Immediately communicate what AutoAnbud does
- Make it clear there are two separate user types
- Guide each visitor to the right path
- Look premium and trustworthy — not a generic SaaS landing page

### Navigation (state-aware)

The header CTA changes based on who is viewing:
- **Logged out:** "Logg inn" (ghost) + "Kom i gang gratis" (primary → `/select-role`)
- **Logged in as buyer:** "Mine forespørsler" (primary → `/buyer/requests`)
- **Logged in as dealer:** "Min forhandlerside" (primary → `/dealer`)

Nav links: "Slik fungerer det" (anchor), "For forhandlere" (anchor), "Om oss" (/about)

### Sections (in order)

#### 1. Hero
- Full-width, centered text layout
- Headline (serif, large): "Finn din drømmebil / uten stress."
- Subheadline: Explain the concept in one sentence
- Two CTA buttons:
  - Primary: "Kom i gang gratis" → `/select-role` (only for logged-out)
  - Secondary outline: "Logg inn"
- Logged-in users see only their dashboard button
- Subtle radial gradient background (emerald-50 to white)

#### 2. "Velg din rolle" (Two paths — only for logged-out visitors)
- Side-by-side image cards (buyer left, dealer right) with hover reveal
- Buyer card: Photo of car interior, emerald overlay, "For kjøpere / Kjøp bil"
- Dealer card: Photo of showroom, dark overlay, "For forhandlere / Selg biler"
- Both cards link to `/select-role`
- **Important notice below cards** (amber/warning box): "Du velger kun rolle én gang. Kjøpere og forhandlere har helt separate kontoer og tilganger."

#### 3. "Slik fungerer det" — Buyer flow
- Label chip: green pill "For kjøpere" with CarFront icon
- Headline: "Tre steg til din neste bil"
- 3 cards in a row with step number (decorative large serif), icon, title, description:
  1. Beskriv hva du vil ha (Search icon)
  2. Motta tilbud (Sparkles icon)
  3. Velg og aksepter (ShieldCheck icon)

#### 4. "Slik fungerer det" — Dealer flow (same section, divider)
- Label chip: stone pill "For forhandlere" with Store icon
- Headline: "Nå kjøpere som allerede vil kjøpe"
- 3 cards same layout:
  1. Se aktive forespørsler (Search icon) — mention matchscore
  2. Send et konkret tilbud (Sparkles icon)
  3. Chat og close (ShieldCheck icon)

#### 5. Trust / Social proof (dark section)
- `bg-stone-900` dark section
- Left: headline "Trygghet i hver handel." + trust bullets + CTA
- Right: handshake/keys photo
- Trust bullets (CheckCircle2 emerald-500):
  - Verifiserte forhandlere
  - Tilstandsrapport på alle biler
  - Trygg betalingsløsning
  - Garanti inkludert
- CTA only shown to logged-out users

#### 6. Footer
- 4-column grid: brand + tagline | Tjenester | Selskap | Konto
- Links: Kjøp bil → /select-role, For forhandlere → /how-it-works/dealers, Om oss → /about, Logg inn, Registrer deg → /select-role
- Bottom bar: © {year} AutoAnbud AS | Personvern | Vilkår | Cookies

---

## Platform Features (already built — reference for content)

### For Buyers
- Create a detailed car request (make, model, year, km, budget, fuel type, gearbox, body type, location, trade-in, financing)
- Address autocomplete (Norgeskart API)
- Upload reference photos
- Receive offers from dealers with full car specs + price
- Per-offer chat thread with the dealer
- Accept or reject individual offers
- Accepting an offer closes the request (all other offers rejected)
- In-app + email notifications for new offers and messages

### For Dealers
- Onboarding: company name, org number, address, capabilities (brands, car types, price range, radius)
- Browse all open buyer requests with a match score
- Send offers with: reg nr, VIN, make/model/year/km, price, photos, message
- Per-offer chat with buyer
- Dashboard with stats: open requests, active offers, accepted offers, avg response time
- Edit contact info (phone, email, address) via modal
- Notification bell with unread count

### Role System
- New users → `/select-role` page (pick buyer or dealer)
- Role is permanent — cannot be changed after selection
- Buyers: `/buyer/*` routes only
- Dealers: `/dealer/*` routes only
- Cross-access redirects to the correct home for that role

---

## What to Avoid

- Don't use "BilMarked" — the brand is AutoAnbud
- Don't use blue — all accents are emerald
- Don't use `emerald-500` or `emerald-600` for buttons — use `emerald-900` / `emerald-800`
- Don't show "Registrer forhandler" to logged-in buyers
- Don't show "Mine forespørsler" link to logged-in dealers
- Don't add placeholder/fake stats (e.g. "10 000 fornøyde kunder") unless explicitly asked
- Don't use generic startup language ("seamless", "powerful", "world-class")
- Don't break the buyer/dealer role separation in any CTA link
