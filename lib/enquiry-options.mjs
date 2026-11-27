export const BILL_RANGES = [
  {value:'under-1500',label:'Less than ₹1500'},
  {value:'1500-2500',label:'₹1500 – ₹2500'},
  {value:'2500-4000',label:'₹2500 – ₹4000'},
  {value:'4000-8000',label:'₹4000 – ₹8000'},
  {value:'over-8000',label:'More than ₹8000'},
];

export function billRangeFor(amount) {
  if (!(amount > 0)) return '';
  return amount < 1500 ? 'under-1500' : amount <= 2500 ? '1500-2500' : amount <= 4000 ? '2500-4000' : amount <= 8000 ? '4000-8000' : 'over-8000';
}

const enquiryInterests = {
  quote: 'Requested a free solar quotation.',
  'site-visit': 'Requested a free site visit. Please contact the customer to arrange the survey.',
  'solar-system': 'Interested in installing a solar system. Please discuss the site and requirements.',
  products: 'Interested in solar product prices and details.',
  panels: 'Interested in solar panels: prices and available models.',
  inverters: 'Interested in solar inverters: prices and compatibility.',
  'solar-kits': 'Interested in solar kits and complete systems.',
  callback: 'Requested a callback from the Samerika solar team.',
};

export function enquiryInitialValues(params) {
  const program = params.program === 'pm-surya-ghar';
  const property = !program && ['Residential','Commercial','Industrial'].includes(params.property) ? params.property : 'Residential';
  const amount = typeof params.monthlyBill === 'string' && /^\d{1,9}$/.test(params.monthlyBill) ? Number(params.monthlyBill) : 0;
  return {
    initialProperty: property,
    initialMonthlyBill: amount > 0 && amount <= 100000000 ? amount : 0,
    initialPin: typeof params.pin === 'string' && /^[1-9]\d{5}$/.test(params.pin) ? params.pin : '',
    initialRemarks: program ? 'Interested in PM Surya Ghar – Muft Bijli Yojana for residential rooftop solar.' : (typeof params.interest === 'string' && Object.hasOwn(enquiryInterests, params.interest) ? enquiryInterests[params.interest] : ''),
  };
}
