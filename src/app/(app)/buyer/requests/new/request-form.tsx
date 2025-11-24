// src/app/(app)/buyer/requests/new/request-form.tsx
'use client';

import * as React from 'react';
import {
  X,
  Car,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createBuyerRequestSchema } from '@/lib/validation/buyerRequest';

type RequestFormProps = {
  action: (formData: FormData) => void;
};

type UploadedImage = {
  id: string;
  name: string;
  previewUrl: string;
  url?: string;
  status: 'uploading' | 'ready' | 'error';
  error?: string;
};

export function RequestForm({ action }: RequestFormProps) {
  const [step, setStep] = React.useState(1);
  const [searchType, setSearchType] = React.useState<
    'specific' | 'general' | null
  >(null);
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const formRef = React.useRef<HTMLFormElement>(null);

  const [formData, setFormData] = React.useState({
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
    hasTradeIn: false,
    needsFinancing: false,
    tradeInReg: '',
    tradeInKm: '',
    tradeInNotes: '',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 2 && !validateStepTwo()) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const readyImageUrls = React.useMemo(
    () =>
      images
        .filter((img) => img.status === 'ready' && img.url)
        .map((img) => img.url as string),
    [images]
  );

  const isUploading = images.some((img) => img.status === 'uploading');

  const uploadFile = React.useCallback(async (file: File, id: string) => {
    const requestData = new FormData();
    requestData.append('file', file);

    try {
      const response = await fetch('/api/uploads/request-images', {
        method: 'POST',
        body: requestData,
      });

      const parsed = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(parsed?.error ?? 'Opplasting feilet');
      }

      const uploadUrl = parsed?.uploads?.[0]?.url as string | undefined;
      if (!uploadUrl) {
        throw new Error('Mangler URL fra opplasting');
      }

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, url: uploadUrl, status: 'ready' } : img
        )
      );
      setUploadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ukjent feil ved opplasting';
      setUploadError(message);
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, status: 'error', error: message } : img
        )
      );
    }
  }, []);

  const stageFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;

    Array.from(fileList).forEach((file) => {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      setImages((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          previewUrl,
          status: 'uploading',
        },
      ]);

      uploadFile(file, id);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    stageFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const img = prev[index];
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Drag and drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    stageFiles(e.dataTransfer.files);
  };

  const steps = [
    { number: 1, title: 'Søketype' },
    { number: 2, title: 'Bildetaljer' },
    { number: 3, title: 'Bilder' },
    { number: 4, title: 'Fullfør' },
  ];

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
    bodyType: formData.bodyType,
    fuelType: formData.fuel.toLowerCase(),
    maxKm: formData.mileage,
    budgetMax: formData.budget,
    locationCity: formData.locationCity,
    wantsTradeIn: formData.hasTradeIn ? 'on' : '',
    financingNeeded: formData.needsFinancing ? 'on' : '',
    description: formData.description,
    imageUrls: JSON.stringify(readyImageUrls),
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLElement | null;
    const isFinalSubmit = submitter?.dataset.finalSubmit === 'true';

    if (!isFinalSubmit) {
      event.preventDefault();
      if (step < 4) handleNext();
      return;
    }

    // Final-step client validation
    if (!validateStepTwo()) {
      event.preventDefault();
      return;
    }

    if (isUploading) {
      event.preventDefault();
      setUploadError('Vent til opplasting er ferdig før du sender inn.');
      return;
    }

    // Final validation with Zod
    const payload = buildPayload();
    const parsed = createBuyerRequestSchema.safeParse(payload);
    if (!parsed.success) {
      event.preventDefault();
      const flat = parsed.error.flatten().fieldErrors;
      const firstErrors: Record<string, string> = {};
      Object.entries(flat).forEach(([key, val]) => {
        if (val && val.length) firstErrors[key] = val[0];
      });
      setErrors(firstErrors);
    }
  };

  return (
    <form
      ref={formRef}
      className='max-w-3xl mx-auto space-y-10'
      onSubmit={handleSubmit}
    >
      <input
        type='hidden'
        name='imageUrls'
        value={JSON.stringify(readyImageUrls)}
      />
      <input type='hidden' name='searchType' value={searchType ?? ''} />

      {/* Mapped fields to schema */}
      <input
        type='hidden'
        name='title'
        value={
          formData.title ||
          `${formData.make} ${formData.model}` ||
          'Forespørsel'
        }
      />
      <input type='hidden' name='make' value={formData.make} />
      <input type='hidden' name='model' value={formData.model} />
      <input type='hidden' name='generation' value={formData.trim} />
      <input type='hidden' name='yearFrom' value={formData.yearFrom} />
      <input type='hidden' name='yearTo' value={formData.yearTo} />
      <input type='hidden' name='bodyType' value={formData.bodyType} />
      <input
        type='hidden'
        name='fuelType'
        value={formData.fuel.toLowerCase()}
      />
      <input type='hidden' name='maxKm' value={formData.mileage} />
      <input type='hidden' name='budgetMax' value={formData.budget} />
      <input type='hidden' name='locationCity' value={formData.locationCity} />
      <input
        type='hidden'
        name='wantsTradeIn'
        value={formData.hasTradeIn ? 'on' : ''}
      />
      <input
        type='hidden'
        name='financingNeeded'
        value={formData.needsFinancing ? 'on' : ''}
      />
      <input type='hidden' name='tradeInReg' value={formData.tradeInReg} />
      <input type='hidden' name='tradeInKm' value={formData.tradeInKm} />
      <input type='hidden' name='tradeInNotes' value={formData.tradeInNotes} />
      <input type='hidden' name='description' value={formData.description} />

      {/* Progress Steps */}
      <div className='mb-6'>
        <div className='flex items-center justify-between relative z-10'>
          {steps.map((s) => {
            const isActive = s.number === step;
            const isCompleted = s.number < step;
            return (
              <div key={s.number} className='flex flex-col items-center gap-2'>
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white',
                    isActive
                      ? 'border-emerald-600 text-emerald-600 font-bold scale-110 shadow-emerald-100 shadow-lg'
                      : isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-stone-200 text-stone-400'
                  )}
                >
                  {isCompleted ? <Check className='w-5 h-5' /> : s.number}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    isActive
                      ? 'text-emerald-900'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-stone-400'
                  )}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className='min-h-[400px]'>
        {/* STEP 1: Søketype */}
        {step === 1 && (
          <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
            <div className='text-center space-y-2'>
              <h2 className='text-2xl font-serif font-semibold text-stone-900'>
                Hva leter du etter?
              </h2>
              <p className='text-stone-500'>
                Velg hvordan du vil starte søket.
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-4 mt-8'>
              <button
                type='button'
                onClick={() => {
                  setSearchType('specific');
                  handleNext();
                }}
                className={cn(
                  'flex flex-col items-center p-8 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]',
                  searchType === 'specific'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
                    : 'border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm'
                )}
              >
                <div className='p-4 bg-emerald-100 text-emerald-700 rounded-full mb-4'>
                  <Car className='w-8 h-8' />
                </div>
                <h3 className='font-serif font-medium text-lg text-stone-900'>
                  Spesifikk modell
                </h3>
                <p className='text-sm text-stone-500 text-center mt-2'>
                  Jeg vet hvilken bil jeg vil ha (f.eks. Volvo XC90)
                </p>
              </button>

              <button
                type='button'
                onClick={() => {
                  setSearchType('general');
                  handleNext();
                }}
                className={cn(
                  'flex flex-col items-center p-8 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]',
                  searchType === 'general'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
                    : 'border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm'
                )}
              >
                <div className='p-4 bg-blue-100 text-blue-700 rounded-full mb-4'>
                  <Search className='w-8 h-8' />
                </div>
                <h3 className='font-serif font-medium text-lg text-stone-900'>
                  Generelt søk
                </h3>
                <p className='text-sm text-stone-500 text-center mt-2'>
                  Jeg er åpen for forslag (f.eks. &quot;Elektrisk SUV under
                  600k&quot;)
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Detaljer */}
        {step === 2 && (
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
                  {errors.title && (
                    <p className='text-sm text-red-600'>{errors.title}</p>
                  )}
                </div>

                {searchType === 'specific' ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='make'>Merke</Label>
                      <Input
                        id='make'
                        value={formData.make}
                        onChange={(e) => updateFormData('make', e.target.value)}
                        placeholder='f.eks. Volvo'
                        required
                      />
                      {errors.make && (
                        <p className='text-sm text-red-600'>{errors.make}</p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='model'>Modell</Label>
                      <Input
                        id='model'
                        value={formData.model}
                        onChange={(e) =>
                          updateFormData('model', e.target.value)
                        }
                        placeholder='f.eks. XC90'
                        required
                      />
                      {errors.model && (
                        <p className='text-sm text-red-600'>{errors.model}</p>
                      )}
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
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <Label htmlFor='body-type'>Karosseri</Label>
                      <Input
                        id='body-type'
                        value={formData.bodyType}
                        onChange={(e) =>
                          updateFormData('bodyType', e.target.value)
                        }
                        placeholder='f.eks. SUV'
                        autoFocus
                      />
                      {errors.bodyType && (
                        <p className='text-sm text-red-600'>
                          {errors.bodyType}
                        </p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='fuel'>Drivlinje</Label>
                      <Input
                        id='fuel'
                        value={formData.fuel}
                        onChange={(e) => updateFormData('fuel', e.target.value)}
                        placeholder='f.eks. Elektrisk'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='seats'>Min. seter</Label>
                      <Input
                        id='seats'
                        type='number'
                        value={formData.seats}
                        onChange={(e) =>
                          updateFormData('seats', e.target.value)
                        }
                        placeholder='f.eks. 5'
                      />
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100'>
                  <div className='space-y-2'>
                    <Label htmlFor='budget'>Maks budsjett (NOK)</Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-2.5 text-stone-500'>
                        kr
                      </span>
                      <Input
                        id='budget'
                        className='pl-8'
                        value={formData.budget}
                        onChange={(e) =>
                          updateFormData('budget', e.target.value)
                        }
                        placeholder='f.eks. 650 000'
                        type='number'
                        required
                      />
                      {errors.budget && (
                        <p className='text-sm text-red-600'>{errors.budget}</p>
                      )}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='mileage'>Maks kilometerstand (km)</Label>
                    <Input
                      id='mileage'
                      value={formData.mileage}
                      onChange={(e) =>
                        updateFormData('mileage', e.target.value)
                      }
                      placeholder='f.eks. 100 000'
                      type='number'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='location'>Sted / område</Label>
                    <Input
                      id='location'
                      value={formData.locationCity}
                      onChange={(e) =>
                        updateFormData('locationCity', e.target.value)
                      }
                      placeholder='f.eks. Oslo, Viken'
                      required
                    />
                    {errors.locationCity && (
                      <p className='text-sm text-red-600'>
                        {errors.locationCity}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='year-from'>Årsmodell (fra / til)</Label>
                    <div className='flex items-center gap-2'>
                      <Input
                        id='year-from'
                        placeholder='Fra'
                        type='number'
                        value={formData.yearFrom}
                        onChange={(e) =>
                          updateFormData('yearFrom', e.target.value)
                        }
                      />
                      <span className='text-stone-400'>-</span>
                      <Input
                        id='year-to'
                        placeholder='Til'
                        type='number'
                        value={formData.yearTo}
                        onChange={(e) =>
                          updateFormData('yearTo', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>
                    Beskrivelse og preferanser
                  </Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData('description', e.target.value)
                    }
                    placeholder='Beskriv behovene dine... f.eks. Må ha hengerfeste, vinterhjul inkludert, foretrekker mørke farger.'
                    className='min-h-[120px]'
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Bilder */}
        {step === 3 && (
          <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
            <div className='text-center space-y-2 mb-8'>
              <h2 className='text-2xl font-serif font-semibold text-stone-900'>
                Referansebilder
              </h2>
              <p className='text-stone-500'>
                Hjelp forhandlere å forstå hva du liker.
              </p>
            </div>

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer',
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-stone-200 hover:border-emerald-400 hover:bg-stone-50/50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className='flex flex-col items-center gap-4'>
                <div className='p-4 bg-stone-100 rounded-full text-stone-500'>
                  <Upload className='w-8 h-8' />
                </div>
                <div className='space-y-1'>
                  <p className='text-lg font-medium text-stone-900'>
                    Slipp bilder her eller klikk for å laste opp
                  </p>
                  <p className='text-sm text-stone-500'>
                    JPG eller PNG (maks 5MB)
                  </p>
                </div>
                <Input
                  id='images'
                  type='file'
                  multiple
                  className='hidden'
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept='image/*'
                />
              </div>
            </div>

            {uploadError && (
              <p className='text-sm text-red-600'>{uploadError}</p>
            )}

            {images.length > 0 && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className='relative group aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-100'
                  >
                    <img
                      src={img.previewUrl || '/images/car-placeholder.avif'}
                      alt={`Preview ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className='absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Fullfør */}
        {step === 4 && (
          <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
            <div className='text-center space-y-2 mb-8'>
              <h2 className='text-2xl font-serif font-semibold text-stone-900'>
                Siste detaljer
              </h2>
              <p className='text-stone-500'>
                Nesten ferdig! Har du noe mer vi bør vite?
              </p>
            </div>

            <div className='grid gap-6'>
              <div
                className={cn(
                  'flex items-start space-x-4 p-6 rounded-xl border-2 transition-all cursor-pointer',
                  formData.needsFinancing
                    ? 'border-emerald-600 bg-emerald-50/30'
                    : 'border-stone-200 hover:border-emerald-200'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    formData.needsFinancing
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-500'
                  )}
                >
                  <CreditCard className='w-6 h-6' />
                </div>
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-medium cursor-pointer'>
                      Jeg trenger finansiering
                    </Label>
                    <Checkbox
                      checked={formData.needsFinancing}
                      onCheckedChange={(checked) => {
                        updateFormData('needsFinancing', Boolean(checked));
                      }}
                      className='data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600'
                    />
                  </div>
                  <p className='text-sm text-stone-500 pr-8'>
                    Få konkurransedyktige lånetilbud direkte fra forhandlere.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'flex items-start space-x-4 p-6 rounded-xl border-2 transition-all cursor-pointer',
                  formData.hasTradeIn
                    ? 'border-emerald-600 bg-emerald-50/30'
                    : 'border-stone-200 hover:border-emerald-200'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    formData.hasTradeIn
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-500'
                  )}
                >
                  <RefreshCw className='w-6 h-6' />
                </div>
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-medium cursor-pointer'>
                      Jeg har bil å bytte inn
                    </Label>
                    <Checkbox
                      checked={formData.hasTradeIn}
                      onCheckedChange={(checked) => {
                        updateFormData('hasTradeIn', Boolean(checked));
                      }}
                      className='data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600'
                    />
                  </div>
                  <p className='text-sm text-stone-500 pr-8'>
                    Forhandlere kan gi deg estimert innbytteverdi for bilen du
                    har.
                  </p>
                  {formData.hasTradeIn && (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3 pt-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='trade-reg'>Registreringsnummer</Label>
                        <Input
                          id='trade-reg'
                          value={formData.tradeInReg}
                          onChange={(e) =>
                            updateFormData('tradeInReg', e.target.value)
                          }
                          placeholder='f.eks. AB12345'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='trade-km'>Km-stand</Label>
                        <Input
                          id='trade-km'
                          type='number'
                          value={formData.tradeInKm}
                          onChange={(e) =>
                            updateFormData('tradeInKm', e.target.value)
                          }
                          placeholder='f.eks. 120000'
                        />
                      </div>
                      <div className='space-y-2 md:col-span-3'>
                        <Label htmlFor='trade-notes'>Skader / notater</Label>
                        <Textarea
                          id='trade-notes'
                          value={formData.tradeInNotes}
                          onChange={(e) =>
                            updateFormData('tradeInNotes', e.target.value)
                          }
                          placeholder='Beskriv kjente skader eller tilstand'
                          className='min-h-[80px]'
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='mt-8 p-4 bg-stone-50 rounded-lg border border-stone-200 text-sm text-stone-600'>
              <p>
                <span className='font-semibold text-stone-900'>
                  Oppsummering:{' '}
                </span>
                Du ser etter{' '}
                <span className='font-semibold text-emerald-700'>
                  {searchType === 'specific' ? formData.model || 'bil' : 'bil'}
                </span>{' '}
                {formData.budget && `rundt ${formData.budget} kr`}
                {formData.needsFinancing && ', med finansiering'}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className='flex items-center justify-between mt-6 pt-6 border-t border-stone-100'>
        {step > 1 ? (
          <Button
            type='button'
            variant='outline'
            onClick={handleBack}
            className='flex items-center gap-2 bg-transparent'
          >
            <ChevronLeft className='w-4 h-4' />
            Tilbake
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            type='button'
            onClick={handleNext}
            disabled={step === 1 && !searchType}
            className='bg-emerald-900 hover:bg-emerald-800 text-white flex items-center gap-2 min-w-[120px]'
          >
            Neste
            <ChevronRight className='w-4 h-4' />
          </Button>
        ) : (
          <Button
            type='submit'
            formAction={action}
            data-final-submit='true'
            disabled={isUploading}
            className='bg-emerald-900 hover:bg-emerald-800 text-white flex items-center gap-2 min-w-[120px]'
          >
            Send inn forespørsel
            <Check className='w-4 h-4' />
          </Button>
        )}
      </div>
    </form>
  );
}
