// src/app/dealer/requests/page.tsx
import Link from 'next/link';
import { listOpenBuyerRequests } from '@/lib/services/dealerRequests';

export default async function DealerRequestsPage() {
  const requests = await listOpenBuyerRequests();

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Buyer requests</h1>
      <p className='text-sm text-muted-foreground'>
        These are current open requests from buyers. Select one to view details
        and send an offer from your inventory.
      </p>

      {requests.length === 0 ? (
        <div className='border border-dashed rounded-lg p-6 text-sm text-muted-foreground bg-white'>
          No open requests yet.
        </div>
      ) : (
        <div className='space-y-3'>
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/dealer/requests/${r.id}`}
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
