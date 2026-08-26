// src/app/(app)/buyer/requests/new/request-form.tsx
'use client';

import * as React from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUploadGrid } from '@/components/ImageUploadGrid';
import { cn } from '@/lib/utils';
import { createBuyerRequestSchema } from '@/lib/validation/buyerRequest';
import type { CreateBuyerRequestActionState } from '@/app/actions/buyerRequests';
import {
  BUYER_REQUEST_DRAFT_STORAGE_KEY,
  BUYER_REQUEST_SUBMITTED_STORAGE_KEY,
} from '@/lib/buyerRequestDraft';
import {
  isRequestDraft,
  persistableImages,
  type RequestDraft,
  type RequestFormProps,
  type UploadedImage,
} from './request-form-model';
import {
  DraftRestoredBanner,
  ReferenceImagesStep,
  RequestFormNavigation,
  RequestFormProgress,
  SearchTypeStep,
} from './request-form-sections';
import { useBuyerRequestForm } from './use-buyer-request-form';
import { VehicleDetailsStep } from './vehicle-details-step';

const initialActionState: CreateBuyerRequestActionState = {
  success: false,
};

export function RequestForm({ action }: RequestFormProps) {
  const [actionState, formAction, isPending] = React.useActionState(
    action,
    initialActionState,
  );
  const [step, setStep] = React.useState(1);
  const [searchType, setSearchType] = React.useState<
    'specific' | 'general' | null
  >(null);
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [tradeInImages, setTradeInImages] = React.useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isTradeInDragging, setIsTradeInDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const tradeInFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [tradeInUploadError, setTradeInUploadError] = React.useState<
    string | null
  >(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const readyImageUrls = React.useMemo(
    () =>
      images
        .filter((img) => img.status === 'ready' && img.url)
        .map((img) => img.url as string),
    [images],
  );

  const readyTradeInImageUrls = React.useMemo(
    () =>
      tradeInImages
        .filter((img) => img.status === 'ready' && img.url)
        .map((img) => img.url as string),
    [tradeInImages],
  );

  const isUploading = [...images, ...tradeInImages].some(
    (img) => img.status === 'uploading',
  );
  const hasFailedUploads = [...images, ...tradeInImages].some(
    (img) => img.status === 'error',
  );

  const {
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
  } = useBuyerRequestForm({
    actionState,
    readyImageUrls,
    readyTradeInImageUrls,
    searchType,
  });

  const [draftLoaded, setDraftLoaded] = React.useState(false);
  const [draftRestored, setDraftRestored] = React.useState(false);

  React.useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(
        BUYER_REQUEST_DRAFT_STORAGE_KEY,
      );
      if (!rawDraft) {
        setDraftLoaded(true);
        return;
      }

      const parsed: unknown = JSON.parse(rawDraft);
      if (!isRequestDraft(parsed)) {
        window.localStorage.removeItem(BUYER_REQUEST_DRAFT_STORAGE_KEY);
        setDraftLoaded(true);
        return;
      }

      setStep(Math.min(Math.max(parsed.step, 1), 4));
      setSearchType(parsed.searchType);
      setFormData(parsed.formData);
      setImages(
        parsed.images.map((image) => ({
          ...image,
          status: 'ready',
        })),
      );
      setTradeInImages(
        parsed.tradeInImages.map((image) => ({
          ...image,
          status: 'ready',
        })),
      );
      setDraftRestored(true);
    } catch (error) {
      console.error('Failed to restore buyer request draft', error);
      window.localStorage.removeItem(BUYER_REQUEST_DRAFT_STORAGE_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, [setFormData]);

  React.useEffect(() => {
    if (!draftLoaded) return;

    const timer = setTimeout(() => {
      const hasDraftContent =
        searchType !== null ||
        images.length > 0 ||
        tradeInImages.length > 0 ||
        Object.values(formData).some((value) =>
          typeof value === 'boolean' ? value : value.trim().length > 0,
        );

      if (!hasDraftContent) {
        window.localStorage.removeItem(BUYER_REQUEST_DRAFT_STORAGE_KEY);
        return;
      }

      const draft: RequestDraft = {
        step,
        searchType,
        formData,
        images: persistableImages(images),
        tradeInImages: persistableImages(tradeInImages),
        updatedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(
        BUYER_REQUEST_DRAFT_STORAGE_KEY,
        JSON.stringify(draft),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [draftLoaded, formData, images, searchType, step, tradeInImages]);

  const clearDraft = () => {
    window.localStorage.removeItem(BUYER_REQUEST_DRAFT_STORAGE_KEY);
    setDraftRestored(false);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (step === 2 && !validateStepTwo()) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };
  const handleBack = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const uploadFile = React.useCallback(
    async (
      file: File,
      id: string,
      purpose: 'request' | 'trade_in',
      setCollection: React.Dispatch<React.SetStateAction<UploadedImage[]>>,
      setError: React.Dispatch<React.SetStateAction<string | null>>,
    ) => {
      const requestData = new FormData();
      requestData.append('file', file);
      requestData.append('purpose', purpose);

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

        setCollection((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, url: uploadUrl, status: 'ready' } : img,
          ),
        );
        setError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ukjent feil ved opplasting';
        setError(message);
        setCollection((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, status: 'error', error: message } : img,
          ),
        );
      }
    },
    [],
  );

  const retryImageUpload = (
    image: UploadedImage,
    purpose: 'request' | 'trade_in',
    setCollection: React.Dispatch<React.SetStateAction<UploadedImage[]>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    if (!image.file) {
      setError('Velg bildet på nytt for å prøve igjen.');
      return;
    }

    setCollection((prev) =>
      prev.map((img) =>
        img.id === image.id
          ? { ...img, status: 'uploading', error: undefined }
          : img,
      ),
    );
    setError(null);
    uploadFile(image.file, image.id, purpose, setCollection, setError);
  };

  const stageFiles = (
    fileList: FileList | null,
    purpose: 'request' | 'trade_in',
    setCollection: React.Dispatch<React.SetStateAction<UploadedImage[]>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    if (!fileList?.length) return;

    Array.from(fileList).forEach((file) => {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      setCollection((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          previewUrl,
          file,
          status: 'uploading',
        },
      ]);

      uploadFile(file, id, purpose, setCollection, setError);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    stageFiles(e.target.files, 'request', setImages, setUploadError);
    e.target.value = '';
  };

  const handleTradeInImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    stageFiles(e.target.files, 'trade_in', setTradeInImages, setTradeInUploadError);
    e.target.value = '';
  };

  const removeImage = (
    index: number,
    collection: 'request' | 'tradeIn' = 'request',
  ) => {
    const setter = collection === 'tradeIn' ? setTradeInImages : setImages;
    setter((prev) => {
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
    stageFiles(e.dataTransfer.files, 'request', setImages, setUploadError);
  };

  const onTradeInDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTradeInDragging(true);
  };
  const onTradeInDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTradeInDragging(false);
  };
  const onTradeInDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTradeInDragging(false);
    stageFiles(e.dataTransfer.files, 'trade_in', setTradeInImages, setTradeInUploadError);
  };

  const steps = [
    { number: 1, title: 'Søketype' },
    { number: 2, title: 'Bildetaljer' },
    { number: 3, title: 'Bilder' },
    { number: 4, title: 'Fullfør' },
  ];

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

    if (hasFailedUploads) {
      event.preventDefault();
      setUploadError(
        'Noen bilder ble ikke lastet opp. Prøv igjen eller fjern bildene før du sender inn.',
      );
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
      return;
    }

    window.sessionStorage.setItem(BUYER_REQUEST_SUBMITTED_STORAGE_KEY, '1');
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className='max-w-3xl mx-auto space-y-10'
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        // Prevent Enter key from submitting form except on final step
        if (
          e.key === 'Enter' &&
          step < 4 &&
          e.target instanceof HTMLTextAreaElement === false
        ) {
          e.preventDefault();
        }
      }}
    >
      <input
        type='hidden'
        name='imageUrls'
        value={JSON.stringify(readyImageUrls)}
      />
      <input
        type='hidden'
        name='tradeInImageUrls'
        value={JSON.stringify(readyTradeInImageUrls)}
      />
      <input type='hidden' name='searchType' value={searchType ?? ''} />
      <input
        type='hidden'
        name='requestType'
        value={searchType === 'general' ? 'open' : 'fixed'}
      />

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
      <input type='hidden' name='bodyType' value={normalizedBodyType} />
      <input type='hidden' name='fuelType' value={normalizedFuelType} />
      <input type='hidden' name='maxKm' value={formData.mileage} />
      <input type='hidden' name='budgetMax' value={formData.budget} />
      <input type='hidden' name='locationCity' value={formData.locationCity} />
      <input type='hidden' name='locationLat' value={formData.locationLat} />
      <input type='hidden' name='locationLng' value={formData.locationLng} />
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

      {draftRestored ? (
        <DraftRestoredBanner onClear={clearDraft} />
      ) : null}

      {/* Progress Steps */}
      <RequestFormProgress steps={steps} activeStep={step} />

      <div className='min-h-[400px]'>
        {/* STEP 1: Søketype */}
        {step === 1 && (
          <SearchTypeStep
            searchType={searchType}
            onSelect={(nextSearchType) => {
              setSearchType(nextSearchType);
              handleNext();
            }}
          />
        )}

        {/* STEP 2: Detaljer */}
        {step === 2 && (
          <VehicleDetailsStep
            searchType={searchType}
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
            locationSuggestions={locationSuggestions}
            locationStatus={locationStatus}
            isResolvingLocation={isResolvingLocation}
            debouncedFetchLocationSuggestions={
              debouncedFetchLocationSuggestions
            }
            selectLocationSuggestion={selectLocationSuggestion}
            useCurrentLocation={useCurrentLocation}
          />
        )}

        {/* STEP 3: Bilder */}
        {step === 3 && (
          <ReferenceImagesStep
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            uploadError={uploadError}
            images={images}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onFileChange={handleImageUpload}
            onRemove={(index) => removeImage(index)}
            onRetry={(img) =>
              retryImageUpload(img, 'request', setImages, setUploadError)
            }
          />
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
                    : 'border-stone-200 hover:border-emerald-200',
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    formData.needsFinancing
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-500',
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
                      onClick={(e) => e.stopPropagation()}
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
                    : 'border-stone-200 hover:border-emerald-200',
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    formData.hasTradeIn
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-100 text-stone-500',
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
                          onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => e.stopPropagation()}
                          placeholder='Beskriv kjente skader eller tilstand'
                          className='min-h-[80px]'
                        />
                      </div>

                      <div className='space-y-3 md:col-span-3'>
                        <div className='flex items-center justify-between gap-4'>
                          <div>
                            <Label className='text-base'>
                              Bilder av innbyttebil
                            </Label>
                            <p className='text-sm text-stone-500'>
                              Legg gjerne ved bilder av bilen som skal byttes
                              inn.
                            </p>
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            className='bg-white'
                            onClick={(e) => {
                              e.stopPropagation();
                              tradeInFileInputRef.current?.click();
                            }}
                          >
                            Velg bilder
                          </Button>
                        </div>

                        <input
                          ref={tradeInFileInputRef}
                          type='file'
                          accept='image/*'
                          multiple
                          className='hidden'
                          onChange={handleTradeInImageUpload}
                        />

                        <div
                          className={cn(
                            'border-2 border-dashed rounded-xl p-6 text-center transition-colors bg-white/70',
                            isTradeInDragging
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-stone-300 hover:border-stone-400',
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            tradeInFileInputRef.current?.click();
                          }}
                          onDragOver={onTradeInDragOver}
                          onDragLeave={onTradeInDragLeave}
                          onDrop={onTradeInDrop}
                        >
                          <p className='text-sm text-stone-600'>
                            Dra inn bilder her, eller klikk for å laste opp
                          </p>
                          <p className='text-xs text-stone-400 mt-1'>
                            JPG, PNG eller WEBP
                          </p>
                        </div>

                        {tradeInUploadError ? (
                          <p className='text-sm text-red-600'>
                            {tradeInUploadError}
                          </p>
                        ) : null}

                        {tradeInImages.length > 0 && (
                          <ImageUploadGrid
                            images={tradeInImages}
                            altPrefix='Innbyttebilde'
                            className='gap-3'
                            tileClassName='rounded-xl bg-white'
                            imageClassName='h-28 w-full object-cover'
                            removeButtonClassName='rounded-full bg-black/70 px-2 py-1 text-xs text-white opacity-100 hover:bg-black/80 hover:text-white'
                            removeLabel='Fjern'
                            showFileName
                            onRemove={(index) => removeImage(index, 'tradeIn')}
                            onRetry={(img) =>
                              retryImageUpload(
                                img,
                                'trade_in',
                                setTradeInImages,
                                setTradeInUploadError,
                              )
                            }
                          />
                        )}
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

      {actionState.formError ? (
        <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {actionState.formError}
        </div>
      ) : null}

      <RequestFormNavigation
        step={step}
        searchType={searchType}
        isUploading={isUploading}
        isPending={isPending}
        onBack={handleBack}
        onNext={handleNext}
      />
    </form>
  );
}
