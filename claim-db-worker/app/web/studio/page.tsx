import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StudioClient from './StudioClient';

export default async function StudioPage() {
  const cookieStore = await cookies();
  const dbInfoCookie = cookieStore.get('temp_db_info');
  
  if (!dbInfoCookie) {
    // Redirect to home or login page if no database info is found
    redirect('/');
  }

  let connectionString = '';
  try {
    const dbInfo = JSON.parse(dbInfoCookie.value);
    connectionString = dbInfo.connectionString || '';
  } catch (e) {
    console.error('Failed to parse database info:', e);
    redirect('/');
  }

  if (!connectionString) {
    redirect('/');
  }

  return <StudioClient connectionString={connectionString} />;
}
