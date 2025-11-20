// src/db/schema.ts
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersSync } from "drizzle-orm/neon"; // Neon Auth users table

/* ---------- Enums ---------- */

export const userRole = pgEnum("user_role", ["buyer", "dealer", "admin"]);

export const requestStatus = pgEnum("request_status", [
  "open",
  "under_review",
  "accepted",
  "expired",
  "cancelled",
]);

export const offerStatus = pgEnum("offer_status", [
  "submitted",
  "withdrawn",
  "accepted",
  "rejected",
  "expired",
]);

export const carCondition = pgEnum("car_condition", [
  "new",
  "used",
  "demo",
]);

export const fuelType = pgEnum("fuel_type", [
  "petrol",
  "diesel",
  "hybrid",
  "ev",
  "other",
]);

export const gearboxType = pgEnum("gearbox_type", [
  "automatic",
  "manual",
  "any",
]);

export const bodyType = pgEnum("body_type", [
  "suv",
  "sedan",
  "wagon",
  "hatchback",
  "coupe",
  "convertible",
  "van",
  "pickup",
  "other",
]);

/* ---------- User profiles (app-specific) ---------- */
/**
 * Neon Auth stores the real user identities in neon_auth.users_sync (usersSync helper).
 * This table adds app-specific fields like role, phone, etc.
 */
export const userProfiles = pgTable("user_profiles", {
  // Same id as Neon Auth user; text, not uuid
  userId: text("user_id")
    .primaryKey()
    .references(() => usersSync.id, { onDelete: "cascade" }),

  role: userRole("role").notNull().default("buyer"),

  phone: varchar("phone", { length: 50 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  buyerRequests: many(buyerRequests),
  dealerMemberships: many(dealerMembers),
  offers: many(offers),
  dealershipsOwned: many(dealerships),
}));

/* ---------- Dealerships ---------- */

export const dealerships = pgTable("dealerships", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Now text, referencing userProfiles.userId (which itself maps to Neon Auth)
  ownerId: text("owner_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  orgNumber: varchar("org_number", { length: 32 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 120 }),
  postalCode: varchar("postal_code", { length: 16 }),
  country: varchar("country", { length: 2 }).notNull().default("NO"),

  // You can change to numeric if you want high precision
  lat: integer("lat"),
  lng: integer("lng"),

  // Comma-separated makes (e.g. "Volvo,Audi")
  makes: text("makes").default(""),

  verified: boolean("verified").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dealershipsRelations = relations(dealerships, ({ one, many }) => ({
  owner: one(userProfiles, {
    fields: [dealerships.ownerId],
    references: [userProfiles.userId],
  }),
  members: many(dealerMembers),
  offers: many(offers),
}));

/* ---------- Dealer members ---------- */

export const dealerMembers = pgTable("dealer_members", {
  id: uuid("id").defaultRandom().primaryKey(),

  dealershipId: uuid("dealership_id")
    .notNull()
    .references(() => dealerships.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),

  role: varchar("role", { length: 32 }).notNull().default("manager"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dealerMembersRelations = relations(
  dealerMembers,
  ({ one }) => ({
    dealership: one(dealerships, {
      fields: [dealerMembers.dealershipId],
      references: [dealerships.id],
    }),
    user: one(userProfiles, {
      fields: [dealerMembers.userId],
      references: [userProfiles.userId],
    }),
  }),
);

/* ---------- Buyer requests ---------- */

export const buyerRequests = pgTable("buyer_requests", {
  id: uuid("id").defaultRandom().primaryKey(),

  buyerId: text("buyer_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),

  status: requestStatus("status").notNull().default("open"),

  title: varchar("title", { length: 200 }).notNull(),

  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  generation: varchar("generation", { length: 100 }),

  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),

  maxKm: integer("max_km"),
  minKm: integer("min_km"),

  condition: carCondition("condition"),
  fuelType: fuelType("fuel_type"),
  gearbox: gearboxType("gearbox"),
  bodyType: bodyType("body_type"),

  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  currency: varchar("currency", { length: 3 }).notNull().default("NOK"),

  locationCity: varchar("location_city", { length: 120 }),
  locationPostalCode: varchar("location_postal_code", { length: 16 }),
  searchRadiusKm: integer("search_radius_km"),

  wantsTradeIn: boolean("wants_trade_in").default(false),
  financingNeeded: boolean("financing_needed"),

  description: text("description"),

  acceptedOfferId: uuid("accepted_offer_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  meta: jsonb("meta"),
});

export const buyerRequestsRelations = relations(
  buyerRequests,
  ({ one, many }) => ({
    buyer: one(userProfiles, {
      fields: [buyerRequests.buyerId],
      references: [userProfiles.userId],
    }),
    offers: many(offers),
  }),
);

/* ---------- Offers ---------- */

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),

  requestId: uuid("request_id")
    .notNull()
    .references(() => buyerRequests.id, { onDelete: "cascade" }),

  dealershipId: uuid("dealership_id")
    .notNull()
    .references(() => dealerships.id, { onDelete: "cascade" }),

  dealerUserId: text("dealer_user_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),

  status: offerStatus("status").notNull().default("submitted"),

  carRegNr: varchar("car_reg_nr", { length: 32 }),
  vin: varchar("vin", { length: 64 }),

  carMake: varchar("car_make", { length: 100 }).notNull(),
  carModel: varchar("car_model", { length: 100 }).notNull(),
  carVariant: varchar("car_variant", { length: 150 }),
  carYear: integer("car_year").notNull(),
  carKm: integer("car_km").notNull(),

  carCondition: carCondition("car_condition").notNull(),
  fuelType: fuelType("fuel_type"),
  gearbox: gearboxType("gearbox"),
  bodyType: bodyType("body_type"),

  colorExterior: varchar("color_exterior", { length: 100 }),
  colorInterior: varchar("color_interior", { length: 100 }),

  priceTotal: integer("price_total").notNull(),
  priceOld: integer("price_old"),
  currency: varchar("currency", { length: 3 }).notNull().default("NOK"),

  deliveryTimeEstimate: varchar("delivery_time_estimate", { length: 200 }),
  warrantySummary: varchar("warranty_summary", { length: 200 }),

  financingPossible: boolean("financing_possible"),
  financingExample: text("financing_example"),

  locationCity: varchar("location_city", { length: 120 }),
  locationPostalCode: varchar("location_postal_code", { length: 16 }),
  distanceKm: integer("distance_km"),

  shortMessageToBuyer: text("short_message_to_buyer"),
  internalNotes: text("internal_notes"),

  imageUrls: jsonb("image_urls"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const offersRelations = relations(offers, ({ one }) => ({
  request: one(buyerRequests, {
    fields: [offers.requestId],
    references: [buyerRequests.id],
  }),
  dealership: one(dealerships, {
    fields: [offers.dealershipId],
    references: [dealerships.id],
  }),
  dealerUser: one(userProfiles, {
    fields: [offers.dealerUserId],
    references: [userProfiles.userId],
  }),
}));
