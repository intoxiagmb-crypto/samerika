// Keep customer records available for project profiles and quotations, but show
// only customers without a current project in the lead inbox.
/** @template T @param {T[]} leads @returns {T[]} */
export function leadInbox(leads, projects) {
  const projectCustomers = new Set(projects.filter(project => !project.data?.deletedAt).map(project => project.lead_id));
  return leads.filter(lead => !projectCustomers.has(lead.id));
}
