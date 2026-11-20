import { redirect } from 'next/navigation';
import { getPortalIdentity } from '@/lib/portal-auth';
import Portal from './portal';
export const dynamic='force-dynamic';
export default async function PortalPage(){
 if(!await getPortalIdentity())redirect('/login');
 return <Portal/>;
}
