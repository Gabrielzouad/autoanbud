import type { CreateBuyerRequestActionState } from '@/app/actions/buyerRequests';

export type RequestFormProps = {
  action: (
    state: CreateBuyerRequestActionState,
    formData: FormData,
  ) => Promise<CreateBuyerRequestActionState>;
};

export type FormState = {
  title: string;
  make: string;
  model: string;
  trim: string;
  yearFrom: string;
  yearTo: string;
  bodyType: string;
  fuel: string;
  seats: string;
  budget: string;
  mileage: string;
  description: string;
  locationCity: string;
  locationLat: string;
  locationLng: string;
  hasTradeIn: boolean;
  needsFinancing: boolean;
  tradeInReg: string;
  tradeInKm: string;
  tradeInNotes: string;
};

export type UploadedImage = {
  id: string;
  name: string;
  previewUrl: string;
  file?: File;
  url?: string;
  status: 'uploading' | 'ready' | 'error';
  error?: string;
};

export const BODY_TYPE_OPTIONS = [
  { value: 'SUV', label: 'SUV' },
  { value: 'Sedan', label: 'Sedan' },
  { value: 'Stasjonsvogn', label: 'Stasjonsvogn' },
  { value: 'Kombi', label: 'Kombi' },
  { value: 'Varebil', label: 'Varebil' },
  { value: 'Pickup', label: 'Pickup' },
];

export const FUEL_OPTIONS = [
  { value: 'Elektrisk', label: 'Elektrisk' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Bensin', label: 'Bensin' },
  { value: 'Diesel', label: 'Diesel' },
];

export type PersistedUploadedImage = Pick<
  UploadedImage,
  'id' | 'name' | 'previewUrl' | 'url' | 'status' | 'error'
>;

export type RequestDraft = {
  step: number;
  searchType: 'specific' | 'general' | null;
  formData: FormState;
  images: PersistedUploadedImage[];
  tradeInImages: PersistedUploadedImage[];
  updatedAt: string;
};

export const persistableImages = (
  items: UploadedImage[],
): PersistedUploadedImage[] =>
  items
    .filter((item) => item.status === 'ready' && item.url)
    .map((item) => ({
      id: item.id,
      name: item.name,
      previewUrl: item.url ?? item.previewUrl,
      url: item.url,
      status: 'ready',
    }));

export function isRequestDraft(value: unknown): value is RequestDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<RequestDraft>;
  return (
    typeof draft.step === 'number' &&
    (draft.searchType === 'specific' ||
      draft.searchType === 'general' ||
      draft.searchType === null) &&
    !!draft.formData &&
    typeof draft.formData === 'object' &&
    Array.isArray(draft.images) &&
    Array.isArray(draft.tradeInImages)
  );
}
