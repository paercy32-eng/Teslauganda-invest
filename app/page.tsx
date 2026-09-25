import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export default async function RootPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      redirect('/(main)');
    }
  }

  redirect('/login');
}
