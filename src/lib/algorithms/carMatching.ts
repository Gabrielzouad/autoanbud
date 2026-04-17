// src/lib/algorithms/carMatching.ts
import { getDistance } from 'geolib';
import { db, buyerRequests, dealerships, dealerCapabilities } from '@/db';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';

export interface MatchScore {
  requestId: string;
  dealershipId: string;
  score: number;
  reasons: string[];
  distance?: number;
}

export interface DealerCapability {
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
  serviceRadius: number; // km
  location?: {
    lat: number;
    lng: number;
    city: string;
  } | null;
}

/**
 * Calculate matching score between a buyer request and dealer capabilities
 */
export function calculateMatchScore(
  request: any,
  dealer: DealerCapability
): MatchScore {
  let score = 0;
  const reasons: string[] = [];

  // Location matching (30% weight)
  let distance: number | undefined;
  if (request.locationLat && request.locationLng && dealer.location) {
    distance = getDistance(
      { latitude: request.locationLat, longitude: request.locationLng },
      { latitude: dealer.location.lat, longitude: dealer.location.lng }
    ) / 1000; // Convert to km

    if (distance <= dealer.serviceRadius) {
      score += 30;
      reasons.push(`Within service radius (${distance.toFixed(1)}km)`);
    } else if (distance <= dealer.serviceRadius * 1.5) {
      score += 15;
      reasons.push(`Slightly outside radius (${distance.toFixed(1)}km)`);
    }
  }

  // Make/Model matching (25% weight)
  if (request.make && dealer.makes.includes(request.make.toLowerCase())) {
    score += 25;
    reasons.push(`Specializes in ${request.make}`);

    if (request.model && dealer.models.some(m =>
      m.toLowerCase().includes(request.model.toLowerCase()) ||
      request.model.toLowerCase().includes(m.toLowerCase())
    )) {
      score += 10; // Bonus for model match
      reasons.push(`Has ${request.model} models`);
    }
  }

  // Year range matching (15% weight)
  if (request.yearFrom || request.yearTo) {
    const requestMin = request.yearFrom || 1990;
    const requestMax = request.yearTo || new Date().getFullYear() + 1;

    if (dealer.minYear <= requestMax && dealer.maxYear >= requestMin) {
      score += 15;
      reasons.push(`Year range matches (${dealer.minYear}-${dealer.maxYear})`);
    }
  }

  // Mileage matching (10% weight)
  if (request.maxKm && dealer.maxKm >= request.maxKm) {
    score += 10;
    reasons.push(`Can provide cars with ≤${request.maxKm}km`);
  }

  // Fuel type matching (10% weight)
  if (request.fuelType && dealer.fuelTypes.includes(request.fuelType)) {
    score += 10;
    reasons.push(`Offers ${request.fuelType} vehicles`);
  }

  // Transmission matching (5% weight)
  if (request.gearbox && dealer.gearboxTypes.includes(request.gearbox)) {
    score += 5;
    reasons.push(`Has ${request.gearbox} transmission`);
  }

  // Body type matching (5% weight)
  if (request.bodyType && dealer.bodyTypes.includes(request.bodyType)) {
    score += 5;
    reasons.push(`Specializes in ${request.bodyType}s`);
  }

  // Budget matching (bonus points)
  if (request.budgetMax && dealer.maxPrice >= request.budgetMax) {
    score += 5;
    reasons.push(`Within budget range`);
  }

  return {
    requestId: request.id,
    dealershipId: dealer.dealershipId,
    score: Math.min(score, 100), // Cap at 100
    reasons,
    distance
  };
}

/**
 * Find best matching dealers for a buyer request
 */
export async function findMatchingDealers(requestId: string, limit = 10): Promise<MatchScore[]> {
  // Get the buyer request
  const [request] = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.id, requestId));

  if (!request) return [];

  // Get all dealers with their capabilities
  const dealersWithCapabilities = await db
    .select({
      dealership: dealerships,
      capabilities: dealerCapabilities
    })
    .from(dealerships)
    .leftJoin(dealerCapabilities, eq(dealerships.id, dealerCapabilities.dealershipId));

  // Calculate match scores
  const matches: MatchScore[] = [];

  for (const { dealership, capabilities } of dealersWithCapabilities) {
    if (!capabilities) continue; // Skip dealers without capabilities

    const dealerCapability: DealerCapability = {
      dealershipId: dealership.id,
      makes: capabilities.makes || [],
      models: capabilities.models || [],
      minYear: capabilities.minYear || 1990,
      maxYear: capabilities.maxYear || new Date().getFullYear() + 1,
      maxKm: capabilities.maxKm || 500000,
      fuelTypes: capabilities.fuelTypes || [],
      gearboxTypes: capabilities.gearboxTypes || [],
      bodyTypes: capabilities.bodyTypes || [],
      maxPrice: capabilities.maxPrice || 10000000,
      serviceRadius: capabilities.serviceRadius || 100,
      location: (capabilities.location && typeof capabilities.location === 'object' && 'lat' in capabilities.location) ? capabilities.location as { lat: number; lng: number; city: string; } : null
    };

    if (!dealerCapability.location) continue; // Skip if no location

    const match = calculateMatchScore(request, dealerCapability);
    if (match.score > 0) { // Only include matches with some score
      matches.push(match);
    }
  }

  // Sort by score descending and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get personalized buyer requests for a dealer
 */
export async function getPersonalizedBuyerRequests(dealershipId: string): Promise<any[]> {
  const matches = await findMatchingDealers(dealershipId, 50);

  if (matches.length === 0) {
    // Fallback to all open requests if no good matches
    return await db
      .select()
      .from(buyerRequests)
      .where(eq(buyerRequests.status, 'open'))
      .orderBy(buyerRequests.createdAt);
  }

  // Get the matched requests
  const requestIds = matches.map(m => m.requestId);
  const requests = await db
    .select()
    .from(buyerRequests)
    .where(and(
      eq(buyerRequests.status, 'open'),
      or(...requestIds.map(id => eq(buyerRequests.id, id)))
    ));

  // Sort requests by their match score
  const scoreMap = new Map(matches.map(m => [m.requestId, m]));
  return requests.sort((a, b) => {
    const scoreA = scoreMap.get(a.id)?.score || 0;
    const scoreB = scoreMap.get(b.id)?.score || 0;
    return scoreB - scoreA;
  });
}