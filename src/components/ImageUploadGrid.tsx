'use client';

import Image from 'next/image';
import { Upload, X } from 'lucide-react';

import { NoImageAvailable } from '@/components/NoImageAvailable';
import { cn } from '@/lib/utils';

export type ImageUploadStatus = 'uploading' | 'ready' | 'error';

export type ImageUploadGridItem = {
  id: string;
  name: string;
  previewUrl: string;
  status: ImageUploadStatus;
  error?: string;
};

type ImageUploadGridProps<TImage extends ImageUploadGridItem> = {
  images: TImage[];
  altPrefix: string;
  className?: string;
  tileClassName?: string;
  imageClassName?: string;
  removeButtonClassName?: string;
  removeLabel?: string;
  showFileName?: boolean;
  errorMode?: 'inline' | 'overlay';
  addTileLabel?: string;
  addTileClassName?: string;
  onAddClick?: () => void;
  onRemove: (index: number) => void;
  onRetry?: (image: TImage) => void;
};

export function ImageUploadGrid<TImage extends ImageUploadGridItem>({
  images,
  altPrefix,
  className,
  tileClassName,
  imageClassName,
  removeButtonClassName,
  removeLabel,
  showFileName = false,
  errorMode = 'inline',
  addTileLabel,
  addTileClassName,
  onAddClick,
  onRemove,
  onRetry,
}: ImageUploadGridProps<TImage>) {
  if (images.length === 0 && !onAddClick) return null;

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className={cn(
            'relative group overflow-hidden border border-stone-200 bg-stone-100',
            tileClassName,
          )}
        >
          {image.previewUrl ? (
            <Image
              src={image.previewUrl}
              alt={`${altPrefix} ${index + 1}`}
              fill={!showFileName}
              width={showFileName ? 240 : undefined}
              height={showFileName ? 112 : undefined}
              unoptimized
              className={cn('object-cover', imageClassName)}
            />
          ) : (
            <NoImageAvailable />
          )}

          {showFileName ? (
            <div className='p-2 space-y-1'>
              <p className='text-xs truncate text-stone-600'>{image.name}</p>
              <p className='text-[11px] text-stone-500'>
                {getStatusLabel(image.status)}
              </p>
              {image.status === 'error' && onRetry ? (
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    onRetry(image);
                  }}
                  className='text-[11px] font-medium text-emerald-700 underline underline-offset-2'
                >
                  Prøv igjen
                </button>
              ) : null}
            </div>
          ) : (
            <div className='absolute bottom-0 left-0 right-0 bg-black/65 px-2 py-1 text-[11px] text-white'>
              {image.status === 'error' && errorMode === 'inline' && onRetry ? (
                <div className='flex items-center justify-between gap-2'>
                  <span className='truncate'>
                    {image.error ?? 'Feil ved opplasting'}
                  </span>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation();
                      onRetry(image);
                    }}
                    className='shrink-0 font-medium underline underline-offset-2'
                  >
                    Prøv igjen
                  </button>
                </div>
              ) : (
                getStatusLabel(image.status)
              )}
            </div>
          )}

          {image.status === 'error' && errorMode === 'overlay' && onRetry ? (
            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation();
                onRetry(image);
              }}
              className='absolute inset-x-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-medium text-stone-900 shadow'
            >
              Prøv igjen
            </button>
          ) : null}

          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation();
              onRemove(index);
            }}
            className={cn(
              'absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600',
              removeButtonClassName,
            )}
          >
            {removeLabel ?? <X className='h-4 w-4' />}
          </button>
        </div>
      ))}

      {onAddClick ? (
        <button
          type='button'
          onClick={onAddClick}
          className={cn(
            'aspect-square rounded-lg border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-stone-500 hover:text-emerald-600',
            addTileClassName,
          )}
        >
          <Upload className='h-6 w-6' />
          <span className='text-xs font-medium'>
            {addTileLabel ?? 'Legg til bilder'}
          </span>
        </button>
      ) : null}
    </div>
  );
}

function getStatusLabel(status: ImageUploadStatus) {
  if (status === 'uploading') return 'Laster opp...';
  if (status === 'ready') return 'Klar';
  return 'Feil';
}
