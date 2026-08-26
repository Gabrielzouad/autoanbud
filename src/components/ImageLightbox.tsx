'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ImageLightboxProps = {
  images: string[];
  activeIndex: number | null;
  alt: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function ImageLightbox({
  images,
  activeIndex,
  alt,
  onClose,
  onPrevious,
  onNext,
}: ImageLightboxProps) {
  if (activeIndex === null || !images[activeIndex]) return null;

  return (
    <div className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4'>
      <button
        type='button'
        className='absolute top-4 right-4 text-white hover:text-emerald-200'
        onClick={onClose}
      >
        <X className='h-6 w-6' />
      </button>

      <div className='absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20'>
        {activeIndex + 1} / {images.length}
      </div>

      {activeIndex > 0 ? (
        <button
          type='button'
          className='absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-emerald-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 shadow-lg'
          onClick={onPrevious}
        >
          <ChevronLeft className='h-6 w-6' />
        </button>
      ) : null}

      {activeIndex < images.length - 1 ? (
        <button
          type='button'
          className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-emerald-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 shadow-lg'
          onClick={onNext}
        >
          <ChevronRight className='h-6 w-6' />
        </button>
      ) : null}

      <div className='max-w-5xl w-full max-h-[80vh]'>
        <div className='relative w-full h-full aspect-video bg-black/40 rounded-lg overflow-hidden'>
          <Image
            src={images[activeIndex]}
            alt={alt}
            fill
            unoptimized
            className='object-contain'
          />
        </div>
      </div>
    </div>
  );
}
