import type {Metadata} from 'next';
import LoginForm from '../login-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Partner login | Samerika Power Private Limited',
  description: 'Sign in to your Samerika Power partner workspace to follow referrals, projects and approved earnings.',
};

export default function PartnerSignIn() {
  return <LoginForm portal="agent"/>;
}
