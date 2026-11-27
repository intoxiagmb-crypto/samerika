type Progress = { label: string; status: string; text: string; completed: number; total: number };
export default function ProjectStatus({ progress }: { progress: Progress }) {
 const tone = ['Completed', 'Cash'].includes(progress.status) ? 'done' : ['Rejected', 'Hold / Rejected', 'Correction Required', 'Failed', 'Cancelled'].includes(progress.status) ? 'held' : 'pending';
 return <span className={`project-current-status is-${tone}`} title={`${progress.completed} of ${progress.total} timeline steps completed`}><span aria-hidden="true"/>{progress.text}</span>;
}
