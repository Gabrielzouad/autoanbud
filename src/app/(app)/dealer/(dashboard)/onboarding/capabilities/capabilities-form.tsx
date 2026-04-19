// src/app/(app)/dealer/onboarding/capabilities/capabilities-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface DealerCapabilitiesFormProps {
  dealershipId: string;
  initialCapabilities?: any;
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
  const [geocodingStatus, setGeocodingStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Geocoding function using Nominatim (OpenStreetMap)
  const geocodeAddress = async (fullAddress: string) => {
    if (!fullAddress.trim()) {
      setGeocodingStatus(null);
      return;
    }

    try {
      setGeocodingStatus({ type: 'success', message: 'Searching...' });

      // Add Norway to the search for better results
      const searchQuery = `${fullAddress}, Norway`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=no`,
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const city =
          result.address?.city ||
          result.address?.town ||
          result.address?.village ||
          '';

        setCoordinates({ lat, lng });
        setCity(city);
        setGeocodingStatus({
          type: 'success',
          message: `Found: ${result.display_name.split(',')[0]}`,
        });
      } else {
        setGeocodingStatus({
          type: 'error',
          message:
            'Address not found. Please check spelling or enter coordinates manually.',
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingStatus({
        type: 'error',
        message: 'Failed to geocode address. Please try again.',
      });
    }
  };

  // Handle address/postal code changes with debouncing
  const handleAddressChange = (() => {
    let timeoutId: NodeJS.Timeout;
    return (newAddress: string, newPostalCode: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const fullAddress = `${newAddress} ${newPostalCode}`.trim();
        if (fullAddress.length > 5) {
          // Only geocode if we have meaningful input
          geocodeAddress(fullAddress);
        } else {
          setGeocodingStatus(null);
        }
      }, 1000); // 1 second debounce
    };
  })();

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
                className={`text-sm ${geocodingStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
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
