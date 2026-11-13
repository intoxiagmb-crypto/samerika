import { requireChatGPTUser } from '../chatgpt-auth';
import Portal from './portal';
export const dynamic='force-dynamic';
export default async function PortalPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;const query=new URLSearchParams();for(const key of ['view','new','join','type']){const value=params[key];if(typeof value==='string')query.set(key,value);}await requireChatGPTUser('/portal'+(query.size?'?'+query.toString():''));return <Portal/>}
