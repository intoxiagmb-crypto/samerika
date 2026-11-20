import LoginForm from '../login-form';
import {localPortalAuth} from '@/lib/portal-auth';
export const dynamic='force-dynamic';
export default function AgentSignIn(){return <LoginForm portal="agent" local={localPortalAuth()}/>}
