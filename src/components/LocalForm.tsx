'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { workspaceAction } from '@/local/actions';

export default function LocalForm({ fields, children, label, importForm = false }: {
  fields: Record<string,string>; children?: ReactNode; label: string; importForm?: boolean;
}) {
  const [state,action,pending] = useActionState(workspaceAction,{});
  const [csv,setCsv] = useState('');
  const [previewCsv,setPreviewCsv] = useState('');
  const [fileError,setFileError] = useState('');
  const showImportResult = importForm && previewCsv === csv && !fileError;
  return <form action={action} className="workspace-form">
    {Object.entries(fields).map(([key,value]) => <input key={key} name={key} value={value} type="hidden" />)}
    {children}
    {importForm && <>
      <label>Choose CSV <input type="file" accept=".csv,text/csv" onChange={async event => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        if (!file) return;
        setPreviewCsv('');
        setCsv('');
        if (file.size > 250_000) {
          setFileError('Choose a CSV file up to 250 KB.');
          return;
        }
        try {
          const content = await file.text();
          if (input.files?.[0] === file) {
            setCsv(content);
            setFileError('');
          }
        } catch {
          if (input.files?.[0] === file) setFileError('The selected CSV could not be read.');
        }
      }}/></label>
      <label>CSV contents<textarea name="csv" value={csv} onChange={event => {
        setCsv(event.target.value);
        setFileError('');
      }} required maxLength={250000}/></label>
    </>}
    <div className="form-actions">
      <button className="button button-small" disabled={pending} name="intent" value="preview" onClick={() => setPreviewCsv(csv)}>{label}</button>
      {showImportResult && !!state.entries?.length && !state.errors?.length && !state.message?.endsWith('imported.') &&
        <button className="button button-small" disabled={pending} name="intent" value="commit">Commit import</button>}
    </div>
    <div aria-live="polite">
      {fileError && <p className="form-error">{fileError}</p>}
      {(!importForm || showImportResult) && state.error && <p className="form-error">{state.error}</p>}
      {(!importForm || showImportResult) && state.message && <p>{state.message}</p>}
      {showImportResult && !!state.errors?.length && <details open><summary>CSV error report ({state.errors.length})</summary>
        <p><a download="workforce-import-errors.txt" href={'data:text/plain;charset=utf-8,' + encodeURIComponent(state.errors.join('\n'))}>Download error report</a></p>
        <ol>{state.errors.map(error => <li key={error}>{error}</li>)}</ol>
      </details>}
      {showImportResult && !!state.entries?.length && !state.message?.endsWith('imported.') && <ul>
        {state.entries.map(entry => <li key={entry.number}>{entry.number} · {entry.name} · {entry.job}</li>)}
      </ul>}
    </div>
  </form>;
}
