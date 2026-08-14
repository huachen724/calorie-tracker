import { useRef, useState } from 'react';
import type { DayRecord } from '../types';
import { parseDietLogJSON } from '../lib/validate';
import { SAMPLE_JSON } from '../lib/sampleData';

interface Props {
  onImport: (days: DayRecord[]) => Promise<void>;
}

type Feedback = { kind: 'success' | 'warning' | 'error'; summary: string; errors: string[] };

export function ImportPanel({ onImport }: Props) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    const result = parseDietLogJSON(text);
    if (result.days.length === 0) {
      setFeedback({ kind: 'error', summary: 'Nothing was imported.', errors: result.errors });
      return;
    }
    setBusy(true);
    try {
      await onImport(result.days);
      const dayWord = result.days.length === 1 ? 'day' : 'days';
      setFeedback({
        kind: result.errors.length > 0 ? 'warning' : 'success',
        summary: `Imported ${result.days.length} ${dayWord}${result.skipped ? ` (${result.skipped} skipped)` : ''}.`,
        errors: result.errors,
      });
      setText('');
    } finally {
      setBusy(false);
    }
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  return (
    <div className="section">
      <h2 className="section-title">Import a diet log</h2>
      <div className="card">
        <label className="field-label" htmlFor="json-input">
          Paste JSON — one day, or many days in one object. Multiple JSON blocks pasted together are merged automatically.
        </label>
        <textarea
          id="json-input"
          className="import-textarea"
          placeholder='{ "2026-08-13": { "items": [...], "daily_totals": {...} } }'
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="import-actions">
          <button className="btn btn-primary" onClick={handleImport} disabled={busy || !text.trim()}>
            {busy ? 'Importing…' : 'Import'}
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            Upload .json file
          </button>
          <button className="btn" onClick={() => setText(SAMPLE_JSON)}>
            Load sample
          </button>
          {text && (
            <button className="btn" onClick={() => setText('')}>
              Clear
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        {feedback && (
          <div className={`import-feedback ${feedback.kind}`}>
            <strong>{feedback.summary}</strong>
            {feedback.errors.length > 0 && (
              <ul>
                {feedback.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
