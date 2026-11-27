import EnquiryDialog from '@/app/enquiry/enquiry-dialog';
import { enquiryInitialValues } from '@/lib/enquiry-options.mjs';
export default async function EnquiryModal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <EnquiryDialog intercepted welcome={params.welcome === '1'} {...enquiryInitialValues(params)}/>;
}
