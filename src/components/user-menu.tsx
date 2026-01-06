'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type UserMenuProps = {
  primaryLabel: string;
  secondaryLabel: string;
  avatar: ReactNode;
};

export function UserMenu({
  primaryLabel,
  secondaryLabel,
  avatar,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className='relative'>
      <button
        type='button'
        className={cn(
          'flex items-center gap-3 rounded-full px-3 py-2 transition-colors',
          'hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200',
          'border border-transparent'
        )}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup='menu'
      >
        <div className='text-right'>
          <div className='text-sm font-medium text-stone-900'>
            {primaryLabel}
          </div>
          {secondaryLabel ? (
            <div className='text-xs text-stone-500'>{secondaryLabel}</div>
          ) : null}
        </div>
        <div className='h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 border border-stone-200'>
          {avatar}
        </div>
        <span className='sr-only'>Åpne brukerhandlinger</span>
      </button>

      {open ? (
        <div className='absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg focus:outline-none'>
          <div className='px-4 py-3'>
            <div className='text-sm font-medium text-stone-900'>
              {primaryLabel}
            </div>
            {secondaryLabel ? (
              <div className='text-xs text-stone-500'>{secondaryLabel}</div>
            ) : null}
          </div>
          <div className='border-t border-stone-200'>
            <Link
              href='/handler/sign-out'
              className='block px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-50'
            >
              Logg ut
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
