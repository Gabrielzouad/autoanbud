'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import { Search, Filter, MapPin, Banknote, Car } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export type Request = {
  id: string;
  title: string;
  make: string;
  model: string;
  yearFrom?: number;
  locationCity: string;
  budgetMax: number;
  status: string;
  postedAt: string; // ISO string
  description: string;
  fuelType?: string;
  transmission?: string;
};

interface RequestsViewProps {
  initialRequests: Request[];
}

export function RequestsView({ initialRequests }: RequestsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<
    'newest' | 'price-high' | 'price-low'
  >('newest');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const makes = useMemo(
    () => ['All', ...Array.from(new Set(initialRequests.map((r) => r.make)))],
    [initialRequests]
  );

  const regions = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(initialRequests.map((r) => r.locationCity ?? 'Uspesifisert'))
      ),
    ],
    [initialRequests]
  );

  const filteredRequests = useMemo(() => {
    return initialRequests
      .filter((req) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          req.title.toLowerCase().includes(q) ||
          req.make.toLowerCase().includes(q) ||
          req.model.toLowerCase().includes(q);

        const matchesMake = selectedMake === 'All' || req.make === selectedMake;
        const matchesRegion =
          selectedRegion === 'All' || req.locationCity === selectedRegion;

        const matchesMinBudget =
          minBudget === '' ||
          req.budgetMax >= Number.parseInt(minBudget || '0');
        const matchesMaxBudget =
          maxBudget === '' ||
          req.budgetMax <= Number.parseInt(maxBudget || '0');

        return (
          matchesSearch &&
          matchesMake &&
          matchesRegion &&
          matchesMinBudget &&
          matchesMaxBudget
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'price-high') return b.budgetMax - a.budgetMax;
        if (sortOrder === 'price-low') return a.budgetMax - b.budgetMax;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [
    initialRequests,
    searchQuery,
    selectedMake,
    selectedRegion,
    sortOrder,
    minBudget,
    maxBudget,
  ]);

  return (
    <div className='flex flex-col lg:flex-row gap-8'>
      {/* Sidebar Filters */}
      <aside className='w-full lg:w-64 shrink-0 space-y-6'>
        <div className='space-y-4'>
          <div className='flex items-center gap-2 font-serif text-lg font-semibold text-stone-900'>
            <Filter className='h-5 w-5' />
            Filtre
          </div>

          <div className='space-y-2'>
            <Label htmlFor='search'>Søk</Label>
            <div className='relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                id='search'
                placeholder='Modell, nøkkelord...'
                className='pl-9'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Budsjett (NOK)</Label>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='Min'
                type='number'
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
              />
              <span className='text-muted-foreground'>-</span>
              <Input
                placeholder='Maks'
                type='number'
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Merke</Label>
            <select
              className='flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
            >
              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-2'>
            <Label>Sted</Label>
            <select
              className='flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant='outline'
            className='w-full bg-transparent'
            onClick={() => {
              setSearchQuery('');
              setSelectedMake('All');
              setSelectedRegion('All');
              setMinBudget('');
              setMaxBudget('');
              setSortOrder('newest');
            }}
          >
            Nullstill filtre
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm'>
          <div className='text-sm text-muted-foreground'>
            Viser{' '}
            <span className='font-medium text-stone-900'>
              {filteredRequests.length}
            </span>{' '}
            forespørsler
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground whitespace-nowrap'>
              Sorter:
            </span>
            <select
              className='h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              value={sortOrder}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSortOrder(
                  e.target.value as 'newest' | 'price-high' | 'price-low'
                )
              }
            >
              <option value='newest'>Nyeste først</option>
              <option value='price-high'>Høyest budsjett</option>
              <option value='price-low'>Lavest budsjett</option>
            </select>
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-2 '>
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className='flex flex-col hover:shadow-md transition-shadow duration-200 border-stone-200'
            >
              <CardHeader className='pb-3'>
                <div className='flex justify-between items-start gap-2'>
                  <Badge
                    variant='outline'
                    className='bg-stone-50 text-stone-700 border-stone-200'
                  >
                    {request.yearFrom ? `${request.yearFrom}+` : 'Alle år'}
                  </Badge>
                  <span className='text-xs text-muted-foreground whitespace-nowrap'>
                    {new Date(request.postedAt).toLocaleDateString('nb-NO')}
                  </span>
                </div>
                <h3 className='font-serif text-lg font-semibold leading-tight text-stone-900 mt-2'>
                  {request.make} {request.model}
                </h3>
                <p className='text-sm text-muted-foreground line-clamp-1'>
                  {request.title}
                </p>
              </CardHeader>

              <CardContent className='pb-3 flex-1'>
                <div className='space-y-2.5'>
                  <div className='flex items-center gap-2 text-sm text-stone-600'>
                    <MapPin className='h-4 w-4 text-emerald-600 shrink-0' />
                    <span className='truncate'>{request.locationCity}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-stone-600'>
                    <Car className='h-4 w-4 text-emerald-600 shrink-0' />
                    <span className='truncate'>
                      {[request.fuelType, request.transmission]
                        .filter(Boolean)
                        .join(' • ') || 'Ingen spesifikk drivlinje'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-stone-600'>
                    <Banknote className='h-4 w-4 text-emerald-600 shrink-0' />
                    <span className='font-medium text-stone-900'>
                      Maks {request.budgetMax.toLocaleString('nb-NO')} NOK
                    </span>
                  </div>
                </div>

                <Separator className='my-4' />

                <p className='text-sm text-stone-500 line-clamp-2'>
                  {request.description}
                </p>
              </CardContent>

              <CardFooter className='pt-0'>
                <Button
                  asChild
                  className='w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                >
                  <Link href={`/dealer/requests/${request.id}`}>
                    Vis detaljer / Gi tilbud
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className='flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-stone-50/50'>
            <div className='rounded-full bg-stone-100 p-3 mb-4'>
              <Search className='h-6 w-6 text-stone-400' />
            </div>
            <h3 className='text-lg font-medium text-stone-900'>
              Ingen forespørsler funnet
            </h3>
            <p className='text-sm text-muted-foreground mt-1 max-w-xs'>
              Prøv å justere filtrene eller fjern søketeksten.
            </p>
            <Button
              variant='link'
              className='mt-2 text-emerald-600'
              onClick={() => {
                setSearchQuery('');
                setSelectedMake('All');
                setSelectedRegion('All');
                setMinBudget('');
                setMaxBudget('');
              }}
            >
              Nullstill filtre
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
