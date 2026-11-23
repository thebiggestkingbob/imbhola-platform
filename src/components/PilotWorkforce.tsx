'use client';

import { AuthProvider, Descope, useDescope } from '@descope/react-sdk';
import { useState, type FormEvent } from 'react';
import type { Employee } from '@/production/workforce';

type Company = {id:string;legal_name:string;roles:string[]};
type Page<T> = {entries:T[];next:string|null};

async function request<T>(path:string, token:string, body?:Record<string,string>) {
  const response = await fetch(path,{
    cache:'no-store',method:body ? 'POST' : 'GET',
    headers:{Authorization:'Bearer '+token,...(body ? {'Content-Type':'application/json'} : {})},
    body:body && JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? 'The request could not be completed.');
  return value as T;
}

function PilotWorkforce({flowId}:{flowId:string}) {
  const descope = useDescope();
  const [token,setToken] = useState('');
  const [directory,setDirectory] = useState<Page<Company>>();
  const [company,setCompany] = useState<Company>();
  const [workforce,setWorkforce] = useState<Page<Employee>>();
  const [selected,setSelected] = useState<Employee>();
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const canRead = company?.roles.some(role => ['owner','hr','sdf','training'].includes(role));
  const canWrite = company?.roles.some(role => ['owner','hr','sdf'].includes(role));

  async function run(action:()=>Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'The request could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  function signIn(session:string) {
    return run(async () => {
      const first = await request<Page<Company>>('/api/workspaces',session);
      setDirectory(first);
      setToken(session);
    });
  }

  async function signOut() {
    setToken('');
    setDirectory(undefined);
    setCompany(undefined);
    setWorkforce(undefined);
    setSelected(undefined);
    await descope.logout();
  }

  function openCompany(entry:Company) {
    return run(async () => {
      setCompany(entry);
      setSelected(undefined);
      setWorkforce(undefined);
      if (entry.roles.some(role => ['owner','hr','sdf','training'].includes(role))) {
        setWorkforce(await request<Page<Employee>>('/api/workspaces/'+entry.id+'/workforce',token));
      }
    });
  }

  function saveEmployee(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) return;
    const form = new FormData(event.currentTarget);
    const path = '/api/workspaces/'+company.id+'/workforce';
    void run(async () => {
      await request(path,token,{
        employeeNumber:String(form.get('employeeNumber') ?? ''),
        jobTitle:String(form.get('jobTitle') ?? ''),department:String(form.get('department') ?? ''),
        status:String(form.get('status') ?? ''),intent:selected ? 'update' : 'create',
      });
      setSelected(undefined);
      setNotice('Employee saved.');
      setWorkforce(await request<Page<Employee>>(path,token));
    });
  }

  return <>
    {error && <p role="alert" className="form-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {busy && <p role="status">Working…</p>}
    {!token ? <section className="workspace-panel access-card">
      <h2>Sign in to the private pilot</h2>
      <p>Use your invited account and complete both verification steps.</p>
      <Descope flowId={flowId} onSuccess={event => void signIn(event.detail.sessionJwt)}
        onError={() => setError('Could not complete sign-in. Please try again.')}/>
    </section> : <>
      <button className="button button-small" disabled={busy} onClick={() => void run(signOut)}>Sign out</button>
      <section className="workspace-panel">
        <h2>Your companies</h2>
        {!directory?.entries.length && <p>No companies have been assigned to your account.</p>}
        <ul>{directory?.entries.map(entry => <li key={entry.id}>
          <button className="button button-small" disabled={busy} onClick={() => void openCompany(entry)}>{entry.legal_name}</button>
          {' '}{entry.roles.join(', ')}
        </li>)}</ul>
        {directory?.next && <button className="button button-small" disabled={busy} onClick={() => void run(async () => {
          const page = await request<Page<Company>>('/api/workspaces?after='+directory.next,token);
          setDirectory({entries:[...directory.entries,...page.entries],next:page.next});
        })}>More companies</button>}
      </section>
      {company && <section className="workspace-panel">
        <h2>{company.legal_name}</h2>
        {!canRead && <p>Your company role does not include employee records.</p>}
        {workforce && <>
          <h3>Employees</h3>
          {workforce.entries.length === 0 ? <p>No employees yet.</p> :
            <div className="table-scroll"><table className="workspace-table">
              <thead><tr><th scope="col">Employee number</th><th scope="col">Job title</th><th scope="col">Department</th>
                <th scope="col">Status</th>{canWrite && <th scope="col">Actions</th>}</tr></thead>
              <tbody>{workforce.entries.map(row => <tr key={row.employee_number}><td>{row.employee_number}</td>
                <td>{row.job_title}</td><td>{row.department}</td><td>{row.employment_status}</td>{canWrite &&
                <td><button type="button" disabled={busy} onClick={() => setSelected(row)}>Edit</button></td>}</tr>)}</tbody>
            </table></div>}
          {workforce.next && <button className="button button-small" disabled={busy} onClick={() => void run(async () => {
            const path = '/api/workspaces/'+company.id+'/workforce?after='+encodeURIComponent(workforce.next ?? '');
            const page = await request<Page<Employee>>(path,token);
            setWorkforce({entries:[...workforce.entries,...page.entries],next:page.next});
          })}>More employees</button>}
        </>}
        {canWrite && workforce && <form className="workspace-form" key={company.id+'/'+(selected?.employee_number ?? '')} onSubmit={saveEmployee}>
          <h3>{selected ? 'Edit employee' : 'Add employee'}</h3>
          <label>Employee number<input name="employeeNumber" required maxLength={80}
            defaultValue={selected?.employee_number} readOnly={!!selected}/></label>
          <label>Job title<input name="jobTitle" required maxLength={160} defaultValue={selected?.job_title ?? ''}/></label>
          <label>Department<input name="department" required maxLength={120} defaultValue={selected?.department ?? ''}/></label>
          <label>Status<select name="status" defaultValue={selected?.employment_status ?? 'active'}>
            <option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          <div className="form-actions"><button className="button button-small" disabled={busy}>Save employee</button>
            {selected && <button type="button" disabled={busy} onClick={() => setSelected(undefined)}>Cancel</button>}</div>
        </form>}
      </section>}
    </>}
  </>;
}

export default function PilotWorkforceEntry({projectId,flowId}:{projectId:string;flowId:string}) {
  return <AuthProvider projectId={projectId} persistTokens={false} autoRefresh={false}>
    <PilotWorkforce flowId={flowId}/>
  </AuthProvider>;
}
