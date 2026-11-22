'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { workspaceAction } from '@/local/actions';

export default function LocalForm({ fields, children, label, importForm = false }: {
  fields: Record<string,string>; children?: ReactNode; label: string; importForm?: boolean;
}) {
  const [state,action,pending] = useActionState(workspaceAction,{});
  const [csv,setCsv] = useState('');
  const [previewCsv,setPreviewCsv] = useState('');
  return <form action={action} className="workspace-form">
    {Object.entries(fields).map(([key,value]) => <input key={key} name={key} value={value} type="hidden" />)}
    {children}
    {importForm && <>
      <label>Choose CSV <input type="file" accept=".csv,text/csv" onChange={async event => {
        const file = event.currentTarget.files?.[0];
        setCsv(file && file.size <= 250_000 ? await file.text() : '');
      }}/></label>
      <label>CSV contents<textarea name="csv" value={csv} onChange={event => setCsv(event.target.value)} required maxLength={250000}/></label>
    </>}
    <div className="form-actions">
      <button className="button button-small" disabled={pending} name="intent" value="preview" onClick={() => setPreviewCsv(csv)}>{label}</button>
      {importForm && previewCsv === csv && !!state.entries?.length && !state.errors?.length && !state.message?.endsWith('imported.') &&
        <button className="button button-small" disabled={pending} name="intent" value="commit">Commit import</button>}
    </div>
    <div aria-live="polite">
      {state.error && <p className="form-error">{state.error}</p>}
      {state.message && <p>{state.message}</p>}
      {!!state.errors?.length && <details open><summary>CSV error report ({state.errors.length})</summary>
        <ol>{state.errors.map(error => <li key={error}>{error}</li>)}</ol>
      </details>}
      {!!state.entries?.length && !state.message?.endsWith('imported.') && <ul>
        {state.entries.map(entry => <li key={entry.number}>{entry.number} · {entry.name} · {entry.job}</li>)}
      </ul>}
    </div>
  </form>;
}
