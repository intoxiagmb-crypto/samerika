import Link from 'next/link';
import Image from 'next/image';
import { COMPANY_NAME } from '@/lib/brand';

export default function Brand({ className = '' }: { className?: string }) {
  return <Link href="/" className={`brand brand-link ${className}`} aria-label={`${COMPANY_NAME} home`}>
    <Image src="/brand/samerika-horizontal.svg" alt={COMPANY_NAME} width={1140} height={275} className="brand-logo" unoptimized priority/>
  </Link>;
}
