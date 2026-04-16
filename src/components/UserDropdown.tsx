'use client';

import { LogOut, Settings, User } from 'lucide-react';
import { useStackApp } from '@stackframe/stack';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type UserDropdownProps = {
  displayName: string;
  displaySubtitle: string;
  avatarFallback?: string;
};

export function UserDropdown({ displayName, displaySubtitle, avatarFallback }: UserDropdownProps) {
  const stackApp = useStackApp();

  const handleSignOut = async () => {
    await stackApp.signOut();
    window.location.href = '/';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex items-center gap-3 pl-4 border-l border-stone-200 hover:bg-stone-100'
        >
          <div className='hidden md:flex flex-col items-end'>
            <div className='text-sm font-medium text-stone-900'>{displayName}</div>
            <div className='text-xs text-stone-500'>{displaySubtitle}</div>
          </div>
          <div className='h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 border border-stone-200'>
            {avatarFallback ? (
              <span className='font-serif font-bold'>{avatarFallback}</span>
            ) : (
              <User className='h-4 w-4' />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-stone-500'>{displaySubtitle}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href='/settings' className='cursor-pointer'>
            <Settings className='h-4 w-4' />
            <span>Innstillinger</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className='cursor-pointer text-red-600 focus:text-red-600'>
          <LogOut className='h-4 w-4' />
          <span>Logg ut</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
