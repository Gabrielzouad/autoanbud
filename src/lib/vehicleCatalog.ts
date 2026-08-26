export type VehicleMake = {
  make: string;
  aliases?: string[];
  models: string[];
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

const normalize = (value: string) => value.trim().toLowerCase();

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

export function canonicalizeVehicleMake(value: string) {
  return findVehicleMake(value)?.make ?? value.trim();
}

export function getMakeSuggestions(query: string, limit = 8) {
  const normalized = normalize(query);
  const scored = VEHICLE_CATALOG.map((entry) => {
    const haystack = [entry.make, ...(entry.aliases ?? [])].map(normalize);
    const exact = haystack.some((value) => value === normalized);
    const startsWith = haystack.some((value) => value.startsWith(normalized));
    const includes = haystack.some((value) => value.includes(normalized));
    return {
      make: entry.make,
      score: exact ? 0 : startsWith ? 1 : includes ? 2 : normalized ? 3 : 1,
    };
  });

  return scored
    .filter((item) => item.score < 3)
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
      return {
        model,
        score: exact ? 0 : startsWith ? 1 : includes ? 2 : normalized ? 3 : 1,
      };
    })
    .filter((item) => item.score < 3)
    .sort((a, b) => a.score - b.score || a.model.localeCompare(b.model))
    .slice(0, limit)
    .map((item) => item.model);
}
