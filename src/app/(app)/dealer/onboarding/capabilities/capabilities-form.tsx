// src/app/(app)/dealer/onboarding/capabilities/capabilities-form.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AddressSuggestion,
  formatAddressSuggestionAddress,
  readAddressSuggestions,
} from '@/lib/addressSuggestions';
import {
  createDealerCapability,
  updateDealerCapability,
} from '../../../../actions/dealerCapabilities';

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

const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'ev'];
const GEARBOX_TYPES = ['automatic', 'manual'];
const BODY_TYPES = [
  'sedan',
  'suv',
  'wagon',
  'hatchback',
  'coupe',
  'convertible',
];

type DealerCapabilityFormData = {
  makes?: string[];
  fuelTypes?: string[];
  gearboxTypes?: string[];
  bodyTypes?: string[];
  minYear?: number;
  maxYear?: number;
  maxKm?: number;
  maxPrice?: number;
  serviceRadius?: number;
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
  } | null;
};

interface DealerCapabilitiesFormProps {
  dealershipId: string;
  initialCapabilities?: DealerCapabilityFormData | null;
}

export function DealerCapabilitiesForm({
  dealershipId,
  initialCapabilities,
}: DealerCapabilitiesFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMakes, setSelectedMakes] = useState<string[]>(
    initialCapabilities?.makes || [],
  );
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(
    initialCapabilities?.fuelTypes || [],
  );
  const [selectedGearboxTypes, setSelectedGearboxTypes] = useState<string[]>(
    initialCapabilities?.gearboxTypes || [],
  );
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(
    initialCapabilities?.bodyTypes || [],
  );

  // Address geocoding state
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState(initialCapabilities?.location?.city || '');
  const [coordinates, setCoordinates] = useState({
    lat: initialCapabilities?.location?.lat || 59.9139,
    lng: initialCapabilities?.location?.lng || 10.7522,
  });
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [geocodingStatus, setGeocodingStatus] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);
  const addressLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const applySuggestionMetadata = (suggestion: AddressSuggestion) => {
    setCity(suggestion.city);

    if (suggestion.lat !== null && suggestion.lng !== null) {
      setCoordinates({
        lat: suggestion.lat,
        lng: suggestion.lng,
      });
    }
  };

  const selectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(formatAddressSuggestionAddress(suggestion));
    setPostalCode(suggestion.postalCode);
    applySuggestionMetadata(suggestion);
    setAddressSuggestions([]);
    setGeocodingStatus({
      type: 'success',
      message: `Valgt: ${suggestion.display_name}`,
    });
  };

  const fetchAddressSuggestions = async (
    newAddress: string,
    newPostalCode: string,
  ) => {
    const fullAddress = `${newAddress} ${newPostalCode}`.trim();
    if (fullAddress.length < 3) {
      setAddressSuggestions([]);
      setGeocodingStatus(null);
      return;
    }

    try {
      setGeocodingStatus({ type: 'info', message: 'Søker etter adresse...' });

      const searchParams = new URLSearchParams({
        address: newAddress,
        postalCode: newPostalCode,
      });
      const response = await fetch(`/api/address-suggestions?${searchParams}`);

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'For mange adressesøk. Vent litt og prøv igjen.'
            : 'Kunne ikke hente adresseforslag.',
        );
      }

      const data: unknown = await response.json();
      const suggestions = readAddressSuggestions(data);
      setAddressSuggestions(suggestions);

      const bestSuggestion = suggestions[0];
      if (bestSuggestion) {
        applySuggestionMetadata(bestSuggestion);
        setGeocodingStatus({
          type: 'success',
          message: `Fant: ${bestSuggestion.display_name}`,
        });
      } else {
        setGeocodingStatus({
          type: 'error',
          message: 'Fant ingen adresse. Sjekk adresse eller postnummer.',
        });
      }
    } catch (error) {
      console.error('Address lookup error:', error);
      setAddressSuggestions([]);
      setGeocodingStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Kunne ikke hente adresse. Prøv igjen.',
      });
    }
  };

  const handleAddressChange = (newAddress: string, newPostalCode: string) => {
    if (addressLookupTimerRef.current) {
      clearTimeout(addressLookupTimerRef.current);
    }

    const fullAddress = `${newAddress} ${newPostalCode}`.trim();
    if (fullAddress.length < 3) {
      setAddressSuggestions([]);
      setGeocodingStatus(null);
      return;
    }

    addressLookupTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(newAddress.trim(), newPostalCode.trim());
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (addressLookupTimerRef.current) {
        clearTimeout(addressLookupTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const data = {
        dealershipId,
        makes: selectedMakes,
        models: [], // Could be expanded later
        minYear: parseInt(formData.get('minYear') as string) || 1990,
        maxYear:
          parseInt(formData.get('maxYear') as string) ||
          new Date().getFullYear() + 1,
        maxKm: parseInt(formData.get('maxKm') as string) || 500000,
        fuelTypes: selectedFuelTypes,
        gearboxTypes: selectedGearboxTypes,
        bodyTypes: selectedBodyTypes,
        maxPrice: parseInt(formData.get('maxPrice') as string) || 10000000,
        serviceRadius: parseInt(formData.get('serviceRadius') as string) || 100,
        location: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          city: city || 'Unknown',
        },
      };

      if (initialCapabilities) {
        await updateDealerCapability(dealershipId, data);
      } else {
        await createDealerCapability(data);
      }

      router.push('/dealer');
    } catch (error) {
      console.error('Failed to save capabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Car Inventory</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Car Makes You Offer</Label>
            <div className='grid grid-cols-2 gap-2 mt-2'>
              {CAR_MAKES.map((make) => (
                <div key={make} className='flex items-center space-x-2'>
                  <Checkbox
                    id={make}
                    checked={selectedMakes.includes(make)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMakes([...selectedMakes, make]);
                      } else {
                        setSelectedMakes(
                          selectedMakes.filter((m) => m !== make),
                        );
                      }
                    }}
                  />
                  <Label htmlFor={make}>{make}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='minYear'>Minimum Year</Label>
              <Input
                id='minYear'
                name='minYear'
                type='number'
                defaultValue={initialCapabilities?.minYear || 1990}
              />
            </div>
            <div>
              <Label htmlFor='maxYear'>Maximum Year</Label>
              <Input
                id='maxYear'
                name='maxYear'
                type='number'
                defaultValue={
                  initialCapabilities?.maxYear || new Date().getFullYear() + 1
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor='maxKm'>Maximum Mileage (km)</Label>
            <Input
              id='maxKm'
              name='maxKm'
              type='number'
              defaultValue={initialCapabilities?.maxKm || 500000}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Fuel Types</Label>
            <div className='flex gap-4 mt-2'>
              {FUEL_TYPES.map((type) => (
                <div key={type} className='flex items-center space-x-2'>
                  <Checkbox
                    id={type}
                    checked={selectedFuelTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFuelTypes([...selectedFuelTypes, type]);
                      } else {
                        setSelectedFuelTypes(
                          selectedFuelTypes.filter((t) => t !== type),
                        );
                      }
                    }}
                  />
                  <Label htmlFor={type}>{type.toUpperCase()}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Transmission Types</Label>
            <div className='flex gap-4 mt-2'>
              {GEARBOX_TYPES.map((type) => (
                <div key={type} className='flex items-center space-x-2'>
                  <Checkbox
                    id={type}
                    checked={selectedGearboxTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedGearboxTypes([
                          ...selectedGearboxTypes,
                          type,
                        ]);
                      } else {
                        setSelectedGearboxTypes(
                          selectedGearboxTypes.filter((t) => t !== type),
                        );
                      }
                    }}
                  />
                  <Label htmlFor={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Body Types</Label>
            <div className='grid grid-cols-2 gap-2 mt-2'>
              {BODY_TYPES.map((type) => (
                <div key={type} className='flex items-center space-x-2'>
                  <Checkbox
                    id={type}
                    checked={selectedBodyTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBodyTypes([...selectedBodyTypes, type]);
                      } else {
                        setSelectedBodyTypes(
                          selectedBodyTypes.filter((t) => t !== type),
                        );
                      }
                    }}
                  />
                  <Label htmlFor={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='maxPrice'>Maximum Price (NOK)</Label>
            <Input
              id='maxPrice'
              name='maxPrice'
              type='number'
              defaultValue={initialCapabilities?.maxPrice || 10000000}
            />
          </div>

          <div>
            <Label htmlFor='serviceRadius'>Service Radius (km)</Label>
            <Input
              id='serviceRadius'
              name='serviceRadius'
              type='number'
              defaultValue={initialCapabilities?.serviceRadius || 100}
            />
          </div>

          <div className='space-y-4'>
            <div>
              <Label htmlFor='address'>Address</Label>
              <div className='relative'>
                <Input
                  id='address'
                  name='address'
                  placeholder='Storgata 1'
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    handleAddressChange(e.target.value, postalCode);
                  }}
                />
                {addressSuggestions.length > 0 && (
                  <ul className='absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-stone-200 bg-white shadow-lg'>
                    {addressSuggestions.map((suggestion) => (
                      <li
                        key={`${suggestion.display_name}-${suggestion.lat ?? ''}-${suggestion.lng ?? ''}`}
                        className='cursor-pointer px-4 py-2 text-sm hover:bg-stone-100'
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
              <div>
                <Label htmlFor='postalCode'>Postal Code</Label>
                <Input
                  id='postalCode'
                  name='postalCode'
                  placeholder='0001'
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    handleAddressChange(address, e.target.value);
                  }}
                />
              </div>
              <div>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  name='city'
                  value={city}
                  readOnly
                  className='bg-stone-50'
                />
              </div>
            </div>

            {geocodingStatus && (
              <div
                className={`text-sm ${
                  geocodingStatus.type === 'error'
                    ? 'text-red-600'
                    : geocodingStatus.type === 'success'
                      ? 'text-green-600'
                      : 'text-stone-500'
                }`}
              >
                {geocodingStatus.message}
              </div>
            )}
          </div>

          {/* Hidden fields for coordinates */}
          <input type='hidden' name='lat' value={coordinates.lat} />
          <input type='hidden' name='lng' value={coordinates.lng} />
        </CardContent>
      </Card>

      <Button type='submit' disabled={loading} className='w-full'>
        {loading ? 'Saving...' : 'Save Capabilities'}
      </Button>
    </form>
  );
}
