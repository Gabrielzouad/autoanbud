export type VehicleMake = {
  make: string;
  aliases?: string[];
  models: string[];
};

export type NormalizedVehicleMake = {
  make: string;
  confidence: 'exact' | 'alias' | 'fuzzy';
};

export type NormalizedVehicleModel = {
  model: string;
  confidence: 'exact' | 'fuzzy';
};

export const VEHICLE_CATALOG: VehicleMake[] = [
  {
    make: 'Audi',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'e-tron', 'e-tron GT'],
  },
  {
    make: 'BMW',
    models: ['1-serie', '2-serie', '3-serie', '4-serie', '5-serie', '7-serie', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'i3', 'i4', 'iX', 'iX1', 'iX3'],
  },
  {
    make: 'Ford',
    models: ['Fiesta', 'Focus', 'Kuga', 'Mondeo', 'Mustang Mach-E', 'Puma', 'Ranger', 'S-Max', 'Transit Connect'],
  },
  {
    make: 'Hyundai',
    models: ['i10', 'i20', 'i30', 'IONIQ', 'IONIQ 5', 'IONIQ 6', 'Kona', 'Santa Fe', 'Tucson'],
  },
  {
    make: 'Kia',
    models: ['Ceed', 'e-Niro', 'EV3', 'EV6', 'EV9', 'Niro', 'Picanto', 'ProCeed', 'Sorento', 'Sportage', 'Soul'],
  },
  {
    make: 'Mazda',
    models: ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-30'],
  },
  {
    make: 'Mercedes-Benz',
    aliases: ['Mercedes', 'Mercedes Benz'],
    models: ['A-Klasse', 'B-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'Vito'],
  },
  {
    make: 'Nissan',
    models: ['Ariya', 'Juke', 'Leaf', 'Micra', 'Qashqai', 'X-Trail'],
  },
  {
    make: 'Peugeot',
    models: ['208', '2008', '308', '3008', '5008', 'Partner', 'Rifter'],
  },
  {
    make: 'Polestar',
    models: ['2', '3', '4'],
  },
  {
    make: 'Renault',
    models: ['Captur', 'Clio', 'Kangoo', 'Megane', 'Scenic', 'Zoe'],
  },
  {
    make: 'Skoda',
    aliases: ['Škoda'],
    models: ['Citigo', 'Enyaq', 'Fabia', 'Karoq', 'Kodiaq', 'Octavia', 'Scala', 'Superb'],
  },
  {
    make: 'Tesla',
    models: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  },
  {
    make: 'Toyota',
    models: ['Auris', 'Avensis', 'bZ4X', 'C-HR', 'Corolla', 'Hilux', 'Land Cruiser', 'Proace', 'RAV4', 'Yaris', 'Yaris Cross'],
  },
  {
    make: 'Volkswagen',
    aliases: ['VW'],
    models: ['Arteon', 'Caddy', 'Golf', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'Passat', 'Polo', 'T-Cross', 'T-Roc', 'Tiguan', 'Touran', 'Transporter'],
  },
  {
    make: 'Volvo',
    models: ['C40', 'EX30', 'EX40', 'EX90', 'S60', 'S90', 'V40', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90'],
  },
];

const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const compactNormalize = (value: string) => normalize(value).replace(/\s+/g, '');

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function fuzzyThreshold(value: string) {
  if (value.length <= 2) return 0;
  if (value.length <= 5) return 1;
  return 2;
}

function fuzzyDistance(value: string, candidate: string) {
  const normalizedValue = compactNormalize(value);
  const normalizedCandidate = compactNormalize(candidate);
  if (!normalizedValue || !normalizedCandidate) return Number.POSITIVE_INFINITY;
  return levenshteinDistance(normalizedValue, normalizedCandidate);
}

function isFuzzyMatch(value: string, candidate: string) {
  const normalizedValue = compactNormalize(value);
  const distance = fuzzyDistance(value, candidate);
  return distance > 0 && distance <= fuzzyThreshold(normalizedValue);
}

export const VEHICLE_MAKES = VEHICLE_CATALOG.map((entry) => entry.make);

export function findVehicleMake(value: string) {
  const normalized = normalize(value);
  if (!normalized) return null;

  return (
    VEHICLE_CATALOG.find(
      (entry) =>
        normalize(entry.make) === normalized ||
        entry.aliases?.some((alias) => normalize(alias) === normalized),
    ) ?? null
  );
}

export function normalizeVehicleMake(value: string): NormalizedVehicleMake | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const exact = VEHICLE_CATALOG.find((entry) => normalize(entry.make) === normalize(trimmed));
  if (exact) return { make: exact.make, confidence: 'exact' };

  const alias = VEHICLE_CATALOG.find((entry) =>
    entry.aliases?.some((aliasValue) => normalize(aliasValue) === normalize(trimmed)),
  );
  if (alias) return { make: alias.make, confidence: 'alias' };

  const fuzzy = VEHICLE_CATALOG.map((entry) => ({
    make: entry.make,
    distance: Math.min(
      fuzzyDistance(trimmed, entry.make),
      ...(entry.aliases ?? []).map((aliasValue) => fuzzyDistance(trimmed, aliasValue)),
    ),
  }))
    .filter((entry) => entry.distance <= fuzzyThreshold(compactNormalize(trimmed)))
    .sort((a, b) => a.distance - b.distance || a.make.localeCompare(b.make))[0];

  return fuzzy ? { make: fuzzy.make, confidence: 'fuzzy' } : null;
}

export function canonicalizeVehicleMake(value: string) {
  return normalizeVehicleMake(value)?.make ?? value.trim();
}

export function normalizeVehicleModel(
  make: string,
  value: string,
): NormalizedVehicleModel | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const entry = normalizeVehicleMake(make);
  const sourceModels = entry
    ? VEHICLE_CATALOG.find((item) => item.make === entry.make)?.models ?? []
    : VEHICLE_CATALOG.flatMap((item) => item.models);

  const exact = sourceModels.find((model) => normalize(model) === normalize(trimmed));
  if (exact) return { model: exact, confidence: 'exact' };

  const fuzzy = sourceModels
    .map((model) => ({
      model,
      distance: fuzzyDistance(trimmed, model),
    }))
    .filter((model) => model.distance <= fuzzyThreshold(compactNormalize(trimmed)))
    .sort((a, b) => a.distance - b.distance || a.model.localeCompare(b.model))[0];

  return fuzzy ? { model: fuzzy.model, confidence: 'fuzzy' } : null;
}

export function canonicalizeVehicleModel(make: string, value: string) {
  return normalizeVehicleModel(make, value)?.model ?? value.trim();
}

export function getMakeSuggestions(query: string, limit = 8) {
  const normalized = normalize(query);
  const scored = VEHICLE_CATALOG.map((entry) => {
    const haystack = [entry.make, ...(entry.aliases ?? [])].map(normalize);
    const exact = haystack.some((value) => value === normalized);
    const startsWith = haystack.some((value) => value.startsWith(normalized));
    const includes = haystack.some((value) => value.includes(normalized));
    const fuzzy = normalized.length >= 4 && haystack.some((value) => isFuzzyMatch(normalized, value));
    return {
      make: entry.make,
      score: exact ? 0 : startsWith ? 1 : includes ? 2 : fuzzy ? 3 : normalized ? 4 : 1,
    };
  });

  return scored
    .filter((item) => item.score < 4)
    .sort((a, b) => a.score - b.score || a.make.localeCompare(b.make))
    .slice(0, limit)
    .map((item) => item.make);
}

export function getModelSuggestions(make: string, query: string, limit = 8) {
  const normalized = normalize(query);
  const entry = findVehicleMake(make);
  const sourceModels = entry
    ? entry.models
    : Array.from(new Set(VEHICLE_CATALOG.flatMap((item) => item.models)));

  return sourceModels
    .map((model) => {
      const normalizedModel = normalize(model);
      const exact = normalizedModel === normalized;
      const startsWith = normalizedModel.startsWith(normalized);
      const includes = normalizedModel.includes(normalized);
      const fuzzy = normalized.length >= 3 && isFuzzyMatch(normalized, normalizedModel);
      return {
        model,
        score: exact ? 0 : startsWith ? 1 : includes ? 2 : fuzzy ? 3 : normalized ? 4 : 1,
      };
    })
    .filter((item) => item.score < 4)
    .sort((a, b) => a.score - b.score || a.model.localeCompare(b.model))
    .slice(0, limit)
    .map((item) => item.model);
}
