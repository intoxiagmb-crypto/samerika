/** @type {Record<string, {backgroundColor: string, color: string}>} */
export const LEAD_STATUS_COLOURS = {
  New: { backgroundColor: '#b91c1c', color: '#ffffff' },
  'Project Back': { backgroundColor: '#ffd600', color: '#332600' },
  Assigned: { backgroundColor: '#1d4ed8', color: '#ffffff' },
  Contacted: { backgroundColor: '#0e7490', color: '#ffffff' },
  Interested: { backgroundColor: '#7e22ce', color: '#ffffff' },
  Qualified: { backgroundColor: '#0f766e', color: '#ffffff' },
  'Site Survey': { backgroundColor: '#075985', color: '#ffffff' },
  Quotation: { backgroundColor: '#4338ca', color: '#ffffff' },
  Converted: { backgroundColor: '#166534', color: '#ffffff' },
  'Follow-up Required': { backgroundColor: '#db2777', color: '#ffffff' },
  'On Hold': { backgroundColor: '#92400e', color: '#ffffff' },
  Lost: { backgroundColor: '#7f1d1d', color: '#ffffff' },
  Rejected: { backgroundColor: '#9f1239', color: '#ffffff' },
  Duplicate: { backgroundColor: '#475569', color: '#ffffff' },
  Cancelled: { backgroundColor: '#27272a', color: '#ffffff' },
};

export function leadStatusStyle(status) {
  const colour = LEAD_STATUS_COLOURS[status];
  return colour ? { ...colour, borderColor: colour.backgroundColor, fontWeight: 700 } : undefined;
}
