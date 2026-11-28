import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AppPageHeading({ title, description }: { title: string; description: string }) {
  return <header className="app-page-heading"><div><Link href="/" aria-label="Back to home"><ChevronLeft size={24}/></Link><h1>{title}</h1><span aria-hidden="true"/></div><p>{description}</p></header>;
}
