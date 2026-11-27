import { projectTimelineHistory } from '@/lib/project-history.mjs';
// Shared project snapshots retain both current and historical workflow records.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const date = (value?: string) => value ? new Date(value.length === 10 ? `${value}T00:00:00Z` : value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(value.length === 10 ? {} : { hour: '2-digit' as const, minute: '2-digit' as const }), timeZone: 'Asia/Kolkata' }) : 'Date not recorded';
export default function ProjectHistory({ project, records }: { project: Row; records: Row[] }) {
 const groups = projectTimelineHistory(project, records);
 if (!groups.length) return null;
 return <details className="project-update-history"><summary>Update history</summary>{groups.map(group => <details key={group.id}><summary>{group.label}{group.archived ? ' · Earlier tracking' : ''} ({group.entries.length})</summary><ol>{[...group.entries].reverse().map((entry: Row, index: number) => <li key={index}><strong>{entry.status}</strong><span>{entry.updatedBy || entry.by || 'Employee not recorded'} · {date(entry.eventDate || entry.at || entry.updatedAt)}</span>{entry.reference && <p>Reference: {entry.reference}</p>}{(entry.note || entry.evidence) && <p>{entry.note || entry.evidence}</p>}</li>)}</ol></details>)}</details>;
}
