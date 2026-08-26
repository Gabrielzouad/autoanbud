import type React from 'react';
import { Car, Check, ChevronLeft, ChevronRight, Search, Upload } from 'lucide-react';

import { ImageUploadGrid } from '@/components/ImageUploadGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { UploadedImage } from './request-form-model';

type SearchType = 'specific' | 'general' | null;

type Step = {
  number: number;
  title: string;
};

export function DraftRestoredBanner({ onClear }: { onClear: () => void }) {
  return (
    <div className='rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <span>En lagret kladd ble hentet inn.</span>
        <button
          type='button'
          onClick={onClear}
          className='text-left font-medium underline underline-offset-4 sm:text-right'
        >
          Tøm lagret kladd
        </button>
      </div>
    </div>
  );
}

export function RequestFormProgress({
  steps,
  activeStep,
}: {
  steps: Step[];
  activeStep: number;
}) {
  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between relative z-10'>
        {steps.map((step) => {
          const isActive = step.number === activeStep;
          const isCompleted = step.number < activeStep;
          return (
            <div key={step.number} className='flex flex-col items-center gap-2'>
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white',
                  isActive
                    ? 'border-emerald-600 text-emerald-600 font-bold scale-110 shadow-emerald-100 shadow-lg'
                    : isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-stone-200 text-stone-400',
                )}
              >
                {isCompleted ? <Check className='w-5 h-5' /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive
                    ? 'text-emerald-900'
                    : isCompleted
                      ? 'text-emerald-700'
                      : 'text-stone-400',
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SearchTypeStep({
  searchType,
  onSelect,
}: {
  searchType: SearchType;
  onSelect: (searchType: Exclude<SearchType, null>) => void;
}) {
  return (
    <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
      <div className='text-center space-y-2'>
        <h2 className='text-2xl font-serif font-semibold text-stone-900'>
          Hva leter du etter?
        </h2>
        <p className='text-stone-500'>Velg hvordan du vil starte søket.</p>
      </div>

      <div className='grid md:grid-cols-2 gap-4 mt-8'>
        <SearchTypeButton
          active={searchType === 'specific'}
          icon={Car}
          iconClassName='bg-emerald-100 text-emerald-700'
          title='Spesifikk modell'
          description='Jeg vet hvilken bil jeg vil ha (f.eks. Volvo XC90)'
          onClick={() => onSelect('specific')}
        />
        <SearchTypeButton
          active={searchType === 'general'}
          icon={Search}
          iconClassName='bg-blue-100 text-blue-700'
          title='Generelt søk'
          description='Jeg er åpen for forslag (f.eks. "Elektrisk SUV under 600k")'
          onClick={() => onSelect('general')}
        />
      </div>
    </div>
  );
}

function SearchTypeButton({
  active,
  icon: Icon,
  iconClassName,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Car;
  iconClassName: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex flex-col items-center p-8 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]',
        active
          ? 'border-emerald-600 bg-emerald-50/50 shadow-md'
          : 'border-stone-200 bg-white hover:border-emerald-200 hover:shadow-sm',
      )}
    >
      <div className={cn('p-4 rounded-full mb-4', iconClassName)}>
        <Icon className='w-8 h-8' />
      </div>
      <h3 className='font-serif font-medium text-lg text-stone-900'>
        {title}
      </h3>
      <p className='text-sm text-stone-500 text-center mt-2'>{description}</p>
    </button>
  );
}

export function RequestFormNavigation({
  step,
  searchType,
  isUploading,
  isPending,
  onBack,
  onNext,
}: {
  step: number;
  searchType: SearchType;
  isUploading: boolean;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className='flex items-center justify-between mt-6 pt-6 border-t border-stone-100'>
      {step > 1 ? (
        <Button
          type='button'
          variant='outline'
          onClick={onBack}
          className='flex items-center gap-2 bg-transparent'
        >
          <ChevronLeft className='w-4 h-4' />
          Tilbake
        </Button>
      ) : (
        <div />
      )}

      {step < 4 ? (
        <Button
          type='button'
          onClick={onNext}
          disabled={step === 1 && !searchType}
          className='bg-emerald-900 hover:bg-emerald-800 text-white flex items-center gap-2 min-w-[120px]'
        >
          Neste
          <ChevronRight className='w-4 h-4' />
        </Button>
      ) : (
        <Button
          type='submit'
          data-final-submit='true'
          disabled={isUploading || isPending}
          className='bg-emerald-900 hover:bg-emerald-800 text-white flex items-center gap-2 min-w-[120px]'
        >
          {isPending ? 'Sender...' : 'Send inn forespørsel'}
          <Check className='w-4 h-4' />
        </Button>
      )}
    </div>
  );
}

export function ReferenceImagesStep({
  isDragging,
  fileInputRef,
  uploadError,
  images,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onRemove,
  onRetry,
}: {
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadError: string | null;
  images: UploadedImage[];
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onRetry: (image: UploadedImage) => void;
}) {
  return (
    <div className='space-y-6 animate-in fade-in slide-in-from-right-4 duration-300'>
      <div className='text-center space-y-2 mb-8'>
        <h2 className='text-2xl font-serif font-semibold text-stone-900'>
          Referansebilder
        </h2>
        <p className='text-stone-500'>
          Hjelp forhandlere å forstå hva du liker.
        </p>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
            : 'border-stone-200 hover:border-emerald-400 hover:bg-stone-50/50',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className='flex flex-col items-center gap-4'>
          <div className='p-4 bg-stone-100 rounded-full text-stone-500'>
            <Upload className='w-8 h-8' />
          </div>
          <div className='space-y-1'>
            <p className='text-lg font-medium text-stone-900'>
              Slipp bilder her eller klikk for å laste opp
            </p>
            <p className='text-sm text-stone-500'>JPG eller PNG (maks 5MB)</p>
          </div>
          <Input
            id='images'
            type='file'
            multiple
            className='hidden'
            ref={fileInputRef}
            onChange={onFileChange}
            accept='image/*'
          />
        </div>
      </div>

      {uploadError ? <p className='text-sm text-red-600'>{uploadError}</p> : null}

      {images.length > 0 ? (
        <ImageUploadGrid
          images={images}
          altPrefix='Preview'
          className='mt-6'
          tileClassName='aspect-square rounded-lg'
          onRemove={onRemove}
          onRetry={onRetry}
        />
      ) : null}
    </div>
  );
}
