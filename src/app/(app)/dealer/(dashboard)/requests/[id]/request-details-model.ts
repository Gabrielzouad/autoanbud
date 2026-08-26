import { calculateOfferCompletenessScore } from '@/lib/offerCompleteness';

export type DealerRequest = {
  id: string;
  title: string;
  requestType?: 'fixed' | 'open';
  make: string;
  model: string;
  yearFrom?: number | null;
  locationCity?: string;
  budgetMax: number;
  status: string;
  postedAt: string;
  description: string;
  fuelType?: string | null;
  transmission?: string | null;
  imageUrls?: string[];
  dealerAction?: 'declined' | 'bookmarked' | 'interested';
  dealerActionLabel?: string | null;
};

export type OfferFormState = {
  success: boolean;
  message: string | null;
  errors: Record<string, string[] | undefined>;
};

export type UploadedOfferImage = {
  id: string;
  name: string;
  previewUrl: string;
  file?: File;
  url?: string;
  status: 'uploading' | 'ready' | 'error';
  error?: string;
};

export const initialOfferFormState: OfferFormState = {
  success: false,
  message: null,
  errors: {},
};

export function getOfferFormCompleteness(form: HTMLFormElement) {
  const formData = new FormData(form);
  const getString = (name: string) => String(formData.get(name) ?? '');

  return calculateOfferCompletenessScore({
    carMake: getString('carMake'),
    carModel: getString('carModel'),
    carYear: getString('carYear'),
    carKm: getString('carKm'),
    priceTotal: getString('priceTotal'),
    deliveryTimeEstimate: getString('deliveryTimeEstimate'),
    warrantySummary: getString('warrantySummary'),
    shortMessageToBuyer: getString('shortMessageToBuyer'),
    financingPossible: formData.get('financingPossible') === 'on',
    financingExample: getString('financingExample'),
    inspectionIncluded: formData.get('inspectionIncluded') === 'on',
  });
}
