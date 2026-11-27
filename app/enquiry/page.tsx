import type { Metadata } from 'next';
import HomePage from '../page';
import EnquiryDialog from './enquiry-dialog';
import { enquiryHeading, enquiryInitialValues } from '@/lib/enquiry-options.mjs';
export const metadata: Metadata = { title: 'Get a free solar quote | Samerika Power', description: 'Share your name, WhatsApp number, electricity bill range and village or city to start your solar enquiry.' };
export default async function EnquiryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <><HomePage/><EnquiryDialog title={enquiryHeading(params)} welcome={params.welcome === '1'} {...enquiryInitialValues(params)}/></>;
}
