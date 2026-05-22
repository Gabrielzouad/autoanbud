export const MIN_OFFER_COMPLETENESS_SCORE = 60;

export type OfferCompletenessInput = {
  carMake?: string | null;
  carModel?: string | null;
  carYear?: number | string | null;
  carKm?: number | string | null;
  priceTotal?: number | string | null;
  deliveryTimeEstimate?: string | null;
  warrantySummary?: string | null;
  financingPossible?: boolean | null;
  financingExample?: string | null;
  shortMessageToBuyer?: string | null;
  inspectionIncluded?: boolean | null;
};

export type OfferCompletenessResult = {
  score: number;
  requiredScore: number;
  valueScore: number;
  isSubmittable: boolean;
  missingRequiredFields: string[];
  optionalGaps: string[];
};

function hasText(value?: string | null, minLength = 1) {
  return (value ?? "").trim().length >= minLength;
}

function hasPositiveNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return false;
  const numberValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(numberValue) && numberValue >= 0;
}

export function calculateOfferCompletenessScore(
  data: OfferCompletenessInput,
): OfferCompletenessResult {
  const requiredChecks = [
    { label: "merke", complete: hasText(data.carMake) },
    { label: "modell", complete: hasText(data.carModel) },
    { label: "årsmodell", complete: hasPositiveNumber(data.carYear) },
    { label: "kilometerstand", complete: hasPositiveNumber(data.carKm) },
    { label: "pris", complete: hasPositiveNumber(data.priceTotal) },
  ];

  const missingRequiredFields = requiredChecks
    .filter((check) => !check.complete)
    .map((check) => check.label);

  const requiredScore = requiredChecks.reduce(
    (score, check) => score + (check.complete ? 12 : 0),
    0,
  );

  const valueChecks = [
    {
      label: "garanti",
      points: 10,
      complete: hasText(data.warrantySummary, 10),
    },
    {
      label: "levering",
      points: 10,
      complete: hasText(data.deliveryTimeEstimate, 3),
    },
    {
      label: "personlig melding",
      points: 10,
      complete: hasText(data.shortMessageToBuyer, 20),
    },
    {
      label: "inspeksjon",
      points: 5,
      complete: data.inspectionIncluded === true,
    },
    {
      label: "finansiering",
      points: 5,
      complete:
        data.financingPossible === true ||
        hasText(data.financingExample, 10),
    },
  ];

  const valueScore = valueChecks.reduce(
    (score, check) => score + (check.complete ? check.points : 0),
    0,
  );
  const optionalGaps = valueChecks
    .filter((check) => !check.complete)
    .map((check) => check.label);
  const score = Math.min(100, requiredScore + valueScore);

  return {
    score,
    requiredScore,
    valueScore,
    isSubmittable:
      score >= MIN_OFFER_COMPLETENESS_SCORE &&
      missingRequiredFields.length === 0,
    missingRequiredFields,
    optionalGaps,
  };
}
