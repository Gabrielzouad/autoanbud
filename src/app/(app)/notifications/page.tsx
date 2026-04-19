import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { Bell, Check, MessageSquare } from 'lucide-react';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { listNotificationsForUser } from '@/lib/services/notifications';
import { markAllNotificationsReadAction } from '@/app/actions/notifications';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function NotificationsPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: user.id });
  const notifications = await listNotificationsForUser(user.id);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className='min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-sm text-stone-500'>Varslinger</p>
            <h1 className='font-serif text-3xl font-semibold text-stone-900'>
              Dine varsler
            </h1>
            {unreadCount > 0 && (
              <p className='mt-1 text-sm text-emerald-600'>
                {unreadCount} uleste varsler
              </p>
            )}
          </div>
          <form action={markAllNotificationsReadAction}>
            <Button
              type='submit'
              variant='outline'
              className='border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
            >
              <Check className='mr-2 h-4 w-4' />
              Marker alle som lest
            </Button>
          </form>
        </div>

        {notifications.length === 0 ? (
          <Card className='border-dashed border-stone-200 bg-white'>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='mb-4 rounded-full bg-stone-100 p-4'>
                <Bell className='h-8 w-8 text-stone-400' />
              </div>
              <CardTitle className='font-serif text-lg text-stone-700'>
                Ingen varsler
              </CardTitle>
              <CardDescription className='mt-2 text-stone-500'>
                Du har ingen varsler akkurat nå.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={
                  'transition-all ' +
                  (notification.isRead
                    ? 'border-stone-200 bg-white'
                    : 'border-emerald-200 bg-emerald-50 shadow-md')
                }
              >
                <CardContent className='p-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex items-start gap-3'>
                      <div
                        className={`mt-0.5 rounded-full p-2 ${
                          notification.isRead
                            ? 'bg-stone-100'
                            : 'bg-emerald-100'
                        }`}
                      >
                        {notification.offerId ? (
                          <MessageSquare
                            className={`h-4 w-4 ${
                              notification.isRead
                                ? 'text-stone-500'
                                : 'text-emerald-600'
                            }`}
                          />
                        ) : (
                          <Bell
                            className={`h-4 w-4 ${
                              notification.isRead
                                ? 'text-stone-500'
                                : 'text-emerald-600'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            notification.isRead
                              ? 'text-stone-700'
                              : 'text-stone-900'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className='mt-1 text-sm text-stone-600'>
                          {notification.body}
                        </p>
                      </div>
                    </div>
                    <span className='text-xs text-stone-400'>
                      {format(
                        new Date(notification.createdAt),
                        'dd/MM/yyyy HH:mm',
                      )}
                    </span>
                  </div>

                  {notification.offerId && notification.requestId && (
                    <div className='mt-4 flex items-center gap-2 border-t border-stone-100 pt-4'>
                      <Link
                        href={
                          profile.role === 'dealer'
                            ? '/dealer/offers/' + notification.offerId
                            : '/buyer/requests/' +
                              notification.requestId +
                              '/offers/' +
                              notification.offerId
                        }
                        className='inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 transition hover:text-emerald-900'
                      >
                        <MessageSquare className='h-4 w-4' />
                        Åpne samtalen
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
