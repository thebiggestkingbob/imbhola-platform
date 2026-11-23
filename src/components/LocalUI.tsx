import { demoRuntimeEnabled } from '@/demo/config';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Building2, FileText, FolderOpen, GraduationCap, LayoutGrid, Menu, Settings, UsersRound } from 'lucide-react';
import Brand from './Brand';
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

export function Table({columns,rows,empty = 'No records yet.'}: {columns:string[];rows:ReactNode[][];empty?:string}) {
  if (!rows.length) return <p className="empty-state">{empty}</p>;
  return <div className="table-scroll"><table className="workspace-table" role="table">
    <thead><tr>{columns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{rows.map((row,index) => <tr key={index}>{row.map((cell,i) => <td key={i} data-label={columns[i]}>{cell ?? '—'}</td>)}</tr>)}</tbody>
  </table></div>;
}

const statusLabels: Record<string,string> = {review:'Awaiting review',approved:'Approved',returned:'Changes requested',signed:'Signed',draft:'Draft'};
const statusTones: Record<string,string> = {ready:'success',approved:'success',signed:'success',active:'success',paid:'success',
  review:'pending',warning:'pending',issued:'pending',returned:'danger',blocker:'danger',suspended:'danger'};

export function Status({value}:{value:string}) {
  const key = value.toLowerCase();
  return <span className={'status status-' + (statusTones[key] ?? 'neutral')}>{statusLabels[key] ?? value}</span>;
}

const icons = {overview:LayoutGrid,employee:UsersRound,plan:GraduationCap,training:GraduationCap,reports:FileText,evidence:FolderOpen,
  access:Settings,companies:Building2,billing:BriefcaseBusiness};
type Item = {key:string;label:string;href:string};

function WorkspaceLinks({items,active}:{items:Item[];active?:string}) {
  return items.map(item => {
    const Icon = icons[item.key as keyof typeof icons] ?? FolderOpen;
    return <Link key={item.key} href={item.href} aria-current={active === item.key ? 'page' : undefined}>
      <Icon size={19} aria-hidden="true"/><span>{item.label}</span>
    </Link>;
  });
}

export function WorkspaceShell({title,subtitle,children,items = [],active = 'overview',homeHref = '/dashboard',context,action}: {
  title:string;subtitle?:string;children:ReactNode;items?:Item[];active?:string;homeHref?:string;context?:string;action?:ReactNode;
}) {
  const primaryKeys = ['overview','employee','reports','evidence','companies','billing'];
  const primary = (items.length ? items : [{key:'overview',label:'Workspace',href:homeHref}])
    .filter(item => primaryKeys.includes(item.key)).slice(0,4);
  const secondary = items.filter(item => !primary.some(shown => shown.key === item.key));
  return <div className="workspace-frame">
    <aside className="workspace-sidebar">
      <Brand/>
      <Link className="workspace-switch" href={homeHref}><Building2 size={19} aria-hidden="true"/><span>{context ?? 'Your workspace'}</span></Link>
      <p className="sidebar-label">Your team space</p><nav aria-label="Workspace navigation"><WorkspaceLinks items={items} active={active}/></nav>
    </aside>
    <main className="workspace workspace-content">
      <header className="workspace-header">
        <div className="workspace-header-top"><div className="workspace-context"><Link href={homeHref}>My spaces</Link>{context && <span>{context}</span>}</div>
          <div className="workspace-account">{(demoRuntimeEnabled() || reviewWorkspaceEnabled()) && <span className="status">Demo data</span>}
            <LocalForm fields={{task:'logout'}} label="Sign out"/></div></div>
        <div className="workspace-heading"><div><h1>{title}</h1>{subtitle && <p className="lead">{subtitle}</p>}</div>{action}</div>
      </header>
      {children}
    </main>
    <nav className="workspace-bottom" aria-label="Mobile workspace navigation">
      <WorkspaceLinks items={primary} active={active}/>
      {secondary.length > 0 && <details key={active}><summary><Menu size={19} aria-hidden="true"/>More</summary>
        <div className="workspace-bottom-menu"><WorkspaceLinks items={secondary} active={active}/></div>
      </details>}
    </nav>
  </div>;
}

export const rand = new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'});
