export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'santri') {
    if (session.user.isFirstLogin) {
      redirect('/ganti-password');
    }
    redirect('/santri');
  }

  redirect('/bendahara');
}
