// src/lib/algorithms/carMatching.ts
import { getDistance } from 'geolib';
import { db, buyerRequests, dealerships, dealerCapabilities } from '@/db';
import { eq, and, or, isNull, isNotNull, desc, sql } from 'drizzle-orm';

export interface MatchScore {
  requestId: string;
  dealershipId: string;
  score: number;
  confidence: number;
  matchType: 'fixed' | 'open';
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

export interface BuyerRequestForMatching {
  id: string;
  requestType?: 'fixed' | 'open' | string | null;
  make?: string | null;
  model?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  maxKm?: number | null;
  fuelType?: string | null;
  gearbox?: string | null;
  bodyType?: string | null;
  budgetMax?: number | null;
  locationLat?: number | null;
  locationLng?: number | null;
}

type BuyerRequestRow = typeof buyerRequests.$inferSelect;
type DealerCapabilityRow = typeof dealerCapabilities.$inferSelect;
type DealershipRow = typeof dealerships.$inferSelect;

type DealerLocation = NonNullable<DealerCapability['location']>;

const DEFAULT_CANDIDATE_MULTIPLIER = 20;
const MIN_DEALER_CANDIDATES = 50;

export function normalizeDealerLocation(value: unknown): DealerLocation | null {
  const parsedValue = typeof value === 'string' ? safeParseJson(value) : value;

  if (!parsedValue || typeof parsedValue !== 'object') return null;

  const location = parsedValue as {
    lat?: unknown;
    lng?: unknown;
    city?: unknown;
  };
  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    city: typeof location.city === 'string' ? location.city : '',
  };
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toDealerCapability(capability: DealerCapabilityRow): DealerCapability {
  return {
    dealershipId: capability.dealershipId,
    makes: capability.makes || [],
    models: capability.models || [],
    minYear: capability.minYear || 1990,
    maxYear: capability.maxYear || new Date().getFullYear() + 1,
    maxKm: capability.maxKm || 500000,
    fuelTypes: capability.fuelTypes || [],
    gearboxTypes: capability.gearboxTypes || [],
    bodyTypes: capability.bodyTypes || [],
    maxPrice: capability.maxPrice || 10000000,
    serviceRadius: capability.serviceRadius || 100,
    location: normalizeDealerLocation(capability.location),
  };
}

function hasSpecificMake(make?: string | null): make is string {
  return !!make && make.trim().length > 0 && make.toLowerCase() !== 'ukjent';
}

function getRequestType(request: BuyerRequestForMatching): 'fixed' | 'open' {
  return request.requestType === 'open' ? 'open' : 'fixed';
}

function capabilityMatches(values: string[], requested?: string | null) {
  if (!requested) return false;
  return values.map((value) => value.toLowerCase()).includes(requested.toLowerCase());
}

function dealerMakeOverlapsRequestMake(make: string) {
  return sql<boolean>`(
    coalesce(array_length(${dealerCapabilities.makes}, 1), 0) = 0
    OR ${dealerCapabilities.makes} && ARRAY[${make}]::text[]
    OR EXISTS (
      SELECT 1
      FROM unnest(${dealerCapabilities.makes}) AS dealer_make
      WHERE lower(dealer_make) = lower(${make})
    )
  )`;
}

function requestMakeOverlapsDealerMakes(makes: string[]) {
  const exactMakes = makes.map((make) => make.trim()).filter(Boolean);

  const normalizedMakes = makes
    .map((make) => make.trim().toLowerCase())
    .filter(Boolean);

  if (exactMakes.length === 0 || normalizedMakes.length === 0) {
    return undefined;
  }

  return sql<boolean>`(
    ${buyerRequests.make} = ANY(ARRAY[${sql.join(exactMakes, sql`, `)}]::text[])
    OR lower(${buyerRequests.make}) = ANY(ARRAY[${sql.join(normalizedMakes, sql`, `)}]::text[])
  )`;
}

function dealerWithinRequestRadius(request: BuyerRequestRow) {
  if (typeof request.locationLat !== 'number' || typeof request.locationLng !== 'number') {
    return undefined;
  }

  return sql<boolean>`(
    ${dealerCapabilities.location} IS NOT NULL
    AND (${dealerCapabilities.location}->>'lat') IS NOT NULL
    AND (${dealerCapabilities.location}->>'lng') IS NOT NULL
    AND (
      6371 * acos(
        least(
          1,
          greatest(
            -1,
            cos(radians(${request.locationLat}))
              * cos(radians((${dealerCapabilities.location}->>'lat')::double precision))
              * cos(radians((${dealerCapabilities.location}->>'lng')::double precision) - radians(${request.locationLng}))
              + sin(radians(${request.locationLat}))
              * sin(radians((${dealerCapabilities.location}->>'lat')::double precision))
          )
        )
      )
    ) <= coalesce(${dealerCapabilities.serviceRadius}, 100) * 1.5
  )`;
}

function requestWithinDealerRadius(dealer: DealerCapability) {
  if (!dealer.location) return undefined;

  return or(
    isNull(buyerRequests.locationLat),
    isNull(buyerRequests.locationLng),
    sql<boolean>`(
      6371 * acos(
        least(
          1,
          greatest(
            -1,
            cos(radians(${dealer.location.lat}))
              * cos(radians(${buyerRequests.locationLat}))
              * cos(radians(${buyerRequests.locationLng}) - radians(${dealer.location.lng}))
              + sin(radians(${dealer.location.lat}))
              * sin(radians(${buyerRequests.locationLat}))
          )
        )
      )
    ) <= ${dealer.serviceRadius} * 1.5`,
  );
}

export async function getScoredDealerCandidatesForRequest(
  request: BuyerRequestRow,
  limit = MIN_DEALER_CANDIDATES,
): Promise<
  Array<{
    dealership: DealershipRow;
    capabilities: DealerCapabilityRow;
    matchScore: MatchScore;
  }>
> {
  const filters = [
    or(
      eq(dealerships.verificationState, 'pending'),
      eq(dealerships.verificationState, 'verified'),
    ),
    isNotNull(dealerCapabilities.location),
  ];

  if (getRequestType(request) === 'fixed' && hasSpecificMake(request.make)) {
    filters.push(dealerMakeOverlapsRequestMake(request.make));
  }

  const locationFilter = dealerWithinRequestRadius(request);
  if (locationFilter) {
    filters.push(locationFilter);
  }

  const candidateLimit = Math.max(limit, MIN_DEALER_CANDIDATES);

  const dealersWithCapabilities = await db
    .select({
      dealership: dealerships,
      capabilities: dealerCapabilities,
    })
    .from(dealerships)
    .innerJoin(dealerCapabilities, eq(dealerships.id, dealerCapabilities.dealershipId))
    .where(and(...filters))
    .orderBy(
      desc(dealerships.ratingAverage),
      desc(dealerships.responseRate),
      desc(dealerships.createdAt),
    )
    .limit(candidateLimit);

  return dealersWithCapabilities
    .map(({ dealership, capabilities }) => {
      const dealerCapability = toDealerCapability(capabilities);

      if (!dealerCapability.location) {
        return null;
      }

      const matchScore = calculateMatchScore(request, dealerCapability);
      if (matchScore.score <= 0) return null;

      return {
        dealership,
        capabilities,
        matchScore,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.matchScore.score - a.matchScore.score);
}

/**
 * Calculate matching score between a buyer request and dealer capabilities
 */
export function calculateMatchScore(
  request: BuyerRequestForMatching,
  dealer: DealerCapability
): MatchScore {
  let score = 0;
  const reasons: string[] = [];
  const requestType = getRequestType(request);

  const normalizedMakes = dealer.makes.map((make) => make.toLowerCase());
  const normalizedModels = dealer.models.map((model) => model.toLowerCase());
  const requestMake = request.make?.toLowerCase();
  const requestModel = request.model?.toLowerCase();

  // Location matching (30% weight)
  let distance: number | undefined;
  if (
    typeof request.locationLat === 'number' &&
    typeof request.locationLng === 'number' &&
    dealer.location
  ) {
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

  if (requestType === 'open') {
    let signalCount = 0;
    let matchedSignals = 0;

    if (request.bodyType) {
      signalCount += 1;
      if (capabilityMatches(dealer.bodyTypes, request.bodyType)) {
        score += 25;
        matchedSignals += 1;
        reasons.push(`Matches ${request.bodyType} body type`);
      } else if (dealer.bodyTypes.length === 0) {
        score += 10;
        matchedSignals += 0.5;
        reasons.push('Broad body type coverage');
      }
    }

    if (request.fuelType) {
      signalCount += 1;
      if (capabilityMatches(dealer.fuelTypes, request.fuelType)) {
        score += 20;
        matchedSignals += 1;
        reasons.push(`Offers ${request.fuelType} vehicles`);
      } else if (dealer.fuelTypes.length === 0) {
        score += 8;
        matchedSignals += 0.5;
        reasons.push('Broad fuel type coverage');
      }
    }

    if (request.budgetMax) {
      signalCount += 1;
      if (dealer.maxPrice >= request.budgetMax) {
        score += 15;
        matchedSignals += 1;
        reasons.push('Within budget range');
      }
    }

    if (request.yearFrom || request.yearTo) {
      signalCount += 1;
      const requestMin = request.yearFrom || 1990;
      const requestMax = request.yearTo || new Date().getFullYear() + 1;

      if (dealer.minYear <= requestMax && dealer.maxYear >= requestMin) {
        score += 5;
        matchedSignals += 1;
        reasons.push(`Year range matches (${dealer.minYear}-${dealer.maxYear})`);
      }
    }

    if (request.maxKm) {
      signalCount += 1;
      if (dealer.maxKm >= request.maxKm) {
        score += 5;
        matchedSignals += 1;
        reasons.push(`Can provide cars with ≤${request.maxKm}km`);
      }
    }

    const hasLocationSignal = typeof distance === 'number';
    const confidenceBase = signalCount > 0 ? matchedSignals / signalCount : 0;
    const confidence = Math.round(
      Math.min(100, confidenceBase * 70 + (hasLocationSignal ? 30 : 0)),
    );

    return {
      requestId: request.id,
      dealershipId: dealer.dealershipId,
      score: Math.min(score, 100),
      confidence,
      matchType: 'open',
      reasons,
      distance,
    };
  }

  // If a dealership has explicit make capabilities and the request make either is missing
  // or does not match, treat it as a non-match.
  if (normalizedMakes.length > 0 && (!requestMake || !normalizedMakes.includes(requestMake))) {
    return {
      requestId: request.id,
      dealershipId: dealer.dealershipId,
      score: 0,
      confidence: 0,
      matchType: 'fixed',
      reasons: [],
      distance,
    };
  }

  // Make/Model matching (25% weight)
  if (requestMake && normalizedMakes.includes(requestMake)) {
    score += 25;
    reasons.push(`Specializes in ${request.make}`);

    if (
      requestModel &&
      normalizedModels.some(
        (m) => m.includes(requestModel) || requestModel.includes(m),
      )
    ) {
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
    confidence: Math.min(score, 100),
    matchType: 'fixed',
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

  return (await getScoredDealerCandidatesForRequest(
    request,
    Math.max(limit * DEFAULT_CANDIDATE_MULTIPLIER, MIN_DEALER_CANDIDATES),
  ))
    .map((candidate) => candidate.matchScore)
    .slice(0, limit);
}

/**
 * Get personalized buyer requests for a dealer
 */
export async function getPersonalizedBuyerRequests(
  dealershipId: string,
): Promise<BuyerRequestRow[]> {
  const matches = await getMatchingBuyerRequestsForDealer(dealershipId, 50);

  if (matches.length === 0) {
    return [];
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

export async function getMatchingBuyerRequestsForDealer(
  dealershipId: string,
  limit = 100,
): Promise<MatchScore[]> {
  const [capability] = await db
    .select()
    .from(dealerCapabilities)
    .where(eq(dealerCapabilities.dealershipId, dealershipId))
    .limit(1);

  if (!capability) return [];

  const dealer = toDealerCapability(capability);

  if (!dealer.location) return [];

  const filters = [eq(buyerRequests.status, 'open')];
  const makeFilter = requestMakeOverlapsDealerMakes(dealer.makes);
  if (makeFilter) {
    const openOrMakeFilter = or(eq(buyerRequests.requestType, 'open'), makeFilter);
    if (openOrMakeFilter) filters.push(openOrMakeFilter);
  }

  const locationFilter = requestWithinDealerRadius(dealer);
  if (locationFilter) filters.push(locationFilter);

  const candidateLimit = Math.max(limit * DEFAULT_CANDIDATE_MULTIPLIER, MIN_DEALER_CANDIDATES);

  const requests = await db
    .select()
    .from(buyerRequests)
    .where(and(...filters))
    .orderBy(desc(buyerRequests.qualityScore), desc(buyerRequests.createdAt))
    .limit(candidateLimit);

  const matches: MatchScore[] = [];

  for (const request of requests) {
    const match = calculateMatchScore(request, dealer);
    if (match.score > 0) {
      matches.push(match);
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
