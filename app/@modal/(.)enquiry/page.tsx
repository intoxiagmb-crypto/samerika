import EnquiryDialog from '@/app/enquiry/enquiry-dialog';
import { enquiryHeading, enquiryInitialValues } from '@/lib/enquiry-options.mjs';
export default async function EnquiryModal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <EnquiryDialog intercepted title={enquiryHeading(params)} welcome={params.welcome === '1'} {...enquiryInitialValues(params)}/>;
}
