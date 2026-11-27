// Only the latest upload of each required category represents its current review.
export function requiredProjectDocuments(required, records) {
 const documents=records.filter(record=>record.kind==='document').slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))||b.id.localeCompare(a.id));
 return required.map(name=>documents.find(record=>record.data.documentType===name));
}
export function documentationStatus(documents, saved={}) {
 if(documents.length&&documents.every(document=>document?.status==='Verified'))return 'Completed';
 if(saved.status==='Processing'||documents.some(document=>document?.status==='Under Review'))return 'Processing';
 return 'Pending';
}
