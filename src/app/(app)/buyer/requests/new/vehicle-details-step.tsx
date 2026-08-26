import { MapPin } from 'lucide-react';

import type { AddressSuggestion } from '@/lib/addressSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VEHICLE_MAKES } from '@/lib/vehicleCatalog';
import {
  BODY_TYPE_OPTIONS,
  FUEL_OPTIONS,
  type FormState,
} from './request-form-model';

type SearchType = 'specific' | 'general' | null;

type VehicleDetailsStepProps = {
  searchType: SearchType;
  formData: FormState;
  errors: Record<string, string>;
  updateFormData: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  makeSuggestions: string[];
  modelSuggestions: string[];
  modelDatalistOptions: string[];
  selectMake: (make: string) => void;
  handleMakeChange: (value: string) => void;
  selectModel: (model: string) => void;
  handleMakeBlur: () => void;
  handleModelBlur: () => void;
  locationSuggestions: AddressSuggestion[];
  locationStatus: string | null;
  isResolvingLocation: boolean;
  debouncedFetchLocationSuggestions: (query: string) => void;
  selectLocationSuggestion: (suggestion: AddressSuggestion) => void;
  useCurrentLocation: () => Promise<void>;
};

export function VehicleDetailsStep({
  searchType,
  formData,
  errors,
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
}: VehicleDetailsStepProps) {
  return (
    <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
      <div className='text-center space-y-2 mb-8'>
        <h2 className='text-2xl font-serif font-semibold text-stone-900'>
          {searchType === 'specific' ? 'Bildetaljer' : 'Preferanser'}
        </h2>
        <p className='text-stone-500'>
          Fortell oss mer om bilen du trenger.
        </p>
      </div>

      <Card className='border-stone-200 shadow-sm'>
        <CardContent className='p-6 space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Tittel</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              placeholder='Kort tittel, f.eks. Familie-SUV med 7 seter'
              required
            />
            {errors.title ? (
              <p className='text-sm text-red-600'>{errors.title}</p>
            ) : null}
          </div>

          {searchType === 'specific' ? (
            <SpecificVehicleFields
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
              makeSuggestions={makeSuggestions}
              modelSuggestions={modelSuggestions}
              modelDatalistOptions={modelDatalistOptions}
              selectMake={selectMake}
              handleMakeChange={handleMakeChange}
              selectModel={selectModel}
              handleMakeBlur={handleMakeBlur}
              handleModelBlur={handleModelBlur}
            />
          ) : (
            <OpenSearchFields
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
            />
          )}

          <CommonRequestFields
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            locationSuggestions={locationSuggestions}
            locationStatus={locationStatus}
            isResolvingLocation={isResolvingLocation}
            debouncedFetchLocationSuggestions={
              debouncedFetchLocationSuggestions
            }
            selectLocationSuggestion={selectLocationSuggestion}
            useCurrentLocation={useCurrentLocation}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SpecificVehicleFields({
  formData,
  errors,
  updateFormData,
  makeSuggestions,
  modelSuggestions,
  modelDatalistOptions,
  selectMake,
  handleMakeChange,
  selectModel,
  handleMakeBlur,
  handleModelBlur,
}: Pick<
  VehicleDetailsStepProps,
  | 'formData'
  | 'errors'
  | 'updateFormData'
  | 'makeSuggestions'
  | 'modelSuggestions'
  | 'modelDatalistOptions'
  | 'selectMake'
  | 'handleMakeChange'
  | 'selectModel'
  | 'handleMakeBlur'
  | 'handleModelBlur'
>) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='space-y-2'>
        <Label htmlFor='make'>Merke</Label>
        <Input
          id='make'
          value={formData.make}
          onChange={(e) => handleMakeChange(e.target.value)}
          onBlur={handleMakeBlur}
          list='vehicle-make-options'
          placeholder='f.eks. Volvo'
          required
        />
        <datalist id='vehicle-make-options'>
          {VEHICLE_MAKES.map((make) => (
            <option key={make} value={make} />
          ))}
        </datalist>
        {makeSuggestions.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {makeSuggestions.map((make) => (
              <Button
                key={make}
                type='button'
                variant='outline'
                size='sm'
                className='h-8 bg-white text-xs'
                onClick={() => selectMake(make)}
              >
                {make}
              </Button>
            ))}
          </div>
        ) : null}
        {errors.make ? (
          <p className='text-sm text-red-600'>{errors.make}</p>
        ) : null}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='model'>Modell</Label>
        <Input
          id='model'
          value={formData.model}
          onChange={(e) => updateFormData('model', e.target.value)}
          onBlur={handleModelBlur}
          list='vehicle-model-options'
          placeholder='f.eks. XC90'
          required
        />
        <datalist id='vehicle-model-options'>
          {modelDatalistOptions.map((model) => (
            <option key={model} value={model} />
          ))}
        </datalist>
        {(formData.make.trim() || formData.model.trim()) &&
        modelSuggestions.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {modelSuggestions.map((model) => (
              <Button
                key={model}
                type='button'
                variant='outline'
                size='sm'
                className='h-8 bg-white text-xs'
                onClick={() => selectModel(model)}
              >
                {model}
              </Button>
            ))}
          </div>
        ) : null}
        {errors.model ? (
          <p className='text-sm text-red-600'>{errors.model}</p>
        ) : null}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='trim'>Variant (valgfritt)</Label>
        <Input
          id='trim'
          value={formData.trim}
          onChange={(e) => updateFormData('trim', e.target.value)}
          placeholder='f.eks. Inscription'
        />
      </div>
    </div>
  );
}

function OpenSearchFields({
  formData,
  errors,
  updateFormData,
}: Pick<VehicleDetailsStepProps, 'formData' | 'errors' | 'updateFormData'>) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='space-y-2'>
        <Label htmlFor='body-type'>Karosseri</Label>
        <Input
          id='body-type'
          value={formData.bodyType}
          onChange={(e) => updateFormData('bodyType', e.target.value)}
          placeholder='f.eks. SUV'
          autoFocus
        />
        <div className='flex flex-wrap gap-2'>
          {BODY_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type='button'
              variant={formData.bodyType === option.value ? 'default' : 'outline'}
              size='sm'
              className='h-8 text-xs'
              onClick={() => updateFormData('bodyType', option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {errors.bodyType ? (
          <p className='text-sm text-red-600'>{errors.bodyType}</p>
        ) : null}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='fuel'>Drivlinje</Label>
        <Input
          id='fuel'
          value={formData.fuel}
          onChange={(e) => updateFormData('fuel', e.target.value)}
          placeholder='f.eks. Elektrisk'
        />
        <div className='flex flex-wrap gap-2'>
          {FUEL_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type='button'
              variant={formData.fuel === option.value ? 'default' : 'outline'}
              size='sm'
              className='h-8 text-xs'
              onClick={() => updateFormData('fuel', option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='seats'>Min. seter</Label>
        <Input
          id='seats'
          type='number'
          value={formData.seats}
          onChange={(e) => updateFormData('seats', e.target.value)}
          placeholder='f.eks. 5'
        />
      </div>
    </div>
  );
}

function CommonRequestFields({
  formData,
  errors,
  updateFormData,
  locationSuggestions,
  locationStatus,
  isResolvingLocation,
  debouncedFetchLocationSuggestions,
  selectLocationSuggestion,
  useCurrentLocation,
}: Pick<
  VehicleDetailsStepProps,
  | 'formData'
  | 'errors'
  | 'updateFormData'
  | 'locationSuggestions'
  | 'locationStatus'
  | 'isResolvingLocation'
  | 'debouncedFetchLocationSuggestions'
  | 'selectLocationSuggestion'
  | 'useCurrentLocation'
>) {
  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100'>
        <div className='space-y-2'>
          <Label htmlFor='budget'>Maks budsjett (NOK)</Label>
          <div className='relative'>
            <span className='absolute left-3 top-2.5 text-stone-500'>kr</span>
            <Input
              id='budget'
              className='pl-8'
              value={formData.budget}
              onChange={(e) => updateFormData('budget', e.target.value)}
              placeholder='f.eks. 650 000'
              type='number'
              required
            />
            {errors.budget ? (
              <p className='text-sm text-red-600'>{errors.budget}</p>
            ) : null}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='mileage'>Maks kilometerstand (km)</Label>
          <Input
            id='mileage'
            value={formData.mileage}
            onChange={(e) => updateFormData('mileage', e.target.value)}
            placeholder='f.eks. 100 000'
            type='number'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='location'>Sted / område</Label>
          <div className='relative'>
            <Input
              id='location'
              value={formData.locationCity}
              onChange={(e) => {
                updateFormData('locationCity', e.target.value);
                updateFormData('locationLat', '');
                updateFormData('locationLng', '');
                debouncedFetchLocationSuggestions(e.target.value);
              }}
              placeholder='f.eks. Oslo, Viken'
              required
              className='bg-white'
            />
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={useCurrentLocation}
              disabled={isResolvingLocation}
              className='mt-2 bg-white'
            >
              <MapPin className='mr-2 h-4 w-4' />
              {isResolvingLocation ? 'Henter posisjon...' : 'Bruk min posisjon'}
            </Button>
            {locationStatus ? (
              <p className='mt-2 text-sm text-stone-500'>{locationStatus}</p>
            ) : null}
            {locationSuggestions.length > 0 ? (
              <ul className='absolute z-10 w-full bg-white border border-stone-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1'>
                {locationSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className='px-4 py-2 hover:bg-stone-100 cursor-pointer text-sm'
                    onClick={() => selectLocationSuggestion(suggestion)}
                  >
                    {suggestion.display_name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {errors.locationCity ? (
            <p className='text-sm text-red-600'>{errors.locationCity}</p>
          ) : null}
        </div>

        <div className='space-y-2 md:col-span-2'>
          <Label htmlFor='year-from'>Årsmodell (fra / til)</Label>
          <div className='flex items-center gap-2'>
            <Input
              id='year-from'
              placeholder='Fra'
              type='number'
              value={formData.yearFrom}
              onChange={(e) => updateFormData('yearFrom', e.target.value)}
            />
            <span className='text-stone-400'>-</span>
            <Input
              id='year-to'
              placeholder='Til'
              type='number'
              value={formData.yearTo}
              onChange={(e) => updateFormData('yearTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Beskrivelse og preferanser</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder='Beskriv behovene dine... f.eks. Må ha hengerfeste, vinterhjul inkludert, foretrekker mørke farger.'
          className='min-h-[120px]'
        />
      </div>
    </>
  );
}
