'use client';
import {useActionState} from 'react';
import {previewWorkforceUpload} from '@/lib/workforce/preview-actions';
export default function WorkforcePreviewForm({organizationId}:{organizationId:string}){
 const [state,action,pending]=useActionState(previewWorkforceUpload,{message:'',rowCount:0,issueCount:0,duplicates:0,issues:[],ready:false});
 return <form action={action} className="workspace-entry-form">
   <h3>Validate workforce CSV</h3>
   <p className="workspace-caption">This performs a dry run only. No employee records or snapshots are stored.</p>
   <input name="organizationId" type="hidden" value={organizationId}/>
   <label htmlFor="workforce-csv">Workforce CSV (maximum 2 MB / 2,000 rows)</label>
   <input id="workforce-csv" type="file" accept=".csv,text/csv" name="file" required/>
   <button className="button" disabled={pending} type="submit">{pending?'Checking…':'Preview validation'}</button>
   {state.message&&<div role="status"><p className={state.ready?'workspace-success':'identity-error'}>{state.message}</p>
    {state.rowCount>0&&<p>Rows: {state.rowCount} · Issues: {state.issueCount} · Duplicate codes: {state.duplicates}</p>}
    {state.issues.length>0&&<ul>{state.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>}
   </div>}
 </form>;
}
