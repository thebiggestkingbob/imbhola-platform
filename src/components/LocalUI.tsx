import type { ReactNode } from 'react';
import Link from 'next/link';
import LocalForm from './LocalForm';
import { reviewWorkspaceEnabled } from '@/local/mode';

export function Input({ name, label, value, type = 'text', optional = false }: {
  name: string; label: string; value?: string; type?: string; optional?: boolean;
}) {
  return <label>{label}<input name={name} type={type} defaultValue={value} required={!optional}
    minLength={type === 'password' ? 12 : undefined} maxLength={type === 'password' ? 256 : 500}
    min={type === 'number' ? '0' : undefined} step={type === 'number' ? '.01' : undefined}/></label>;
}

export function Select({ name, label, choices, value = '', optional = false }: {
  name: string; label: string; choices: readonly (readonly [string,string])[]; value?: string; optional?: boolean;
}) {
  return <label>{label}<select name={name} defaultValue={value} required={!optional}>
    <option value="">{optional ? 'None' : 'Choose an option'}</option>
    {choices.map(([id,text]) => <option key={id} value={id}>{text}</option>)}
  </select></label>;
}

export function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  if (!rows.length) return <p>No records yet.</p>;
  return <div className="table-scroll"><table className="workspace-table">
    <thead><tr>{columns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{rows.map((row,index) => <tr key={index}>{row.map((cell,i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function WorkspaceShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="container workspace">
    <div className="workspace-top">
      <Link className="text-link" href="/dashboard">Workspaces</Link>
      <LocalForm fields={{task:'logout'}} label="Sign out"/>
    </div>
    <p className="eyebrow">{reviewWorkspaceEnabled() ? 'IMBHOLA PRIVATE REVIEW' : 'IMBHOLA LOCAL WORKSPACE'}</p>
    <h1>{title}</h1>
    <p className="lead">{subtitle}</p>
    {children}
  </main>;
}

export const rand = new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'});
