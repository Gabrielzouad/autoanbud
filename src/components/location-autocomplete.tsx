'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function search() {
      if (value.trim().length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/location-search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { suggestions?: string[] };
        const nextSuggestions = data.suggestions ?? [];
        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }

    const timeout = window.setTimeout(search, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative' ref={containerRef}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        placeholder={placeholder}
        autoComplete='off'
      />

      {loading ? (
        <p className='mt-1 text-xs text-stone-500'>Søker...</p>
      ) : null}

      {open ? (
        <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg'>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type='button'
              className={cn(
                'block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50',
                suggestion === value && 'bg-emerald-50 text-emerald-800',
              )}
              onClick={() => {
                onChange(suggestion);
                setOpen(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
