// src/app/dealer/(dashboard)/requests/[id]/request-details-view.tsx
'use client';

import type React from 'react';
import { useState, useRef } from 'react';
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
} from 'lucide-react';
import { useFormStatus } from 'react-dom';

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

export type Request = {
  id: string;
  title: string;
  make: string;
  model: string;
  yearFrom?: number | null;
  locationCity: string;
  budgetMax: number;
  status: string;
  postedAt: string;
  description: string;
  fuelType?: string | null;
  transmission?: string | null;
};

interface RequestDetailsViewProps {
  request: Request;
  // server action passed from the server component
  action: (formData: FormData) => void;
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

export function RequestDetailsView({
  request,
  action,
}: RequestDetailsViewProps) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file)
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
                <span className='text-xs text-muted-foreground'>
                  Lagt ut{' '}
                  {new Date(request.postedAt).toLocaleDateString('nb-NO')}
                </span>
              </div>
              <CardTitle className='font-serif text-xl mt-2'>
                {request.title}
              </CardTitle>
              <CardDescription>
                Ønsker {request.make} {request.model}
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
                    <span>{request.make}</span>
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
            </CardContent>
          </Card>

          <Card className='bg-emerald-50 border-emerald-100'>
            <CardContent className='pt-6'>
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
                  <form action={action} className='space-y-6'>
                    {/* Hidden requestId for the server action */}
                    <input type='hidden' name='requestId' value={request.id} />

                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='carMake'>Merke</Label>
                        <Input
                          id='carMake'
                          name='carMake'
                          placeholder='f.eks. Volvo'
                          defaultValue={request.make}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='carModel'>Modell</Label>
                        <Input
                          id='carModel'
                          name='carModel'
                          placeholder='f.eks. XC90'
                          defaultValue={request.model}
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
                            <img
                              src={src || '/placeholder.svg'}
                              alt={`Opplasting ${index + 1}`}
                              className='w-full h-full object-cover'
                            />
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
    </div>
  );
}
