import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PHASES, ROLES, LEAD_STATUSES } from '../lib/policy.mjs';

// Render the real TSX components in Node without a browser or an added test framework.
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const modules = new Map();
function component(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const loaded = { exports: {} };
  modules.set(filename, loaded.exports);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const localRequire = specifier => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return require(specifier);
    const path = specifier.startsWith('@/') ? resolve(root, specifier.slice(2)) : resolve(dirname(filename), specifier);
    return existsSync(path) ? require(path) : component(existsSync(`${path}.ts`) ? `${path}.ts` : `${path}.tsx`);
  };
  runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const Tracker = component(resolve(root, 'components/application-tracker.tsx')).default;
const Timeline = component(resolve(root, 'components/project-timeline.tsx')).default;
const project = {
  id: 'SOL-TEST', version: 1, status: 'Survey',
  data: { name: 'Test customer', capacity: 3, system: 'On-grid', city: 'Jaipur', finance: 'Finance',
    tracking: { applicationNumber: 'APP-123' }, requiredApprovals: ['Bank approval'],
    phases: PHASES.map(name => ({ name, status: 'Pending' })) },
};
const shared = { records: [], requiredDocuments: ['Electricity bill'] };

test('application tracking displays project status without mutation controls for every role', () => {
  for (const role of ROLES) {
    const html = renderToStaticMarkup(React.createElement(Tracker, {
      ...shared, projects: [project], role, selectedId: project.id, saving: false,
      onSelect() {}, onDetails() {}, onRefresh: async () => {},
    }));
    assert.match(html, /APP-123/);
    assert.match(html, /Site Survey/);
    assert.match(html, /Pending/);
    assert.equal((html.match(/<select/g) || []).length, 1, `${role}: only the project selector is allowed`);
    assert.doesNotMatch(html, /<input|<textarea|Edit application number|Complete project|Upload document|Notes \/ reference/);
  }
});

test('project timeline retains authorized editing while tracking is read-only', () => {
  const html = renderToStaticMarkup(React.createElement(Timeline, {
    ...shared, project, role: 'ADMIN', saving: false, error: '', onUpdate: async () => {}, onUpload: async () => {},
  }));
  assert.match(html, /<select aria-label="Site Survey status"/);
  assert.match(html, /Upload documentation/);
  assert.match(html, /Complete project/);
});


test('coloured lead status picker preserves the named form value and accessible label', () => {
  const StatusSelect = component(resolve(root, 'components/lead-status-select.tsx')).default;
  for (const status of LEAD_STATUSES) {
    const html = renderToStaticMarkup(React.createElement('form', null, React.createElement(StatusSelect, {
      label: 'Lead status', name: 'status', defaultValue: status, required: true,
      options: LEAD_STATUSES.map(value => ({ value, label: value })),
    })));
    assert.match(html, /role="combobox"/);
    assert.match(html, /aria-label="Lead status"/);
    assert.match(html, /<input type="hidden" name="status"/);
    assert.ok(html.includes(`name="status" value="${status}"`), `${status} must be submitted with the form`);
  }
});

test('quotation previews show the saved tax mode on each item and retain historical tax labels',async()=>{
 const {itemQuoteTotal}=await import('../lib/quotation.mjs');
 const Document=component(resolve(root,'components/quotation-document.tsx')).default;
 const totals=itemQuoteTotal([
  {name:'Included panel',unitPrice:11800,quantity:1,taxRate:18,priceTaxMode:'inclusive'},
  {name:'Excluded service',unitPrice:10000,quantity:1,taxRate:5,priceTaxMode:'exclusive'},
 ]);
 const data={...totals,customer:'Test customer',company:{name:'Samerika Power'},taxMode:'CGST_SGST'};
 const html=renderToStaticMarkup(React.createElement(Document,{quote:{id:'QUOTE-MIXED',data},settings:{}}));
 assert.match(html,/Tax follows each product/);
 const rows=html.match(/<tr>.*?<\/tr>/g);
 assert.ok(rows.some(row=>row.includes('Included panel')&&row.includes('118.00')&&row.includes('Tax Included')));
 assert.ok(rows.some(row=>row.includes('Excluded service')&&row.includes('105.00')&&row.includes('Tax Excluded')));
 assert.match(html,/223.00/);
 const historical=itemQuoteTotal([{name:'Old included panel',unitPrice:11800,quantity:1,taxRate:18}],{priceTaxMode:'inclusive'});
 delete historical.items[0].priceTaxMode;
 const oldHtml=renderToStaticMarkup(React.createElement(Document,{quote:{data:{...data,...historical}},settings:{}}));
 assert.match(oldHtml,/Tax Included/);assert.doesNotMatch(oldHtml,/Tax Excluded/);
});

test('quote enquiry shows five accessible bill choices and preserves valid planner defaults',async()=>{
 const {enquiryInitialValues,billRangeFor}=await import('../lib/enquiry-options.mjs');
 const Form=component(resolve(root,'app/enquiry/enquiry-form.tsx')).default;
 const defaults=enquiryInitialValues({property:'Commercial',monthlyBill:'4500',pin:'302001'});
 const html=renderToStaticMarkup(React.createElement(Form,defaults));
 assert.equal((html.match(/type="radio"/g)||[]).length,5);
 assert.match(html,/WhatsApp Number/);assert.match(html,/Village \/ City Name/);assert.match(html,/Submit Details/);
 assert.match(html,/value="4000-8000"/);assert.match(html,/4,500/);
 assert.match(html,/name="property" value="Commercial"/);assert.match(html,/name="pin" value="302001"/);
 assert.match(html,/type="checkbox"[^>]*required=""[^>]*name="contactConsent"/);
 assert.equal(billRangeFor(1499),'under-1500');assert.equal(billRangeFor(1500),'1500-2500');
 assert.equal(billRangeFor(2500),'1500-2500');assert.equal(billRangeFor(4000),'2500-4000');assert.equal(billRangeFor(8000),'4000-8000');assert.equal(billRangeFor(8001),'over-8000');
 assert.deepEqual(enquiryInitialValues({property:'unknown',monthlyBill:'-1',pin:'bad'}),{initialProperty:'Residential',initialMonthlyBill:0,initialPin:'',initialRemarks:''});
 assert.equal(enquiryInitialValues({program:'pm-surya-ghar',property:'Commercial'}).initialProperty,'Residential');
});

test('homepage consultation uses the same enquiry form with bill dropdown and optional PIN',()=>{
 const Form=component(resolve(root,'app/enquiry/enquiry-form.tsx')).default;
 const html=renderToStaticMarkup(React.createElement(Form,{consultation:true,initialPin:'302001'}));
 assert.match(html,/Book a FREE Consultation/);
 assert.match(html,/<select[^>]*name="monthlyBillRange"[^>]*required=""/);
 assert.doesNotMatch(html,/type="radio"/);
 assert.match(html,/PIN Code \(optional\)/);assert.match(html,/value="302001"/);
 assert.match(html,/Village \/ City Name/);assert.match(html,/name="contactConsent"/);
});
