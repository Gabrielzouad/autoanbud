// src/app/buyer/requests/new/page.tsx
import { redirect } from 'next/navigation';
import { createBuyerRequestAction } from '@/app/actions/buyerRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

export default function NewBuyerRequestPage() {
  async function action(formData: FormData) {
    'use server';

    const result = await createBuyerRequestAction(formData);

    if (!result.success) {
      console.error(result.errors);
      throw new Error('Validation failed');
    }

    redirect(`/buyer/requests/${result.requestId}`);
  }

  return (
    <div className='max-w-2xl space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold mb-1'>New buyer request</h1>
        <p className='text-sm text-muted-foreground'>
          Describe the car you are looking for. Dealers will respond with
          matching offers.
        </p>
      </div>

      <form
        action={action}
        className='space-y-5 bg-white border rounded-lg p-5 shadow-sm'
      >
        {/* Title */}
        <div className='space-y-1.5'>
          <Label htmlFor='title'>Title</Label>
          <Input
            id='title'
            name='title'
            placeholder='Volvo XC90 2020+ family SUV'
            required
          />
        </div>

        {/* Make / Model */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='make'>Make</Label>
            <Input id='make' name='make' placeholder='Volvo' required />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='model'>Model</Label>
            <Input id='model' name='model' placeholder='XC90' required />
          </div>
        </div>

        {/* Year and km */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='yearFrom'>Year from</Label>
            <Input
              id='yearFrom'
              name='yearFrom'
              type='number'
              min={1990}
              max={2100}
              placeholder='2018'
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='yearTo'>Year to</Label>
            <Input
              id='yearTo'
              name='yearTo'
              type='number'
              min={1990}
              max={2100}
              placeholder='2023'
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='maxKm'>Max km</Label>
            <Input id='maxKm' name='maxKm' type='number' placeholder='120000' />
          </div>
        </div>

        {/* Budget & location */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='budgetMax'>Budget max (NOK)</Label>
            <Input
              id='budgetMax'
              name='budgetMax'
              type='number'
              placeholder='650000'
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='locationCity'>City / area</Label>
            <Input id='locationCity' name='locationCity' placeholder='Oslo' />
          </div>
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            name='description'
            rows={4}
            placeholder='Family car, 7 seats, tow bar, preferably AWD...'
          />
        </div>

        {/* Checkboxes */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 text-sm'>
          <label className='inline-flex items-center gap-2'>
            <Checkbox id='wantsTradeIn' name='wantsTradeIn' />
            <span> I have a car to trade in</span>
          </label>

          <label className='inline-flex items-center gap-2'>
            <Checkbox id='financingNeeded' name='financingNeeded' />
            <span>I need financing</span>
          </label>
        </div>

        <div className='pt-2'>
          <Button type='submit'>Create request</Button>
        </div>
      </form>
    </div>
  );
}
