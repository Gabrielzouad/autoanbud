export type AddressSuggestion = {
  display_name: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

export function isAddressSuggestion(value: unknown): value is AddressSuggestion {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const suggestion = value as Record<string, unknown>;

  return (
    typeof suggestion.display_name === 'string' &&
    typeof suggestion.street === 'string' &&
    typeof suggestion.number === 'string' &&
    typeof suggestion.postalCode === 'string' &&
    typeof suggestion.city === 'string' &&
    (suggestion.lat === null || typeof suggestion.lat === 'number') &&
    (suggestion.lng === null || typeof suggestion.lng === 'number')
  );
}

export function readAddressSuggestions(value: unknown): AddressSuggestion[] {
  return Array.isArray(value) ? value.filter(isAddressSuggestion) : [];
}

export function formatAddressSuggestionAddress(
  suggestion: AddressSuggestion,
): string {
  const structuredAddress = [suggestion.street, suggestion.number]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    structuredAddress ||
    suggestion.display_name.split(',')[0]?.trim() ||
    suggestion.display_name
  );
}
