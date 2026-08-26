import * as React from 'react';

import type { CreateBuyerRequestActionState } from '@/app/actions/buyerRequests';
import {
  type AddressSuggestion,
  readAddressSuggestions,
} from '@/lib/addressSuggestions';
import { BUYER_REQUEST_SUBMITTED_STORAGE_KEY } from '@/lib/buyerRequestDraft';
import { normalizeCoordinates } from '@/lib/geo';
import { resolveLocationWithFallback } from '@/lib/locationFallback';
import {
  canonicalizeVehicleModel,
  canonicalizeVehicleMake,
  findVehicleMake,
  getMakeSuggestions,
  getModelSuggestions,
} from '@/lib/vehicleCatalog';
import type { FormState } from './request-form-model';

type SearchType = 'specific' | 'general' | null;

type UseBuyerRequestFormOptions = {
  actionState: CreateBuyerRequestActionState;
  readyImageUrls: string[];
  readyTradeInImageUrls: string[];
  searchType: SearchType;
};

const initialFormData: FormState = {
  title: '',
  make: '',
  model: '',
  trim: '',
  yearFrom: '',
  yearTo: '',
  bodyType: '',
  fuel: '',
  seats: '',
  budget: '',
  mileage: '',
  description: '',
  locationCity: '',
  locationLat: '',
  locationLng: '',
  hasTradeIn: false,
  needsFinancing: false,
  tradeInReg: '',
  tradeInKm: '',
  tradeInNotes: '',
};

export function useBuyerRequestForm({
  actionState,
  readyImageUrls,
  readyTradeInImageUrls,
  searchType,
}: UseBuyerRequestFormOptions) {
  const [formData, setFormData] = React.useState<FormState>(initialFormData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [locationSuggestions, setLocationSuggestions] = React.useState<
    AddressSuggestion[]
  >([]);
  const [locationDebounceTimer, setLocationDebounceTimer] =
    React.useState<ReturnType<typeof setTimeout> | null>(null);
  const [locationStatus, setLocationStatus] = React.useState<string | null>(
    null,
  );
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false);

  React.useEffect(() => {
    if (!actionState.errors) return;

    const nextErrors: Record<string, string> = {};
    Object.entries(actionState.errors).forEach(([key, value]) => {
      if (value?.[0]) nextErrors[key] = value[0];
    });
    setErrors(nextErrors);
    window.sessionStorage.removeItem(BUYER_REQUEST_SUBMITTED_STORAGE_KEY);
  }, [actionState.errors]);

  React.useEffect(() => {
    if (!actionState.formError) return;

    window.sessionStorage.removeItem(BUYER_REQUEST_SUBMITTED_STORAGE_KEY);
  }, [actionState.formError]);

  React.useEffect(() => {
    return () => {
      if (locationDebounceTimer) {
        clearTimeout(locationDebounceTimer);
      }
    };
  }, [locationDebounceTimer]);

  const updateFormData = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const makeSuggestions = React.useMemo(
    () => getMakeSuggestions(formData.make),
    [formData.make],
  );
  const modelSuggestions = React.useMemo(
    () => getModelSuggestions(formData.make, formData.model),
    [formData.make, formData.model],
  );
  const modelDatalistOptions = React.useMemo(
    () => getModelSuggestions(formData.make, '', 40),
    [formData.make],
  );

  const selectMake = (make: string) => {
    setFormData((prev) => {
      const previousMake = canonicalizeVehicleMake(prev.make);
      return {
        ...prev,
        make,
        model: previousMake && previousMake !== make ? '' : prev.model,
      };
    });
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.make;
      return copy;
    });
  };

  const handleMakeChange = (value: string) => {
    const selectedMake = findVehicleMake(value);

    setFormData((prev) => {
      const previousMake = canonicalizeVehicleMake(prev.make);
      const nextMake = selectedMake?.make ?? value;

      return {
        ...prev,
        make: nextMake,
        model:
          selectedMake && previousMake && previousMake !== selectedMake.make
            ? ''
            : prev.model,
      };
    });
  };

  const selectModel = (model: string) => {
    updateFormData('model', model);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.model;
      return copy;
    });
  };

  const handleMakeBlur = () => {
    const canonicalMake = canonicalizeVehicleMake(formData.make);
    if (canonicalMake && canonicalMake !== formData.make) {
      updateFormData('make', canonicalMake);
    }
  };

  const handleModelBlur = () => {
    const canonicalModel = canonicalizeVehicleModel(
      formData.make,
      formData.model,
    );
    if (canonicalModel && canonicalModel !== formData.model) {
      updateFormData('model', canonicalModel);
    }
  };

  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setLocationStatus(null);
      return;
    }

    setLocationStatus('Søker sted/område...');

    try {
      const response = await fetch(
        `/api/address-suggestions?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Location API error:', response.status, errorText);
        throw new Error('Kunne ikke hente sted/område-forslag');
      }

      const data: unknown = await response.json();
      setLocationSuggestions(readAddressSuggestions(data));
      setLocationStatus(null);
    } catch (error) {
      console.error('Failed to fetch location suggestions', error);
      setLocationSuggestions([]);
      setLocationStatus('Kunne ikke hente sted/område');
    }
  };

  const debouncedFetchLocationSuggestions = (query: string) => {
    if (locationDebounceTimer) {
      clearTimeout(locationDebounceTimer);
    }
    const timer = setTimeout(() => {
      fetchLocationSuggestions(query);
    }, 500);
    setLocationDebounceTimer(timer);
  };

  const selectLocationSuggestion = (suggestion: AddressSuggestion) => {
    const coordinates = normalizeCoordinates(suggestion.lat, suggestion.lng);
    updateFormData('locationCity', suggestion.display_name);
    updateFormData('locationLat', coordinates ? String(coordinates.lat) : '');
    updateFormData('locationLng', coordinates ? String(coordinates.lng) : '');
    setLocationSuggestions([]);
    setLocationStatus(
      coordinates
        ? null
        : 'Sted valgt uten koordinater. Matching blir mindre presis.',
    );
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.locationCity;
      return copy;
    });
  };

  const useCurrentLocation = async () => {
    setIsResolvingLocation(true);
    setLocationStatus('Henter posisjon...');
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.locationCity;
      return copy;
    });

    try {
      const location = await resolveLocationWithFallback();
      const coordinates = normalizeCoordinates(location.lat, location.lng);
      if (!coordinates) {
        throw new Error('Fant ikke koordinater. Skriv inn sted manuelt.');
      }

      const locationLabel =
        location.city ?? (formData.locationCity.trim() || 'Min posisjon');
      updateFormData('locationLat', String(coordinates.lat));
      updateFormData('locationLng', String(coordinates.lng));
      updateFormData('locationCity', locationLabel);
      setLocationSuggestions([]);
      setLocationStatus(
        location.source === 'browser'
          ? 'Posisjon hentet. Du kan fortsatt skrive inn sted manuelt.'
          : 'Omtrentlig sted hentet. Du kan justere manuelt.',
      );
    } catch (error) {
      setLocationStatus(
        error instanceof Error
          ? error.message
          : 'Kunne ikke hente posisjon. Skriv inn sted manuelt.',
      );
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const normalizedFuelType = normalizeFuel(formData.fuel);
  const normalizedBodyType = normalizeBodyType(formData.bodyType);

  const buildPayload = () => ({
    title:
      formData.title?.trim() ||
      `${formData.make} ${formData.model}`.trim() ||
      'Forespørsel',
    make: formData.make,
    model: formData.model,
    generation: formData.trim,
    yearFrom: formData.yearFrom,
    yearTo: formData.yearTo,
    bodyType: normalizedBodyType,
    fuelType: normalizedFuelType,
    maxKm: formData.mileage,
    seats: formData.seats,
    budgetMax: formData.budget,
    locationCity: formData.locationCity,
    wantsTradeIn: formData.hasTradeIn ? 'on' : '',
    financingNeeded: formData.needsFinancing ? 'on' : '',
    tradeInReg: formData.tradeInReg,
    tradeInKm: formData.tradeInKm,
    tradeInNotes: formData.tradeInNotes,
    tradeInImageUrls: JSON.stringify(readyTradeInImageUrls),
    description: formData.description,
    imageUrls: JSON.stringify(readyImageUrls),
    requestType: searchType === 'general' ? 'open' : 'fixed',
    searchType,
  });

  const validateStepTwo = () => {
    const stepErrors: Record<string, string> = {};
    if (!formData.title || formData.title.trim().length < 3) {
      stepErrors.title = 'Tittel må være minst 3 tegn';
    }
    if (searchType === 'specific') {
      if (!formData.make.trim()) stepErrors.make = 'Merke er påkrevd';
      if (!formData.model.trim()) stepErrors.model = 'Modell er påkrevd';
    } else if (searchType === 'general') {
      if (!formData.bodyType.trim())
        stepErrors.bodyType = 'Karosseri er påkrevd';
    }
    if (!formData.budget.trim()) stepErrors.budget = 'Budsjett er påkrevd';
    if (!formData.locationCity.trim())
      stepErrors.locationCity = 'Sted/område er påkrevd';

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    updateFormData,
    makeSuggestions,
    modelSuggestions,
    modelDatalistOptions,
    selectMake,
    handleMakeChange,
    selectModel,
    handleMakeBlur,
    handleModelBlur,
    locationSuggestions,
    locationStatus,
    isResolvingLocation,
    debouncedFetchLocationSuggestions,
    selectLocationSuggestion,
    useCurrentLocation,
    normalizedFuelType,
    normalizedBodyType,
    buildPayload,
    validateStepTwo,
  };
}

function normalizeFuel(value: string) {
  const fuel = value.trim().toLowerCase();
  if (!fuel) return '';

  if (['bensin', 'petrol', 'gasoline', 'nafta'].includes(fuel))
    return 'petrol';
  if (['diesel'].includes(fuel)) return 'diesel';
  if (['hybrid', 'plug-in hybrid', 'phev'].includes(fuel)) return 'hybrid';
  if (['ev', 'electric', 'elektrisk', 'elbil'].includes(fuel)) return 'ev';

  return 'other';
}

function normalizeBodyType(value: string) {
  const body = value.trim().toLowerCase();
  if (!body) return '';

  if (body.includes('suv')) return 'suv';
  if (body.includes('sedan')) return 'sedan';
  if (body.includes('wagon') || body.includes('stasjon')) return 'wagon';
  if (body.includes('hatch')) return 'hatchback';
  if (body.includes('coupe')) return 'coupe';
  if (body.includes('convertible') || body.includes('cabrio'))
    return 'convertible';
  if (body.includes('van')) return 'van';
  if (body.includes('pickup') || body.includes('pick-up')) return 'pickup';

  return 'other';
}
