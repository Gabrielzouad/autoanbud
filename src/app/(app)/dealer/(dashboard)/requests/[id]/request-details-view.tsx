// src/app/dealer/(dashboard)/requests/[id]/request-details-view.tsx
'use client';

import type React from 'react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageUploadGrid } from '@/components/ImageUploadGrid';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateOfferCompletenessScore } from '@/lib/offerCompleteness';
import { RequestContextPanel } from './request-context-panel';
import {
  getOfferFormCompleteness,
  initialOfferFormState,
  type DealerRequest,
  type OfferFormState,
  type UploadedOfferImage,
} from './request-details-model';

export type { DealerRequest as Request, OfferFormState };

interface RequestDetailsViewProps {
  request: DealerRequest;
  // server action passed from the server component
  action: (
    state: OfferFormState,
    formData: FormData,
  ) => Promise<OfferFormState>;
}

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type='submit'
      className='bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]'
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Sender…
        </>
      ) : (
        <>
          Send tilbud
          <CheckCircle2 className='ml-2 h-4 w-4' />
        </>
      )}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;

  return <p className='text-sm text-red-600'>{errors[0]}</p>;
}

export function RequestDetailsView({
  request,
  action,
}: RequestDetailsViewProps) {
  const router = useRouter();
  const [formState, formAction] = useActionState(
    action,
    initialOfferFormState,
  );
  const [images, setImages] = useState<UploadedOfferImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [completeness, setCompleteness] = useState(() =>
    calculateOfferCompletenessScore({
      carMake: request.requestType === 'open' ? '' : request.make,
      carModel: request.requestType === 'open' ? '' : request.model,
    }),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceImages = request.imageUrls ?? [];
  const readyImageUrls = images
    .filter((image) => image.status === 'ready' && image.url)
    .map((image) => image.url as string);
  const isUploading = images.some((image) => image.status === 'uploading');
  const hasFailedUploads = images.some((image) => image.status === 'error');

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      }
      if (event.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex((prev) => (prev === null ? prev : prev - 1));
      }
      if (
        event.key === 'ArrowRight' &&
        lightboxIndex < referenceImages.length - 1
      ) {
        setLightboxIndex((prev) => (prev === null ? prev : prev + 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, referenceImages.length]);

  const uploadOfferImage = async (file: File, id: string) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('purpose', 'offer');

    try {
      const response = await fetch('/api/uploads/request-images', {
        method: 'POST',
        body: uploadData,
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
        prev.map((image) =>
          image.id === id
            ? { ...image, url: uploadUrl, status: 'ready' }
            : image,
        ),
      );
      setUploadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ukjent feil ved opplasting';
      setUploadError(message);
      setImages((prev) =>
        prev.map((image) =>
          image.id === id
            ? { ...image, status: 'error', error: message }
            : image,
        ),
      );
    }
  };

  const stageOfferFiles = (fileList: FileList | null) => {
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
          file,
          status: 'uploading',
        },
      ]);
      uploadOfferImage(file, id);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    stageOfferFiles(e.target.files);
    e.target.value = '';
  };

  const retryImageUpload = (image: UploadedOfferImage) => {
    if (!image.file) {
      setUploadError('Velg bildet på nytt for å prøve igjen.');
      return;
    }

    setImages((prev) =>
      prev.map((item) =>
        item.id === image.id
          ? { ...item, status: 'uploading', error: undefined }
          : item,
      ),
    );
    setUploadError(null);
    uploadOfferImage(image.file, image.id);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const image = prev[index];
      if (image) URL.revokeObjectURL(image.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleOfferSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (isUploading) {
      event.preventDefault();
      setUploadError('Vent til bildene er ferdig lastet opp før du sender.');
      return;
    }

    if (hasFailedUploads) {
      event.preventDefault();
      setUploadError(
        'Noen bilder ble ikke lastet opp. Prøv igjen eller fjern bildene før du sender.',
      );
    }
  };

  return (
    <div className='space-y-6'>
      <Button
        variant='ghost'
        className='pl-0 hover:bg-transparent hover:text-emerald-600'
        onClick={() => router.back()}
      >
        <ArrowLeft className='mr-2 h-4 w-4' />
        Tilbake til forespørsler
      </Button>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Left Column: Request Details */}
        <RequestContextPanel
          request={request}
          onOpenImage={setLightboxIndex}
        />

        {/* Right Column: Make Offer Form */}
        <div className='lg:col-span-2'>
          <Card className='border-stone-200 shadow-md'>
            <CardHeader>
              <CardTitle className='font-serif text-2xl text-stone-900'>
                Gi tilbud
              </CardTitle>
              <CardDescription>
                Fyll inn detaljer om bilen du ønsker å tilby til denne
                forespørselen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='custom' className='w-full'>
                <TabsList className='grid w-full grid-cols-2 mb-6'>
                  <TabsTrigger value='custom'>Tilpasset tilbud</TabsTrigger>
                  <TabsTrigger
                    value='inventory'
                    disabled
                    className='opacity-50 cursor-not-allowed'
                  >
                    Velg fra lager (kommer)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='custom'>
                  {/* IMPORTANT: use server action provided via props */}
                  <form
                    action={formAction}
                    className='space-y-6'
                    onSubmit={handleOfferSubmit}
                    onChange={(event) =>
                      setCompleteness(
                        getOfferFormCompleteness(event.currentTarget),
                      )
                    }
                  >
                    {/* Hidden requestId for the server action */}
                    <input type='hidden' name='requestId' value={request.id} />
                    <input
                      type='hidden'
                      name='imageUrls'
                      value={JSON.stringify(readyImageUrls)}
                    />

                    {formState.message && (
                      <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                        {formState.message}
                      </div>
                    )}

                    <div className='rounded-lg border border-stone-200 bg-stone-50 p-4'>
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <p className='text-sm font-medium text-stone-900'>
                            Tilbudskompletthet
                          </p>
                          <p className='text-xs text-stone-500'>
                            Minimum 60%. Finansiering og inspeksjon er
                            valgfrie tillegg.
                          </p>
                        </div>
                        <Badge
                          variant='outline'
                          className={
                            completeness.isSubmittable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }
                        >
                          {completeness.score}%
                        </Badge>
                      </div>
                      <div className='mt-3 h-2 overflow-hidden rounded-full bg-stone-200'>
                        <div
                          className={
                            'h-full rounded-full transition-all ' +
                            (completeness.isSubmittable
                              ? 'bg-emerald-600'
                              : 'bg-amber-500')
                          }
                          style={{ width: `${completeness.score}%` }}
                        />
                      </div>
                      {completeness.missingRequiredFields.length > 0 ? (
                        <p className='mt-2 text-xs text-amber-700'>
                          Mangler:{' '}
                          {completeness.missingRequiredFields.join(', ')}.
                        </p>
                      ) : (
                        <p className='mt-2 text-xs text-emerald-700'>
                          Grunnleggende felter er på plass. Ekstra detaljer gir
                          bedre rangering.
                        </p>
                      )}
                    </div>

                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='carMake'>Merke</Label>
                        <Input
                          id='carMake'
                          name='carMake'
                          placeholder='f.eks. Volvo'
                          defaultValue={
                            request.requestType === 'open' ? '' : request.make
                          }
                          required
                        />
                        <FieldError errors={formState.errors.carMake} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carModel'>Modell</Label>
                        <Input
                          id='carModel'
                          name='carModel'
                          placeholder='f.eks. XC90'
                          defaultValue={
                            request.requestType === 'open' ? '' : request.model
                          }
                          required
                        />
                        <FieldError errors={formState.errors.carModel} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carYear'>Årsmodell</Label>
                        <Input
                          id='carYear'
                          name='carYear'
                          type='number'
                          placeholder='2023'
                          min={1900}
                          max={2100}
                          required
                        />
                        <FieldError errors={formState.errors.carYear} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carKm'>Kilometerstand (km)</Label>
                        <Input
                          id='carKm'
                          name='carKm'
                          type='number'
                          placeholder='f.eks. 45000'
                          required
                        />
                        <FieldError errors={formState.errors.carKm} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='priceTotal'>Tilbudspris (NOK)</Label>
                        <Input
                          id='priceTotal'
                          name='priceTotal'
                          type='number'
                          placeholder='f.eks. 750000'
                          required
                        />
                        <FieldError errors={formState.errors.priceTotal} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='deliveryTimeEstimate'>
                          Leveringstid
                        </Label>
                        <Input
                          id='deliveryTimeEstimate'
                          name='deliveryTimeEstimate'
                          placeholder='f.eks. 1-2 uker etter betaling'
                          required
                        />
                        <FieldError
                          errors={formState.errors.deliveryTimeEstimate}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='warrantySummary'>
                          Garantibeskrivelse
                        </Label>
                        <Input
                          id='warrantySummary'
                          name='warrantySummary'
                          placeholder='f.eks. 12 måneders garanti'
                          required
                        />
                        <FieldError
                          errors={formState.errors.warrantySummary}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carRegNr'>Registreringsnummer</Label>
                        <Input
                          id='carRegNr'
                          name='carRegNr'
                          placeholder='f.eks. AB12345'
                        />
                        <FieldError errors={formState.errors.carRegNr} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carVariant'>
                          Variant / utstyrsnivå
                        </Label>
                        <Input
                          id='carVariant'
                          name='carVariant'
                          placeholder='T8 Recharge Inscription'
                        />
                        <FieldError errors={formState.errors.carVariant} />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='financingPossible'>
                        Finansiering mulig
                      </Label>
                      <div className='flex items-center gap-3'>
                        <input
                          id='financingPossible'
                          name='financingPossible'
                          type='checkbox'
                          className='h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500'
                        />
                        <label
                          htmlFor='financingPossible'
                          className='text-sm text-stone-700'
                        >
                          Tilby finansiering til kjøperen
                        </label>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='inspectionIncluded'>
                        Inspeksjon inkludert
                      </Label>
                      <div className='flex items-center gap-3'>
                        <input
                          id='inspectionIncluded'
                          name='inspectionIncluded'
                          type='checkbox'
                          className='h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500'
                        />
                        <label
                          htmlFor='inspectionIncluded'
                          className='text-sm text-stone-700'
                        >
                          Bilen leveres med dokumentert inspeksjon
                        </label>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='financingExample'>
                        Finansieringseksempel
                      </Label>
                      <Textarea
                        id='financingExample'
                        name='financingExample'
                        placeholder='Forklar kort hvordan finansieringen kan se ut, f.eks. månedlige ytelser.'
                        className='min-h-[100px]'
                      />
                      <FieldError errors={formState.errors.financingExample} />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='shortMessageToBuyer'>
                        Melding til kjøper
                      </Label>
                      <Textarea
                        id='shortMessageToBuyer'
                        name='shortMessageToBuyer'
                        placeholder='Beskriv bilens tilstand, nøkkelfordeler og hvorfor den passer deres behov...'
                        className='min-h-[120px]'
                        required
                      />
                      <FieldError
                        errors={formState.errors.shortMessageToBuyer}
                      />
                    </div>

                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <Label>Bilder av bilen</Label>
                        <span className='text-xs text-muted-foreground'>
                          {readyImageUrls.length} av {images.length} lastet opp
                        </span>
                      </div>

                      {uploadError ? (
                        <p className='text-sm text-red-600'>{uploadError}</p>
                      ) : null}

                      <ImageUploadGrid
                        images={images}
                        altPrefix='Opplasting'
                        tileClassName='aspect-square rounded-lg'
                        removeButtonClassName='top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 opacity-0 hover:text-white'
                        errorMode='overlay'
                        addTileLabel='Legg til bilder'
                        onAddClick={() => fileInputRef.current?.click()}
                        onRemove={removeImage}
                        onRetry={retryImageUpload}
                      />

                      <input
                        type='file'
                        ref={fileInputRef}
                        className='hidden'
                        multiple
                        accept='image/*'
                        onChange={handleImageUpload}
                      />
                      <p className='text-xs text-muted-foreground'>
                        Inntil 8 bilder per opplasting. Støttede formater:
                        JPG, PNG og WebP.
                      </p>
                    </div>

                    <Separator />

                    <div className='flex justify-end gap-4'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => router.back()}
                      >
                        Avbryt
                      </Button>
                      <SubmitButton disabled={isUploading || hasFailedUploads} />
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageLightbox
        images={referenceImages}
        activeIndex={lightboxIndex}
        alt='Viser referansebilde'
        onClose={() => setLightboxIndex(null)}
        onPrevious={() =>
          setLightboxIndex((prev) => (prev === null ? prev : prev - 1))
        }
        onNext={() =>
          setLightboxIndex((prev) => (prev === null ? prev : prev + 1))
        }
      />
    </div>
  );
}
