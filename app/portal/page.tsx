import { redirect } from 'next/navigation';
import { getPortalIdentity } from '@/lib/portal-auth';
import Portal from './portal';
import { portalDestination } from '@/lib/portal-destination';
export const dynamic='force-dynamic';
export default async function PortalPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 if(!await getPortalIdentity()){
  const params=await searchParams;
  const query=new URLSearchParams();
  for(const key of ['view','notifications','project','detail','type'])if(typeof params[key]==='string')query.set(key,params[key]);
  const next=portalDestination(`/portal?${query}`);
  redirect(next==='/portal'?'/login':`/login?next=${encodeURIComponent(next)}`);
 }
 return <Portal/>;
}
