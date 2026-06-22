// src/app/dealer/(dashboard)/requests/[id]/request-details-view.tsx
'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Car,
  Fuel,
  Settings,
  Banknote,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { setDealerRequestActionAction } from '@/app/actions/dealerRequestActions';
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
import { NoImageAvailable } from '@/components/NoImageAvailable';
import { calculateOfferCompletenessScore } from '@/lib/offerCompleteness';

export type Request = {
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

interface RequestDetailsViewProps {
  request: Request;
  // server action passed from the server component
  action: (formData: FormData) => void;
}

function getStatusButtonClass(
  button: 'interested' | 'bookmarked' | 'declined',
  activeAction?: Request['dealerAction'],
) {
  const base = 'w-full min-w-0 justify-start overflow-hidden';

  if (button === 'interested') {
    return activeAction === 'interested'
      ? `${base} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white`
      : `${base} border-emerald-200 text-emerald-800 hover:bg-emerald-50`;
  }

  if (button === 'bookmarked') {
    return activeAction === 'bookmarked'
      ? `${base} border-amber-600 bg-amber-500 text-white hover:bg-amber-600 hover:text-white`
      : `${base} border-amber-200 text-amber-800 hover:bg-amber-50`;
  }

  return `${base} border-red-200 text-red-700 hover:bg-red-50`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type='submit'
      className='bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]'
      disabled={pending}
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

function getFormCompleteness(form: HTMLFormElement) {
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

export function RequestDetailsView({
  request,
  action,
}: RequestDetailsViewProps) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [completeness, setCompleteness] = useState(() =>
    calculateOfferCompletenessScore({
      carMake: request.requestType === 'open' ? '' : request.make,
      carModel: request.requestType === 'open' ? '' : request.model,
    }),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceImages = request.imageUrls ?? [];

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file),
      );
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
        <div className='lg:col-span-1 space-y-6'>
          <Card className='border-stone-200 shadow-sm'>
            <CardHeader className='bg-stone-50 border-b border-stone-100'>
              <div className='flex justify-between items-start'>
                <Badge
                  variant='secondary'
                  className='bg-white border-stone-200 text-stone-700'
                >
                  Forespørsel #{request.id.slice(0, 6)}
                </Badge>
                <Badge
                  variant='outline'
                  className={
                    request.requestType === 'open'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  }
                >
                  {request.requestType === 'open' ? 'Åpent søk' : 'Fast match'}
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  Lagt ut{' '}
                  {new Date(request.postedAt).toLocaleDateString('nb-NO')}
                </span>
              </div>
              <CardTitle className='font-serif text-xl mt-2'>
                {request.title}
              </CardTitle>
              <CardDescription>
                {request.requestType === 'open'
                  ? 'Åpent søk basert på behov og preferanser'
                  : `Ønsker ${request.make} ${request.model}`}
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-6 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Banknote className='h-3 w-3' /> Maks budsjett
                  </span>
                  <p className='font-medium text-emerald-700'>
                    {request.budgetMax.toLocaleString('nb-NO')} NOK
                  </p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <MapPin className='h-3 w-3' /> Sted
                  </span>
                  <p className='font-medium text-stone-900'>
                    {request.locationCity}
                  </p>
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <h4 className='text-sm font-medium text-stone-900'>
                  Preferanser
                </h4>
                <div className='grid grid-cols-2 gap-y-3 gap-x-2 text-sm'>
                  <div className='flex items-center gap-2 text-stone-600'>
                    <Calendar className='h-4 w-4 text-stone-400' />
                    <span>
                      {request.yearFrom ? `${request.yearFrom}+` : 'Alle år'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-stone-600'>
                    <Fuel className='h-4 w-4 text-stone-400' />
                    <span>{request.fuelType || 'Alle drivlinjer'}</span>
                  </div>
                  <div className='flex items-center gap-2 text-stone-600'>
                    <Settings className='h-4 w-4 text-stone-400' />
                    <span>{request.transmission || 'Alle girtyper'}</span>
                  </div>
                  <div className='flex items-center gap-2 text-stone-600'>
                    <Car className='h-4 w-4 text-stone-400' />
                    <span>
                      {request.requestType === 'open'
                        ? 'Åpent søk'
                        : request.make}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-2'>
                <h4 className='text-sm font-medium text-stone-900'>
                  Beskrivelse
                </h4>
                <p className='text-sm text-stone-600 leading-relaxed'>
                  {request.description || 'Ingen ekstra beskrivelse.'}
                </p>
              </div>

              <div className='space-y-3'>
                <h4 className='text-sm font-medium text-stone-900'>
                  Referansebilder
                </h4>
                {request.imageUrls && request.imageUrls.length > 0 ? (
                  <div className='grid grid-cols-2 gap-3'>
                    {request.imageUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className='aspect-video overflow-hidden rounded-lg border border-stone-200 bg-stone-100'
                        role='button'
                        tabIndex={0}
                        onClick={() => setLightboxIndex(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setLightboxIndex(idx);
                          }
                        }}
                      >
                        <img
                          src={url}
                          alt={`Referansebilde ${idx + 1}`}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='aspect-video overflow-hidden rounded-lg border border-stone-200'>
                    <NoImageAvailable />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='bg-emerald-50 border-emerald-100'>
            <CardContent>
              <div className='flex items-start gap-3'>
                <AlertCircle className='h-5 w-5 text-emerald-600 mt-0.5' />
                <div className='space-y-1'>
                  <h4 className='text-sm font-medium text-emerald-900'>Tips</h4>
                  <p className='text-sm text-emerald-700'>
                    Kjøpere svarer oftere på tilbud som har gode bilder og en
                    personlig melding. Bruk noen ekstra sekunder på å skrive
                    hvorfor bilen passer dem.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-stone-200 bg-white'>
            <CardHeader>
              <CardTitle className='text-base font-serif text-stone-900'>
                Lead-status
              </CardTitle>
              <CardDescription>
                Merk forespørselen slik at arbeidslisten prioriterer riktig.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {request.dealerActionLabel ? (
                <Badge
                  variant='outline'
                  className={
                    request.dealerAction === 'interested'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }
                >
                  {request.dealerActionLabel}
                </Badge>
              ) : (
                <p className='text-sm text-stone-500'>
                  Ikke markert av forhandler ennå.
                </p>
              )}

              <div className='grid grid-cols-1 gap-2'>
                <form action={setDealerRequestActionAction}>
                  <input type='hidden' name='requestId' value={request.id} />
                  <input type='hidden' name='action' value='interested' />
                  <input
                    type='hidden'
                    name='redirectTo'
                    value={`/dealer/requests/${request.id}`}
                  />
                  <Button
                    type='submit'
                    variant='outline'
                    aria-pressed={request.dealerAction === 'interested'}
                    className={getStatusButtonClass(
                      'interested',
                      request.dealerAction,
                    )}
                  >
                    <ThumbsUp className='h-4 w-4' />
                    <span className='min-w-0 truncate'>
                      {request.dealerAction === 'interested'
                        ? 'Markert som interessert'
                        : 'Marker som interessert'}
                    </span>
                  </Button>
                </form>
                <form action={setDealerRequestActionAction}>
                  <input type='hidden' name='requestId' value={request.id} />
                  <input type='hidden' name='action' value='bookmarked' />
                  <input
                    type='hidden'
                    name='redirectTo'
                    value={`/dealer/requests/${request.id}`}
                  />
                  <Button
                    type='submit'
                    variant='outline'
                    aria-pressed={request.dealerAction === 'bookmarked'}
                    className={getStatusButtonClass(
                      'bookmarked',
                      request.dealerAction,
                    )}
                  >
                    <Bookmark className='h-4 w-4' />
                    <span className='min-w-0 truncate'>
                      {request.dealerAction === 'bookmarked'
                        ? 'Lagret til senere'
                        : 'Lagre til senere'}
                    </span>
                  </Button>
                </form>
                <form action={setDealerRequestActionAction} className='space-y-2'>
                  <input type='hidden' name='requestId' value={request.id} />
                  <input type='hidden' name='action' value='declined' />
                  <input
                    type='hidden'
                    name='redirectTo'
                    value='/dealer/requests'
                  />
                  <Textarea
                    name='reason'
                    maxLength={1000}
                    placeholder='Valgfri grunn for avslag'
                    className='min-h-20 bg-white'
                  />
                  <Button
                    type='submit'
                    variant='outline'
                    className={getStatusButtonClass(
                      'declined',
                      request.dealerAction,
                    )}
                  >
                    <XCircle className='h-4 w-4' />
                    <span className='min-w-0 truncate'>
                      Avslå forespørsel
                    </span>
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    action={action}
                    className='space-y-6'
                    onChange={(event) =>
                      setCompleteness(getFormCompleteness(event.currentTarget))
                    }
                  >
                    {/* Hidden requestId for the server action */}
                    <input type='hidden' name='requestId' value={request.id} />

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
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carRegNr'>Registreringsnummer</Label>
                        <Input
                          id='carRegNr'
                          name='carRegNr'
                          placeholder='f.eks. AB12345'
                        />
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
                    </div>

                    {/* Images – only client-side preview for now */}
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <Label>Bilder av bilen</Label>
                        <span className='text-xs text-muted-foreground'>
                          {images.length} bilder valgt
                        </span>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {images.map((src, index) => (
                          <div
                            key={index}
                            className='relative aspect-square group rounded-lg overflow-hidden border border-stone-200'
                          >
                            {src ? (
                              <img
                                src={src}
                                alt={`Opplasting ${index + 1}`}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <NoImageAvailable />
                            )}
                            <button
                              type='button'
                              onClick={() => removeImage(index)}
                              className='absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </div>
                        ))}

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className='aspect-square rounded-lg border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-stone-500 hover:text-emerald-600'
                        >
                          <Upload className='h-6 w-6' />
                          <span className='text-xs font-medium'>
                            Legg til bilder
                          </span>
                        </div>
                      </div>

                      <input
                        type='file'
                        ref={fileInputRef}
                        className='hidden'
                        multiple
                        accept='image/*'
                        onChange={handleImageUpload}
                      />
                      <p className='text-xs text-muted-foreground'>
                        Inntil 10 bilder. Støttede formater: JPG, PNG.
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
                      <SubmitButton />
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {lightboxIndex !== null && referenceImages[lightboxIndex] && (
        <div className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4'>
          <button
            type='button'
            className='absolute top-4 right-4 text-white hover:text-emerald-200'
            onClick={() => setLightboxIndex(null)}
          >
            <X className='h-6 w-6' />
          </button>

          <div className='absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20'>
            {lightboxIndex + 1} / {referenceImages.length}
          </div>

          {lightboxIndex > 0 && (
            <button
              type='button'
              className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-emerald-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 shadow-lg'
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
            >
              <ChevronLeft className='h-6 w-6' />
            </button>
          )}
          {lightboxIndex < referenceImages.length - 1 && (
            <button
              type='button'
              className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-emerald-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 shadow-lg'
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
            >
              <ChevronRight className='h-6 w-6' />
            </button>
          )}
          <div className='max-w-5xl w-full max-h-[80vh]'>
            <div className='relative w-full h-full aspect-video bg-black/40 rounded-lg overflow-hidden'>
              <img
                src={referenceImages[lightboxIndex]}
                alt='Viser referansebilde'
                className='w-full h-full object-contain'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
