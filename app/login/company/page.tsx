import LoginForm from '../login-form';
import {localPortalAuth} from '@/lib/portal-auth';
export const dynamic='force-dynamic';
export default function CompanySignIn(){return <LoginForm portal="company" local={localPortalAuth()}/>}
