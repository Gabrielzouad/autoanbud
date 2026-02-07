'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { MessageSquare } from 'lucide-react';

import { sendOfferMessageAction } from '@/app/actions/messages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OfferMessageView } from '@/lib/services/offerMessages';
import { cn } from '@/lib/utils';

type OfferChatPanelProps = {
  offerId: string;
  viewerRole: 'dealer' | 'buyer';
  initialMessages: OfferMessageView[];
};

export function OfferChatPanel({ offerId, viewerRole, initialMessages }: OfferChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<Awaited<ReturnType<typeof sendOfferMessageAction>>>();
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await sendOfferMessageAction(undefined, formData);
      setStatus(result);

      if (result?.success) {
        setMessages((prev) => [...prev, result.message]);
        setDraft('');
      }
    });
  };

  const otherPartyLabel = useMemo(
    () => (viewerRole === 'dealer' ? 'Kjøper' : 'Forhandler'),
    [viewerRole],
  );

  return (
    <div className='border border-stone-200 rounded-xl overflow-hidden shadow-sm'>
      <div className='flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-white'>
        <MessageSquare className='h-5 w-5 text-emerald-700' />
        <div>
          <p className='text-sm font-semibold text-emerald-950'>Chat med {otherPartyLabel}</p>
          <p className='text-xs text-stone-500'>Del detaljer og avklar spørsmål direkte.</p>
        </div>
      </div>

      <div className='bg-stone-50 p-4 space-y-3 h-[320px] overflow-y-auto'>
        {messages.length === 0 ? (
          <div className='text-center text-sm text-stone-500 mt-6'>
            Ingen meldinger ennå. Start dialogen for å følge opp tilbudet.
          </div>
        ) : (
          messages.map((msg) => {
            const isMine =
              (viewerRole === 'dealer' && msg.senderRole === 'dealer') ||
              (viewerRole === 'buyer' && msg.senderRole === 'buyer');

            return (
              <div
                key={msg.id}
                className={cn('flex flex-col gap-1 max-w-xl', isMine ? 'ml-auto items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2 text-sm shadow-sm',
                    isMine
                      ? 'bg-emerald-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-800',
                  )}
                >
                  <p className='whitespace-pre-wrap leading-relaxed'>{msg.message}</p>
                </div>
                <span className='text-[11px] uppercase tracking-wide text-stone-400 font-semibold'>
                  {isMine ? 'Deg' : otherPartyLabel} ·{' '}
                  {new Intl.DateTimeFormat('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(msg.createdAt))}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className='p-4 space-y-3 border-t border-stone-100 bg-white'
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          handleSubmit(formData);
        }}
      >
        <input type='hidden' name='offerId' value={offerId} />
        <Textarea
          name='message'
          placeholder={`Skriv en melding til ${otherPartyLabel.toLowerCase()}...`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isPending}
          className='min-h-[88px]'
        />
        <div className='flex items-center justify-between text-xs text-stone-500'>
          <span>Maks 2000 tegn</span>
          {status?.success === false && <span className='text-red-600'>{status.error}</span>}
        </div>
        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={isPending || draft.trim().length === 0}
            className='bg-emerald-900 hover:bg-emerald-800 text-white'
          >
            {isPending ? 'Sender...' : 'Send melding'}
          </Button>
        </div>
      </form>
    </div>
  );
}
