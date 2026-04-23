import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CarFront, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='min-h-screen flex flex-col bg-stone-50'>
      <header className='w-full border-b border-stone-200 bg-white/80 backdrop-blur-md'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center'>
          <Link
            href='/'
            className='flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-stone-900'
          >
            <div className='w-8 h-8 bg-emerald-900 text-white rounded-full flex items-center justify-center'>
              <CarFront className='w-4 h-4' />
            </div>
            AutoAnbud
          </Link>
        </div>
      </header>

      <main className='flex-1 flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center space-y-8'>
          <div className='relative'>
            <div className='text-[150px] md:text-[200px] font-serif font-bold text-stone-200 leading-none select-none'>
              404
            </div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-16 h-16 md:w-22 md:h-22 mb-2 bg-stone-50 rounded-full flex items-center justify-center'>
                <Search className='w-12 h-12 text-stone-400' />
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h1 className='font-serif text-3xl md:text-4xl text-stone-900'>
              Siden ble ikke funnet
            </h1>
            <p className='text-stone-500 text-lg leading-relaxed'>
              Beklager, men siden du leter etter eksisterer ikke eller har blitt
              flyttet.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
            <Button
              asChild
              size='lg'
              className='rounded-full px-8 bg-emerald-900 hover:bg-emerald-800 text-white'
            >
              <Link href='/'>
                <Home className='w-4 h-4 mr-2' />
                Til forsiden
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
              size='lg'
              className='rounded-full px-8 bg-white'
            >
              <Link href='/buyer/requests'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                Kjøp bil
              </Link>
            </Button>
          </div>

          <p className='text-sm text-stone-400 pt-8'>
            Trenger du hjelp?{' '}
            <Link href='/' className='text-emerald-700 hover:underline'>
              Kontakt oss
            </Link>
          </p>
        </div>
      </main>

      <footer className='border-t border-stone-200 py-6'>
        <div className='mx-auto max-w-7xl px-4 text-center text-sm text-stone-400'>
          © {new Date().getFullYear()} AutoAnbud AS. Alle rettigheter reservert.
        </div>
      </footer>
    </div>
  );
}
