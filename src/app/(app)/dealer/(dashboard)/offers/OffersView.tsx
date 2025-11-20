'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, MapPin, Search, ArrowRight, Filter } from 'lucide-react';

export type OfferCard = {
  id: string;
  status: string; // "submitted" | "accepted" | "expired" | "rejected" | ...
  priceTotal: number;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  car: {
    make: string;
    model: string;
    year?: number;
    regNr?: string;
    km?: number;
    image?: string | null;
  };
  request: {
    id: string;
    title: string;
    buyerName: string;
    location: string;
  };
};

interface OffersViewProps {
  initialOffers: OfferCard[];
}

export function OffersView({ initialOffers }: OffersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [sortOrder, setSortOrder] = useState<
    'newest' | 'oldest' | 'price-high' | 'price-low'
  >('newest');

  const filteredOffers = useMemo(() => {
    return initialOffers
      .filter((offer) => {
        const q = searchQuery.toLowerCase();

        const matchesSearch =
          offer.car.make.toLowerCase().includes(q) ||
          offer.car.model.toLowerCase().includes(q) ||
          offer.request.title.toLowerCase().includes(q) ||
          offer.request.buyerName.toLowerCase().includes(q) ||
          offer.id.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === 'all' || offer.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder === 'price-high') {
          return b.priceTotal - a.priceTotal;
        }
        if (sortOrder === 'price-low') {
          return a.priceTotal - b.priceTotal;
        }
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        if (sortOrder === 'oldest') {
          return aDate - bDate;
        }
        // newest
        return bDate - aDate;
      });
  }, [initialOffers, searchQuery, statusFilter, sortOrder]);

  const normalizeStatusForBadge = (status: string) => {
    // DB likely uses "submitted" instead of "pending"
    if (status === 'submitted') return 'pending';
    return status;
  };

  const formatStatusLabel = (status: string) => {
    const s = normalizeStatusForBadge(status);
    if (s === 'pending') return 'Pending';
    if (s === 'accepted') return 'Accepted';
    if (s === 'rejected') return 'Rejected';
    if (s === 'expired') return 'Expired';
    return s;
  };

  const renderStatusClass = (status: string) => {
    const s = normalizeStatusForBadge(status);
    if (s === 'accepted')
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'rejected') return 'bg-red-100 text-red-800 border-red-200';
    if (s === 'expired') return 'bg-stone-100 text-stone-700 border-stone-200';
    return '';
  };

  return (
    <div className='space-y-6'>
      {/* Filters */}
      <div className='grid gap-4 md:grid-cols-[1fr_200px_200px]'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400' />
          <Input
            placeholder='Søk på bil, kjøper eller ID...'
            className='pl-9 border-stone-200 focus-visible:ring-emerald-600'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className='border-stone-200'>
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-stone-400' />
              <SelectValue placeholder='Status' />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Alle statuser</SelectItem>
            <SelectItem value='submitted'>Sendt</SelectItem>
            <SelectItem value='accepted'>Akseptert</SelectItem>
            <SelectItem value='rejected'>Avslått</SelectItem>
            <SelectItem value='expired'>Utløpt</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(
            value:
              | string
              | ((
                  prevState: 'newest' | 'oldest' | 'price-high' | 'price-low'
                ) => 'newest' | 'oldest' | 'price-high' | 'price-low')
          ) =>
            setSortOrder(
              typeof value === 'string'
                ? (value as 'newest' | 'oldest' | 'price-high' | 'price-low')
                : value
            )
          }
        >
          <SelectTrigger className='border-stone-200'>
            <SelectValue placeholder='Sorter etter' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Nyeste først</SelectItem>
            <SelectItem value='oldest'>Eldste først</SelectItem>
            <SelectItem value='price-high'>Pris: høy til lav</SelectItem>
            <SelectItem value='price-low'>Pris: lav til høy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offers Grid */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {filteredOffers.map((offer) => (
          <Card
            key={offer.id}
            className='group overflow-hidden border-stone-200 hover:border-emerald-200 hover:shadow-md transition-all duration-300'
          >
            <div className='aspect-video w-full overflow-hidden bg-stone-100 relative'>
              <img
                src={
                  offer.car.image || '/images/car-placeholder.avif' // add a placeholder in /public/images
                }
                alt={`${offer.car.make} ${offer.car.model}`}
                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
              />
              <div className='absolute top-3 right-3'>
                <Badge
                  className={`${renderStatusClass(
                    offer.status
                  )} capitalize shadow-sm`}
                  variant='outline'
                >
                  {formatStatusLabel(offer.status)}
                </Badge>
              </div>
            </div>

            <CardHeader className='pb-3'>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-lg font-serif text-emerald-950'>
                    {offer.car.make} {offer.car.model}
                  </CardTitle>
                  <p className='text-sm text-stone-500 mt-1'>
                    {offer.car.year && `${offer.car.year} • `}{' '}
                    {offer.car.km
                      ? `${offer.car.km.toLocaleString('nb-NO')} km`
                      : 'Km ikke oppgitt'}
                  </p>
                </div>
                <div className='text-right'>
                  <div className='font-semibold text-emerald-900'>
                    {offer.priceTotal.toLocaleString('nb-NO')} kr
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='pb-3'>
              <div className='space-y-3 text-sm'>
                <div className='flex items-center gap-2 text-stone-600 bg-stone-50 p-2 rounded-md'>
                  <div className='h-8 w-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0'>
                    <span className='font-serif font-bold text-xs text-emerald-800'>
                      {offer.request.buyerName.charAt(0)}
                    </span>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-stone-900 truncate'>
                      {offer.request.title}
                    </p>
                    <p className='text-xs text-stone-500 truncate'>
                      For {offer.request.buyerName}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100'>
                  <div className='flex items-center gap-1.5'>
                    <MapPin className='h-3.5 w-3.5' />
                    {offer.request.location}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Clock className='h-3.5 w-3.5' />
                    Utløper{' '}
                    {new Date(offer.expiresAt).toLocaleDateString('nb-NO')}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className='pt-0'>
              <Button
                variant='outline'
                className='w-full border-stone-200 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 group/btn bg-transparent'
                asChild
              >
                {/* For nå: gå til forespørselen, der tilbudet ble sendt */}
                <Link href={`/dealer/offers/${offer.id}`}>
                  Se detaljer
                  <ArrowRight className='ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform' />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className='border-2 border-dashed rounded-lg py-12 text-center bg-stone-50/40'>
          <div className='inline-flex items-center justify-center rounded-full bg-stone-100 p-3 mb-3'>
            <Search className='h-5 w-5 text-stone-400' />
          </div>
          <p className='text-sm text-stone-600'>
            Ingen tilbud matcher filtrene dine ennå.
          </p>
        </div>
      )}
    </div>
  );
}
