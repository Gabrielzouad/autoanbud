import Image from 'next/image';
import {
  AlertCircle,
  Banknote,
  Bookmark,
  Calendar,
  Car,
  Fuel,
  MapPin,
  Settings,
  ThumbsUp,
  XCircle,
} from 'lucide-react';

import { setDealerRequestActionAction } from '@/app/actions/dealerRequestActions';
import { NoImageAvailable } from '@/components/NoImageAvailable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { DealerRequest } from './request-details-model';

type RequestContextPanelProps = {
  request: DealerRequest;
  onOpenImage: (index: number) => void;
};

export function RequestContextPanel({
  request,
  onOpenImage,
}: RequestContextPanelProps) {
  return (
    <div className='lg:col-span-1 space-y-6'>
      <RequestSummaryCard request={request} onOpenImage={onOpenImage} />
      <DealerTipCard />
      <LeadStatusCard request={request} />
    </div>
  );
}

function RequestSummaryCard({
  request,
  onOpenImage,
}: RequestContextPanelProps) {
  return (
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
            Lagt ut {new Date(request.postedAt).toLocaleDateString('nb-NO')}
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
          <h4 className='text-sm font-medium text-stone-900'>Preferanser</h4>
          <div className='grid grid-cols-2 gap-y-3 gap-x-2 text-sm'>
            <Preference icon={Calendar} label={request.yearFrom ? `${request.yearFrom}+` : 'Alle år'} />
            <Preference icon={Fuel} label={request.fuelType || 'Alle drivlinjer'} />
            <Preference icon={Settings} label={request.transmission || 'Alle girtyper'} />
            <Preference
              icon={Car}
              label={request.requestType === 'open' ? 'Åpent søk' : request.make}
            />
          </div>
        </div>

        <Separator />

        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-stone-900'>Beskrivelse</h4>
          <p className='text-sm text-stone-600 leading-relaxed'>
            {request.description || 'Ingen ekstra beskrivelse.'}
          </p>
        </div>

        <ReferenceImages request={request} onOpenImage={onOpenImage} />
      </CardContent>
    </Card>
  );
}

function Preference({
  icon: Icon,
  label,
}: {
  icon: typeof Calendar;
  label: string;
}) {
  return (
    <div className='flex items-center gap-2 text-stone-600'>
      <Icon className='h-4 w-4 text-stone-400' />
      <span>{label}</span>
    </div>
  );
}

function ReferenceImages({
  request,
  onOpenImage,
}: RequestContextPanelProps) {
  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-stone-900'>Referansebilder</h4>
      {request.imageUrls && request.imageUrls.length > 0 ? (
        <div className='grid grid-cols-2 gap-3'>
          {request.imageUrls.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type='button'
              className='relative aspect-video overflow-hidden rounded-lg border border-stone-200 bg-stone-100'
              onClick={() => onOpenImage(idx)}
            >
              <Image
                src={url}
                alt={`Referansebilde ${idx + 1}`}
                fill
                unoptimized
                className='object-cover'
              />
            </button>
          ))}
        </div>
      ) : (
        <div className='aspect-video overflow-hidden rounded-lg border border-stone-200'>
          <NoImageAvailable />
        </div>
      )}
    </div>
  );
}

function DealerTipCard() {
  return (
    <Card className='bg-emerald-50 border-emerald-100'>
      <CardContent>
        <div className='flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-emerald-600 mt-0.5' />
          <div className='space-y-1'>
            <h4 className='text-sm font-medium text-emerald-900'>Tips</h4>
            <p className='text-sm text-emerald-700'>
              Kjøpere svarer oftere på tilbud som har gode bilder og en
              personlig melding. Bruk noen ekstra sekunder på å skrive hvorfor
              bilen passer dem.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadStatusCard({ request }: { request: DealerRequest }) {
  return (
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
          <RequestActionForm request={request} action='interested' />
          <RequestActionForm request={request} action='bookmarked' />
          <form action={setDealerRequestActionAction} className='space-y-2'>
            <input type='hidden' name='requestId' value={request.id} />
            <input type='hidden' name='action' value='declined' />
            <input type='hidden' name='redirectTo' value='/dealer/requests' />
            <Textarea
              name='reason'
              maxLength={1000}
              placeholder='Valgfri grunn for avslag'
              className='min-h-20 bg-white'
            />
            <Button
              type='submit'
              variant='outline'
              className={getStatusButtonClass('declined', request.dealerAction)}
            >
              <XCircle className='h-4 w-4' />
              <span className='min-w-0 truncate'>Avslå forespørsel</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function RequestActionForm({
  request,
  action,
}: {
  request: DealerRequest;
  action: 'interested' | 'bookmarked';
}) {
  const Icon = action === 'interested' ? ThumbsUp : Bookmark;
  const activeLabel =
    action === 'interested' ? 'Markert som interessert' : 'Lagret til senere';
  const inactiveLabel =
    action === 'interested' ? 'Marker som interessert' : 'Lagre til senere';

  return (
    <form action={setDealerRequestActionAction}>
      <input type='hidden' name='requestId' value={request.id} />
      <input type='hidden' name='action' value={action} />
      <input
        type='hidden'
        name='redirectTo'
        value={`/dealer/requests/${request.id}`}
      />
      <Button
        type='submit'
        variant='outline'
        aria-pressed={request.dealerAction === action}
        className={getStatusButtonClass(action, request.dealerAction)}
      >
        <Icon className='h-4 w-4' />
        <span className='min-w-0 truncate'>
          {request.dealerAction === action ? activeLabel : inactiveLabel}
        </span>
      </Button>
    </form>
  );
}

function getStatusButtonClass(
  button: 'interested' | 'bookmarked' | 'declined',
  activeAction?: DealerRequest['dealerAction'],
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
