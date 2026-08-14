import { useState } from 'react';
import type { DayRecord } from '../types';
import { buildExportJSON, shareOrDownload } from '../lib/exportData';

interface Props {
  days: DayRecord[];
}

export function ExportPanel({ days }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const json = buildExportJSON(days);

  async function handleShare() {
    setStatus(null);
    const outcome = await shareOrDownload(json);
    if (outcome === 'shared') setStatus('Shared.');
    else if (outcome === 'downloaded') setStatus('Downloaded as a .json file.');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setStatus('Copied to clipboard.');
    } catch {
      setStatus('Could not access the clipboard — use "Show raw JSON" below and copy manually.');
    }
  }

  if (days.length === 0) return null;

  return (
    <div className="section">
      <h2 className="section-title">Export</h2>
      <div className="card">
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
          Back up all {days.length} {days.length === 1 ? 'day' : 'days'} as JSON in the same format you import — handy
          before reinstalling the app or moving to a new phone.
        </p>
        <div className="import-actions">
          <button className="btn btn-primary" onClick={handleShare}>
            Share / Save file
          </button>
          <button className="btn" onClick={handleCopy}>
            Copy to clipboard
          </button>
          <button className="btn" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? 'Hide raw JSON' : 'Show raw JSON'}
          </button>
        </div>
        {status && (
          <div className="import-feedback success" style={{ marginTop: 12 }}>
            {status}
          </div>
        )}
        {showRaw && <textarea className="import-textarea" style={{ marginTop: 12 }} readOnly value={json} onFocus={(e) => e.target.select()} />}
      </div>
    </div>
  );
}
