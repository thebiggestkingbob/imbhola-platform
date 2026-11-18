'use client';
import { useActionState } from 'react';
import { createDraftRecord } from '@/lib/workspace/draft-actions';
type Option={id:string;label:string};
type Props={
 organizationId:string;
 section:'reporting'|'training-events'|'wsp'|'atr'|'tasks';
 programs:Option[];
 cycles:Option[];
 events:Option[];
};
export default function WorkspaceDraftForm({organizationId,section,programs,cycles,events}:Props){
 const [state,action,pending]=useActionState(createDraftRecord,{message:'',saved:false});
 const needsProgram=section==='training-events'||section==='wsp';
 const needsCycle=section==='wsp'||section==='atr';
 const missing=(needsProgram&&programs.length===0)||(needsCycle&&cycles.length===0)||(section==='atr'&&events.length===0);
 const renderSelect=(name:string,label:string,options:Option[])=><>
  <label htmlFor={name}>{label}</label>
  <select id={name} name={name} required defaultValue=""><option value="" disabled>Select {label.toLowerCase()}</option>{options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select>
 </>;
 return <section className="workspace-entry-form-wrap">
  <h3>Create a {section==='reporting'?'reporting year':section==='training-events'?'training event':section==='wsp'?'WSP line':section==='atr'?'draft ATR entry':'task'}</h3>
  {missing?<p className="notice">Add the required reporting year, training programme or completed training event first.</p>:
  <form className="workspace-entry-form" action={action}>
    <input type="hidden" name="organizationId" value={organizationId}/>
    <input type="hidden" name="section" value={section}/>
    {section==='reporting'&&<><label htmlFor="reporting_year">Reporting year</label><input id="reporting_year" name="reporting_year" type="number" required min={2020} max={2100} defaultValue={new Date().getFullYear()+1}/></>}
    {section==='tasks'&&<><label htmlFor="task-title">Task description</label><input id="task-title" name="title" required minLength={3} maxLength={200}/><label htmlFor="due_on">Target date (optional)</label><input id="due_on" name="due_on" type="date"/></>}
    {needsCycle&&renderSelect('cycle_id','Reporting year',cycles)}
    {needsProgram&&renderSelect('program_id','Training programme',programs)}
    {section==='atr'&&renderSelect('event_id','Completed training event',events)}
    {section==='training-events'&&<><label htmlFor="event_date">Event date</label><input id="event_date" name="event_date" type="date" required/><label htmlFor="participants_count">Participants</label><input id="participants_count" name="participants_count" type="number" required min="0" defaultValue="0"/><label htmlFor="actual_cost">Cost (ZAR)</label><input id="actual_cost" name="actual_cost" type="number" step="0.01" required min="0" defaultValue="0"/></>}
    {section==='wsp'&&<><label htmlFor="planned_learners">Planned learners</label><input id="planned_learners" name="planned_learners" type="number" min="0" required defaultValue="0"/><label htmlFor="planned_cost">Planned cost (ZAR)</label><input id="planned_cost" name="planned_cost" type="number" step="0.01" min="0" required defaultValue="0"/><label htmlFor="quarter">Quarter</label><select name="quarter" id="quarter" required>{['Q1','Q2','Q3','Q4'].map(q=><option key={q} value={q}>{q}</option>)}</select></>}
    <button className="button" disabled={pending} type="submit">{pending?'Saving…':'Save draft'}</button>
    {state.message&&<p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
  </form>}
 </section>;
}
