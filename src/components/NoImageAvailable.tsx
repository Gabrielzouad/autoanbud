import { Car } from 'lucide-react';

import { cn } from '@/lib/utils';

export function NoImageAvailable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100 text-center text-sm font-medium text-stone-500',
        className,
      )}
    >
      <Car className='h-6 w-6 text-stone-400' />
      <span>Ingen bilder tilgjengelig</span>
    </div>
  );
}
