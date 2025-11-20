// src/app/buyer/requests/page.tsx
import Link from 'next/link';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { listBuyerRequestsForBuyer } from '@/lib/services/buyerRequests';
import { Button } from '@/components/ui/button';

export default async function BuyerRequestsPage() {
  const user = await stackServerApp.getUser();

  if (!user) {
    return (
      <div className='text-center py-10 text-sm text-muted-foreground'>
        Please sign in to see your requests.
      </div>
    );
  }

  const profile = await ensureUserProfile({ id: user.id });
  const requests = await listBuyerRequestsForBuyer(profile.userId);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My requests</h1>
        <Button asChild size='sm'>
          <Link href='/buyer/requests/new'>New request</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className='border border-dashed rounded-lg p-6 text-sm text-muted-foreground bg-white'>
          You don&apos;t have any requests yet.{' '}
          <Link href='/buyer/requests/new' className='underline'>
            Create your first request
          </Link>
          .
        </div>
      ) : (
        <div className='space-y-3'>
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/buyer/requests/${r.id}`}
              className='block border rounded-lg bg-white px-4 py-3 hover:border-slate-400 transition'
            >
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <div className='font-medium text-sm'>{r.title}</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {r.make} {r.model}
                    {r.yearFrom && <> · {r.yearFrom}+</>}
                    {r.locationCity && <> · {r.locationCity}</>}
                  </div>
                </div>
                <div className='text-right'>
                  {r.budgetMax && (
                    <div className='text-sm font-semibold'>
                      ≤{' '}
                      {r.budgetMax.toLocaleString('nb-NO', {
                        style: 'currency',
                        currency: 'NOK',
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  )}
                  <div className='text-xs text-muted-foreground mt-1'>
                    {r.status}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
