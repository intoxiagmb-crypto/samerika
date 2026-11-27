import { Eye } from 'lucide-react';

export default function DocumentPreviewLink({ id, name }: { id: string; name: string }) {
  return <a className="document-preview-link" href={`/api/files?id=${encodeURIComponent(id)}&preview=1`} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${name} (opens in a new tab)`} title={`Preview ${name}`}>
    <Eye size={18} aria-hidden="true"/><span>Preview</span>
  </a>;
}
