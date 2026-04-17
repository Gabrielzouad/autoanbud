'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Building2,
  MapPin,
  Car,
  Fuel,
  Settings,
  Truck,
  CreditCard,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { dealerOnboardingAction } from '@/app/actions/dealerOnboarding';

const CAR_MAKES = [
  'Toyota',
  'Volkswagen',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Ford',
  'Honda',
  'Nissan',
  'Hyundai',
  'Kia',
  'Volvo',
  'Peugeot',
  'Renault',
  'Opel',
  'Skoda',
  'Seat',
  'Tesla',
];

const FUEL_TYPES = [
  { value: 'petrol', label: 'Bensin', icon: Fuel },
  { value: 'diesel', label: 'Diesel', icon: Fuel },
  { value: 'hybrid', label: 'Hybrid', icon: Fuel },
  { value: 'ev', label: 'Elektrisk', icon: Fuel },
];

const GEARBOX_TYPES = [
  { value: 'automatic', label: 'Automatisk', icon: Settings },
  { value: 'manual', label: 'Manuell', icon: Settings },
];

const BODY_TYPES = [
  { value: 'sedan', label: 'Sedan', icon: Car },
  { value: 'suv', label: 'SUV', icon: Truck },
  { value: 'wagon', label: 'Stasjonsvogn', icon: Car },
  { value: 'hatchback', label: 'Hatchback', icon: Car },
  { value: 'coupe', label: 'Coupe', icon: Car },
  { value: 'convertible', label: 'Cabriolet', icon: Car },
];

export function DealerOnboardingForm({
  dealership,
  initialCapabilities,
}: {
  dealership?: {
    id: string;
    name: string;
    orgNumber: string;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
  };
  initialCapabilities?: {
    makes: string[];
    models: string[];
    minYear: number;
    maxYear: number;
    maxKm: number;
    fuelTypes: string[];
    gearboxTypes: string[];
    bodyTypes: string[];
    maxPrice: number;
    serviceRadius: number;
    location?: {
      lat: number;
      lng: number;
      city: string;
    } | null;
  } | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const hasExistingCapabilities = Boolean(initialCapabilities);
  const [name, setName] = useState(dealership?.name || '');
  const [orgNumber, setOrgNumber] = useState(dealership?.orgNumber || '');
  const [address, setAddress] = useState(dealership?.address || '');
  const [postalCode, setPostalCode] = useState(dealership?.postalCode || '');
  const [city, setCity] = useState(
    initialCapabilities?.location?.city || dealership?.city || '',
  );

  const [selectedMakes, setSelectedMakes] = useState<string[]>(
    initialCapabilities?.makes || [],
  );
  const [models, setModels] = useState(
    initialCapabilities?.models?.join(', ') || '',
  );
  const [minYear, setMinYear] = useState(initialCapabilities?.minYear || 1990);
  const [maxYear, setMaxYear] = useState(
    initialCapabilities?.maxYear || new Date().getFullYear() + 1,
  );
  const [maxKm, setMaxKm] = useState(initialCapabilities?.maxKm || 500000);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(
    initialCapabilities?.fuelTypes || [],
  );
  const [selectedGearboxTypes, setSelectedGearboxTypes] = useState<string[]>(
    initialCapabilities?.gearboxTypes || [],
  );
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(
    initialCapabilities?.bodyTypes || [],
  );
  const [maxPrice, setMaxPrice] = useState(
    initialCapabilities?.maxPrice || 10000000,
  );
  const [serviceRadius, setServiceRadius] = useState(
    initialCapabilities?.serviceRadius || 100,
  );
  const [coordinates, setCoordinates] = useState({
    lat: initialCapabilities?.location?.lat || 59.9139,
    lng: initialCapabilities?.location?.lng || 10.7522,
  });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    setStatus({ type: 'info', message: 'Søker etter adresser...' });
    try {
      const response = await fetch(
        `/api/address-suggestions?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        if (response.status === 429) {
          throw new Error(
            'Rate limit overskredet. Vennligst vent litt og prøv igjen.',
          );
        }
        throw new Error(`API feil: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setAddressSuggestions(data);
      setStatus(null);
    } catch (error) {
      console.error('Failed to fetch suggestions', error);
      setAddressSuggestions([]);
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Kunne ikke søke etter adresser.',
      });
    }
  };

  const debouncedFetchSuggestions = (query: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => {
      fetchAddressSuggestions(query);
    }, 800); // Increased to 800ms for better rate limiting
    setDebounceTimer(timer);
  };

  const selectAddressSuggestion = (suggestion: any) => {
    // Use the structured data from the API response
    const address = suggestion.street
      ? `${suggestion.street} ${suggestion.number}`.trim()
      : suggestion.display_name.split(',')[0];
    const postalCode = suggestion.postalCode || '';
    const city = suggestion.city || '';

    setAddress(address);
    setPostalCode(postalCode);
    setCity(city);
    setCoordinates({
      lat: parseFloat(suggestion.lat) || 59.9139,
      lng: parseFloat(suggestion.lon) || 10.7522,
    });
    setAddressSuggestions([]);
    setStatus({
      type: 'success',
      message: `Valgt: ${suggestion.display_name}`,
    });
  };

  useEffect(() => {
    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const toggleSelection = (
    value: string,
    list: string[],
    setter: (items: string[]) => void,
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const result = await dealerOnboardingAction({
        dealershipId: dealership?.id,
        name,
        orgNumber,
        address,
        postalCode,
        city,
        makes: selectedMakes,
        models: models
          .split(',')
          .map((model) => model.trim())
          .filter(Boolean),
        minYear,
        maxYear,
        maxKm,
        fuelTypes: selectedFuelTypes,
        gearboxTypes: selectedGearboxTypes,
        bodyTypes: selectedBodyTypes,
        maxPrice,
        serviceRadius,
        location: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          city: city || 'Unknown',
        },
      });

      if (result.success) {
        router.push('/dealer');
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Noe gikk galt.',
        });
      }
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: 'Kunne ikke lagre onboarding. Vennligst prøv igjen.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-8'>
      {/* Dealership Information Card */}
      <Card className='bg-white border-stone-200 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-stone-100 rounded-lg'>
              <Building2 className='w-5 h-5 text-stone-600' />
            </div>
            <div>
              <CardTitle className='font-serif text-xl'>
                Forhandlerinformasjon
              </CardTitle>
              <CardDescription>
                Grunnleggende opplysninger om din forhandler
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Forhandlernavn</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Nordic Premium Cars'
                required
                className='bg-white'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='orgNumber'>Organisasjonsnummer</Label>
              <Input
                id='orgNumber'
                value={orgNumber}
                onChange={(e) => setOrgNumber(e.target.value)}
                placeholder='987 654 321'
                required
                className='bg-white'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='address'>Adresse</Label>
            <div className='relative'>
              <Input
                id='address'
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  debouncedFetchSuggestions(e.target.value);
                }}
                placeholder='Storgata 1'
                required
                className='bg-white'
              />
              {addressSuggestions.length > 0 && (
                <ul className='absolute z-10 w-full bg-white border border-stone-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1'>
                  {addressSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className='px-4 py-2 hover:bg-stone-100 cursor-pointer text-sm'
                      onClick={() => selectAddressSuggestion(suggestion)}
                    >
                      {suggestion.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='postalCode'>Postnummer</Label>
              <Input
                id='postalCode'
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder='0001'
                required
                className='bg-white'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='city'>By</Label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-2.5 w-4 h-4 text-stone-400' />
                <Input
                  id='city'
                  value={city}
                  readOnly
                  className='bg-stone-50 pl-9'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasExistingCapabilities && (
        <div className='rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-800 flex items-start gap-3'>
          <Check className='w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5' />
          <p>
            Tidligere lagrede forhandlerkapasiteter ble lastet inn. Oppdater
            eventuelle felt og klikk &quot;Oppdater onboarding&quot; for å
            beholde dine nåværende innstillinger.
          </p>
        </div>
      )}

      {/* Car Makes Card */}
      <Card className='bg-white border-stone-200 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-emerald-100 rounded-lg'>
              <Car className='w-5 h-5 text-emerald-700' />
            </div>
            <div>
              <CardTitle className='font-serif text-xl'>Bilmerker</CardTitle>
              <CardDescription>
                Velg alle bilmerkene du jobber med
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
            {CAR_MAKES.map((make) => {
              const isSelected = selectedMakes.includes(make);
              return (
                <button
                  key={make}
                  type='button'
                  onClick={() =>
                    toggleSelection(make, selectedMakes, setSelectedMakes)
                  }
                  className={cn(
                    'relative flex items-center justify-center px-4 py-4 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-[1.02]',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-stone-50',
                  )}
                >
                  {isSelected && (
                    <div className='absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center'>
                      <Check className='w-3 h-3 text-white' />
                    </div>
                  )}
                  <span className='text-sm'>{make}</span>
                </button>
              );
            })}
          </div>
          <div className='space-y-2 mt-6 pt-6 border-t border-stone-100'>
            <Label htmlFor='models'>Spesifikke modeller (valgfritt)</Label>
            <Input
              id='models'
              value={models}
              onChange={(e) => setModels(e.target.value)}
              placeholder='Corolla, Golf, 3 Series (kommaseparert)'
              className='bg-white'
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Specifications Card */}
      <Card className='bg-white border-stone-200 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Settings className='w-5 h-5 text-blue-700' />
            </div>
            <div>
              <CardTitle className='font-serif text-xl'>
                Kjøretøysspesifikasjoner
              </CardTitle>
              <CardDescription>
                Definer typene kjøretøy du håndterer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-8'>
          {/* Year Range */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='minYear'>Minimum år</Label>
              <Input
                id='minYear'
                type='number'
                value={minYear}
                onChange={(e) => setMinYear(Number(e.target.value))}
                className='bg-white'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='maxYear'>Maksimum år</Label>
              <Input
                id='maxYear'
                type='number'
                value={maxYear}
                onChange={(e) => setMaxYear(Number(e.target.value))}
                className='bg-white'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='maxKm'>Maksimum kjørelengde (km)</Label>
            <Input
              id='maxKm'
              type='number'
              value={maxKm}
              onChange={(e) => setMaxKm(Number(e.target.value))}
              className='bg-white'
            />
          </div>

          {/* Fuel Types */}
          <div className='space-y-3'>
            <Label>Drivstofftyper</Label>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              {FUEL_TYPES.map((type) => {
                const isSelected = selectedFuelTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type='button'
                    onClick={() =>
                      toggleSelection(
                        type.value,
                        selectedFuelTypes,
                        setSelectedFuelTypes,
                      )
                    }
                    className={cn(
                      'relative flex flex-col items-center justify-center px-4 py-5 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-[1.02]',
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-stone-50',
                    )}
                  >
                    {isSelected && (
                      <div className='absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    <type.icon
                      className={cn(
                        'w-6 h-6 mb-2',
                        isSelected ? 'text-emerald-600' : 'text-stone-400',
                      )}
                    />
                    <span className='text-sm'>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gearbox Types */}
          <div className='space-y-3'>
            <Label>Girkassetype</Label>
            <div className='grid grid-cols-2 gap-3'>
              {GEARBOX_TYPES.map((type) => {
                const isSelected = selectedGearboxTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type='button'
                    onClick={() =>
                      toggleSelection(
                        type.value,
                        selectedGearboxTypes,
                        setSelectedGearboxTypes,
                      )
                    }
                    className={cn(
                      'relative flex flex-col items-center justify-center px-4 py-5 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-[1.02]',
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-stone-50',
                    )}
                  >
                    {isSelected && (
                      <div className='absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    <type.icon
                      className={cn(
                        'w-6 h-6 mb-2',
                        isSelected ? 'text-emerald-600' : 'text-stone-400',
                      )}
                    />
                    <span className='text-sm'>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Types */}
          <div className='space-y-3'>
            <Label>Karosserityper</Label>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              {BODY_TYPES.map((type) => {
                const isSelected = selectedBodyTypes.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type='button'
                    onClick={() =>
                      toggleSelection(
                        type.value,
                        selectedBodyTypes,
                        setSelectedBodyTypes,
                      )
                    }
                    className={cn(
                      'relative flex flex-col items-center justify-center px-4 py-5 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-[1.02]',
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-stone-50',
                    )}
                  >
                    {isSelected && (
                      <div className='absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    <type.icon
                      className={cn(
                        'w-6 h-6 mb-2',
                        isSelected ? 'text-emerald-600' : 'text-stone-400',
                      )}
                    />
                    <span className='text-sm capitalize'>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Area Card */}
      <Card className='bg-white border-stone-200 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-amber-100 rounded-lg'>
              <Target className='w-5 h-5 text-amber-700' />
            </div>
            <div>
              <CardTitle className='font-serif text-xl'>
                Tjenesteområde og prising
              </CardTitle>
              <CardDescription>
                Definer ditt tjenesteområde og prisgrenser
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='maxPrice'>Maksimum pris (NOK)</Label>
              <div className='relative'>
                <CreditCard className='absolute left-3 top-2.5 w-4 h-4 text-stone-400' />
                <Input
                  id='maxPrice'
                  type='number'
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className='bg-white pl-9'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='serviceRadius'>Tjenesteradius (km)</Label>
              <div className='relative'>
                <Target className='absolute left-3 top-2.5 w-4 h-4 text-stone-400' />
                <Input
                  id='serviceRadius'
                  type='number'
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(Number(e.target.value))}
                  className='bg-white pl-9'
                />
              </div>
            </div>
          </div>

          <input type='hidden' name='lat' value={coordinates.lat} />
          <input type='hidden' name='lng' value={coordinates.lng} />
        </CardContent>
      </Card>

      {/* Status Message */}
      {status && (
        <div
          className={cn(
            'rounded-xl border px-5 py-4 text-sm flex items-start gap-3',
            status.type === 'success' &&
              'border-emerald-200 bg-emerald-50/50 text-emerald-700',
            status.type === 'error' &&
              'border-red-200 bg-red-50/50 text-red-700',
            status.type === 'info' &&
              'border-stone-200 bg-stone-50 text-stone-700',
          )}
        >
          {status.type === 'success' && (
            <Check className='w-5 h-5 text-emerald-600 flex-shrink-0' />
          )}
          {status.message}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type='submit'
        disabled={loading}
        className='w-full bg-emerald-900 hover:bg-emerald-800 text-white py-6 text-base font-medium shadow-sm'
      >
        {loading
          ? 'Lagrer...'
          : dealership
            ? 'Oppdater onboarding'
            : 'Fullfør onboarding'}
      </Button>
    </form>
  );
}
