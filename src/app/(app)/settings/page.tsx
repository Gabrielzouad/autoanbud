import Link from 'next/link';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Building2, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default async function SettingsPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);

  // Determine the back link based on user's role
  const backHref = profile.role === 'dealer' ? '/dealer/requests' : '/buyer/requests';

  return (
    <div className='min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <div>
          <Button variant='ghost' asChild className='mb-4'>
            <Link href={backHref} className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Tilbake
            </Link>
          </Button>
          <h1 className='text-3xl font-bold font-serif text-stone-900'>Innstillinger</h1>
          <p className='text-stone-600 mt-2'>Administrer din profil og kontoinnstillinger</p>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <User className='h-5 w-5 text-emerald-700' />
              Brukerinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium text-stone-500'>Navn</label>
                <p className='text-stone-900'>
                  {user.displayName || user.id.slice(0, 8) || 'Ikke oppgitt'}
                </p>
              </div>
              <Separator />
              <div>
                <label className='text-sm font-medium text-stone-500 flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  E-post
                </label>
                <p className='text-stone-900'>{user.primaryEmail || 'Ikke oppgitt'}</p>
              </div>
              <Separator />
              <div>
                <label className='text-sm font-medium text-stone-500 flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  Telefon
                </label>
                <p className='text-stone-900'>{profile.phone || 'Ikke oppgitt'}</p>
              </div>
              <Separator />
              <div>
                <label className='text-sm font-medium text-stone-500'>Rolle</label>
                <div className='mt-1'>
                  <Badge variant='outline' className='capitalize'>
                    {profile.role === 'buyer' ? 'Kjøper' : 'Forhandler'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dealership Card (if user has dealership) */}
        {dealerships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Building2 className='h-5 w-5 text-emerald-700' />
                Forhandlerinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {dealerships.map((dealership) => (
                <div key={dealership.id} className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-stone-500'>Forhandlernavn</label>
                    <p className='text-stone-900 font-medium'>{dealership.name}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className='text-sm font-medium text-stone-500'>Sted</label>
                    <p className='text-stone-900'>{dealership.city || 'Ikke oppgitt'}</p>
                  </div>
                  <Separator />
                  <div>
                    <label className='text-sm font-medium text-stone-500'>Org.nr</label>
                    <p className='text-stone-900'>{dealership.orgNumber || 'Ikke oppgitt'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Kontoinformasjon</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-stone-500'>Konto ID</label>
              <p className='text-stone-900 font-mono text-sm'>{user.id}</p>
            </div>
            <Separator />
            <div>
              <label className='text-sm font-medium text-stone-500'>Medlem siden</label>
              <p className='text-stone-900'>
                {new Intl.DateTimeFormat('nb-NO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(profile.createdAt))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
