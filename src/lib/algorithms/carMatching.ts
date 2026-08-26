// src/lib/algorithms/carMatching.ts
import { getDistance } from 'geolib';
import { db, buyerRequests, dealerships, dealerCapabilities } from '@/db';
import { eq, and, or, isNull, isNotNull, desc, sql } from 'drizzle-orm';
import { normalizeCoordinates } from '@/lib/geo';

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
  meta?: unknown;
}

type BuyerRequestRow = typeof buyerRequests.$inferSelect;
type DealerCapabilityRow = typeof dealerCapabilities.$inferSelect;
type DealershipRow = typeof dealerships.$inferSelect;

type DealerLocation = NonNullable<DealerCapability['location']>;

const DEFAULT_CANDIDATE_MULTIPLIER = 20;
const MIN_DEALER_CANDIDATES = 50;
const UNKNOWN_MAKE_VALUES = new Set(['ukjent', 'unknown', 'uspesifisert']);
const CURRENT_YEAR = new Date().getFullYear();

const MATCH_WEIGHTS = {
  location: 30,
  fixedMake: 23,
  fixedModel: 10,
  fixedYear: 10,
  fixedMileage: 7,
  fixedFuel: 7,
  fixedGearbox: 4,
  fixedBody: 4,
  fixedBudget: 5,
  openBody: 25,
  openFuel: 20,
  openBudget: 15,
  openYear: 5,
  openMileage: 5,
} as const;

export function normalizeDealerLocation(value: unknown): DealerLocation | null {
  const parsedValue = typeof value === 'string' ? safeParseJson(value) : value;

  if (!parsedValue || typeof parsedValue !== 'object') return null;

  const location = parsedValue as {
    lat?: unknown;
    lng?: unknown;
    city?: unknown;
  };
  const coordinates = normalizeCoordinates(location.lat, location.lng);

  if (!coordinates) return null;

  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
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
  if (!make) return false;
  const normalized = normalizeText(make);
  return normalized.length > 0 && !UNKNOWN_MAKE_VALUES.has(normalized);
}

function getRequestType(request: BuyerRequestForMatching): 'fixed' | 'open' {
  return request.requestType === 'open' ? 'open' : 'fixed';
}

function normalizeText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeCompact(value: string) {
  return normalizeText(value).replace(/\s+/g, '');
}

function normalizeList(values: string[]) {
  return values.map(normalizeText).filter(Boolean);
}

function capabilityMatches(values: string[], requested?: string | null) {
  if (!requested) return false;
  const normalizedRequested = normalizeText(requested);
  return normalizeList(values).includes(normalizedRequested);
}

function fuzzyCapabilityMatches(values: string[], requested?: string | null) {
  if (!requested) return false;
  const normalizedRequested = normalizeCompact(requested);
  if (!normalizedRequested) return false;

  return values.some((value) => {
    const normalizedValue = normalizeCompact(value);
    return (
      normalizedValue === normalizedRequested ||
      normalizedValue.includes(normalizedRequested) ||
      normalizedRequested.includes(normalizedValue)
    );
  });
}

function getDistanceScore(distance: number, serviceRadius: number) {
  const effectiveRadius = Math.max(serviceRadius, 1);

  if (distance <= effectiveRadius) {
    const closeness = 1 - Math.min(distance / effectiveRadius, 1);
    return Math.round(18 + closeness * 12);
  }

  if (distance <= effectiveRadius * 1.5) {
    const overflowRatio = (distance - effectiveRadius) / (effectiveRadius * 0.5);
    return Math.round(6 + (1 - overflowRatio) * 8);
  }

  return 0;
}

function getYearOverlapScore(
  dealerMinYear: number,
  dealerMaxYear: number,
  requestMinYear: number,
  requestMaxYear: number,
  maxScore: number,
) {
  const overlapStart = Math.max(dealerMinYear, requestMinYear);
  const overlapEnd = Math.min(dealerMaxYear, requestMaxYear);
  if (overlapStart > overlapEnd) return 0;

  const requestSpan = Math.max(1, requestMaxYear - requestMinYear + 1);
  const overlapSpan = overlapEnd - overlapStart + 1;
  return Math.max(1, Math.round(maxScore * Math.min(1, overlapSpan / requestSpan)));
}

function getMileageScore(dealerMaxKm: number, requestMaxKm: number, maxScore: number) {
  if (dealerMaxKm >= requestMaxKm) return maxScore;
  if (dealerMaxKm >= requestMaxKm * 0.8) return Math.round(maxScore * 0.5);
  return 0;
}

function getBudgetScore(dealerMaxPrice: number, requestBudgetMax: number, maxScore: number) {
  if (dealerMaxPrice >= requestBudgetMax) return maxScore;
  if (dealerMaxPrice >= requestBudgetMax * 0.8) return Math.round(maxScore * 0.5);
  return 0;
}

function compareMatchScores(a: MatchScore, b: MatchScore) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.confidence !== a.confidence) return b.confidence - a.confidence;

  const aDistance = a.distance ?? Number.POSITIVE_INFINITY;
  const bDistance = b.distance ?? Number.POSITIVE_INFINITY;
  return aDistance - bDistance;
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
    .sort((a, b) => compareMatchScores(a.matchScore, b.matchScore));
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
  let possibleConfidenceWeight = 0;
  let matchedConfidenceWeight = 0;

  const addScore = (points: number, reason: string, confidenceWeight = points) => {
    score += points;
    matchedConfidenceWeight += confidenceWeight;
    reasons.push(reason);
  };

  const addMissedSignal = (confidenceWeight: number) => {
    possibleConfidenceWeight += confidenceWeight;
  };

  const normalizedMakes = normalizeList(dealer.makes);
  const requestMake = hasSpecificMake(request.make)
    ? normalizeText(request.make)
    : undefined;
  const requestModel = request.model ? normalizeText(request.model) : undefined;

  // Location matching
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

    possibleConfidenceWeight += MATCH_WEIGHTS.location;
    const distanceScore = getDistanceScore(distance, dealer.serviceRadius);

    if (distanceScore > 0) {
      addScore(
        distanceScore,
        distance <= dealer.serviceRadius
          ? `Within service radius (${distance.toFixed(1)}km)`
          : `Slightly outside radius (${distance.toFixed(1)}km)`,
        distanceScore,
      );
    } else {
      return {
        requestId: request.id,
        dealershipId: dealer.dealershipId,
        score: 0,
        confidence: 0,
        matchType: requestType,
        reasons: [],
        distance,
      };
    }
  }

  if (requestType === 'open') {
    if (request.bodyType) {
      addMissedSignal(MATCH_WEIGHTS.openBody);
      if (capabilityMatches(dealer.bodyTypes, request.bodyType)) {
        addScore(MATCH_WEIGHTS.openBody, `Matches ${request.bodyType} body type`);
      }
    }

    if (request.fuelType) {
      addMissedSignal(MATCH_WEIGHTS.openFuel);
      if (capabilityMatches(dealer.fuelTypes, request.fuelType)) {
        addScore(MATCH_WEIGHTS.openFuel, `Offers ${request.fuelType} vehicles`);
      }
    }

    if (request.budgetMax) {
      addMissedSignal(MATCH_WEIGHTS.openBudget);
      const budgetScore = getBudgetScore(dealer.maxPrice, request.budgetMax, MATCH_WEIGHTS.openBudget);
      if (budgetScore > 0) {
        addScore(budgetScore, 'Dealer price range fits buyer budget', budgetScore);
      }
    }

    if (request.yearFrom || request.yearTo) {
      const requestMin = request.yearFrom || 1990;
      const requestMax = request.yearTo || CURRENT_YEAR + 1;
      addMissedSignal(MATCH_WEIGHTS.openYear);

      const yearScore = getYearOverlapScore(
        dealer.minYear,
        dealer.maxYear,
        requestMin,
        requestMax,
        MATCH_WEIGHTS.openYear,
      );
      if (yearScore > 0) {
        addScore(yearScore, `Year range matches (${dealer.minYear}-${dealer.maxYear})`, yearScore);
      }
    }

    if (request.maxKm) {
      addMissedSignal(MATCH_WEIGHTS.openMileage);
      const mileageScore = getMileageScore(dealer.maxKm, request.maxKm, MATCH_WEIGHTS.openMileage);
      if (mileageScore > 0) {
        addScore(mileageScore, `Can provide cars with ≤${request.maxKm}km`, mileageScore);
      }
    }

    const confidence = possibleConfidenceWeight
      ? Math.round(Math.min(100, (matchedConfidenceWeight / possibleConfidenceWeight) * 100))
      : 0;

    return {
      requestId: request.id,
      dealershipId: dealer.dealershipId,
      score: Math.min(Math.round(score), 100),
      confidence,
      matchType: 'open',
      reasons,
      distance,
    };
  }

  // Keep known make mismatches strict, but let unknown makes match on model,
  // location, year, budget, and other concrete request signals.
  if (normalizedMakes.length > 0 && requestMake && !normalizedMakes.includes(requestMake)) {
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

  // Make/Model matching
  if (requestMake) {
    addMissedSignal(MATCH_WEIGHTS.fixedMake);
    if (normalizedMakes.includes(requestMake)) {
      addScore(MATCH_WEIGHTS.fixedMake, `Specializes in ${request.make}`);
    }
  }

  if (requestModel) {
    addMissedSignal(MATCH_WEIGHTS.fixedModel);
    if (fuzzyCapabilityMatches(dealer.models, request.model)) {
      addScore(
        requestMake ? MATCH_WEIGHTS.fixedModel : 15,
        requestMake ? `Has ${request.model} models` : `Matches ${request.model} model`,
        MATCH_WEIGHTS.fixedModel,
      );
    }
  }

  // Year range matching
  if (request.yearFrom || request.yearTo) {
    const requestMin = request.yearFrom || 1990;
    const requestMax = request.yearTo || CURRENT_YEAR + 1;
    addMissedSignal(MATCH_WEIGHTS.fixedYear);
    const yearScore = getYearOverlapScore(
      dealer.minYear,
      dealer.maxYear,
      requestMin,
      requestMax,
      MATCH_WEIGHTS.fixedYear,
    );

    if (yearScore > 0) {
      addScore(yearScore, `Year range matches (${dealer.minYear}-${dealer.maxYear})`, yearScore);
    }
  }

  // Mileage matching
  if (request.maxKm) {
    addMissedSignal(MATCH_WEIGHTS.fixedMileage);
    const mileageScore = getMileageScore(dealer.maxKm, request.maxKm, MATCH_WEIGHTS.fixedMileage);
    if (mileageScore > 0) {
      addScore(mileageScore, `Can provide cars with ≤${request.maxKm}km`, mileageScore);
    }
  }

  // Fuel type matching
  if (request.fuelType) {
    addMissedSignal(MATCH_WEIGHTS.fixedFuel);
    if (capabilityMatches(dealer.fuelTypes, request.fuelType)) {
      addScore(MATCH_WEIGHTS.fixedFuel, `Offers ${request.fuelType} vehicles`);
    }
  }

  // Transmission matching
  if (request.gearbox) {
    addMissedSignal(MATCH_WEIGHTS.fixedGearbox);
    if (capabilityMatches(dealer.gearboxTypes, request.gearbox)) {
      addScore(MATCH_WEIGHTS.fixedGearbox, `Has ${request.gearbox} transmission`);
    }
  }

  // Body type matching
  if (request.bodyType) {
    addMissedSignal(MATCH_WEIGHTS.fixedBody);
    if (capabilityMatches(dealer.bodyTypes, request.bodyType)) {
      addScore(MATCH_WEIGHTS.fixedBody, `Specializes in ${request.bodyType}s`);
    }
  }

  // Budget matching
  if (request.budgetMax) {
    addMissedSignal(MATCH_WEIGHTS.fixedBudget);
    const budgetScore = getBudgetScore(dealer.maxPrice, request.budgetMax, MATCH_WEIGHTS.fixedBudget);
    if (budgetScore > 0) {
      addScore(budgetScore, 'Dealer price range fits buyer budget', budgetScore);
    }
  }

  const confidence = possibleConfidenceWeight
    ? Math.round(Math.min(100, (matchedConfidenceWeight / possibleConfidenceWeight) * 100))
    : 0;

  return {
    requestId: request.id,
    dealershipId: dealer.dealershipId,
    score: Math.min(Math.round(score), 100),
    confidence,
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

  return matches.sort(compareMatchScores).slice(0, limit);
}
