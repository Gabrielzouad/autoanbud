// src/lib/services/dealerCapabilities.ts
import { db, dealerCapabilities } from '@/db/index';
import { eq } from 'drizzle-orm';

export interface CreateDealerCapabilityInput {
  dealershipId: string;
  makes: string[];
  models: string[];
  minYear: number;
  maxYear: number;
  maxKm: number;
  fuelTypes: string[];
  gearboxTypes: string[];
  bodyTypes: string[];
  maxPrice: number;
  serviceRadius: number;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
}

export async function createDealerCapability(data: CreateDealerCapabilityInput) {
  try {
    const [capability] = await db
      .insert(dealerCapabilities)
      .values({
        dealershipId: data.dealershipId,
        makes: data.makes,
        models: data.models,
        minYear: data.minYear,
        maxYear: data.maxYear,
        maxKm: data.maxKm,
        fuelTypes: data.fuelTypes,
        gearboxTypes: data.gearboxTypes,
        bodyTypes: data.bodyTypes,
        maxPrice: data.maxPrice,
        serviceRadius: data.serviceRadius,
        location: JSON.stringify(data.location),
      })
      .returning();

    return capability;
  } catch (error) {
    console.warn('Failed to create dealer capability (table might not exist):', error);
    return null;
  }
}

export async function getDealerCapability(dealershipId: string) {
  try {
    const [capability] = await db
      .select()
      .from(dealerCapabilities)
      .where(eq(dealerCapabilities.dealershipId, dealershipId));

    if (!capability) return null;

    const location =
      capability.location &&
      typeof capability.location === 'object' &&
      'lat' in capability.location &&
      'lng' in capability.location &&
      'city' in capability.location
        ? (capability.location as {
            lat: number;
            lng: number;
            city: string;
          })
        : null;

    return {
      ...capability,
      makes: capability.makes || [],
      models: capability.models || [],
      minYear: capability.minYear ?? 1990,
      maxYear: capability.maxYear ?? new Date().getFullYear() + 1,
      maxKm: capability.maxKm ?? 500000,
      fuelTypes: capability.fuelTypes || [],
      gearboxTypes: capability.gearboxTypes || [],
      bodyTypes: capability.bodyTypes || [],
      maxPrice: capability.maxPrice ?? 10000000,
      serviceRadius: capability.serviceRadius ?? 100,
      location,
    };
  } catch (error) {
    // Table might not exist yet, return null
    console.warn('dealer_capabilities table not found:', error);
    return null;
  }
}

export async function updateDealerCapability(dealershipId: string, updates: Partial<CreateDealerCapabilityInput>) {
  try {
    const updateData: any = { ...updates };
    if (updates.location) {
      updateData.location = updates.location; // jsonb handles serialization automatically
    }

    const [capability] = await db
      .update(dealerCapabilities)
      .set(updateData)
      .where(eq(dealerCapabilities.dealershipId, dealershipId))
      .returning();

    if (!capability) return null;

    return {
      ...capability,
      location: capability.location || null,
    };
  } catch (error) {
    console.warn('Failed to update dealer capability (table might not exist):', error);
    return null;
  }
}