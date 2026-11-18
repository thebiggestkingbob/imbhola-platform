'use client';
import { useActionState } from 'react';
import { addTrainingProgram } from '@/lib/workspace/actions';

export default function TrainingProgramForm({ organizationId }: {organizationId:string}) {
  const [state, action, pending] = useActionState(addTrainingProgram,{message:'',saved:false});
  return <form className="workspace-entry-form" action={action}>
    <h3>Add a training programme</h3>
    <input name="organizationId" type="hidden" value={organizationId}/>
    <label htmlFor="programme-title">Programme title</label>
    <input id="programme-title" name="title" required minLength={3} maxLength={220}/>
    <label htmlFor="programme-type">Training classification</label>
    <select id="programme-type" name="trainingType" defaultValue="unclassified">
      <option value="unclassified">Unclassified — review required</option>
      <option value="pivotal">PIVOTAL (provisional)</option>
      <option value="non_pivotal">Non-PIVOTAL (provisional)</option>
    </select>
    <label htmlFor="programme-provider">Provider (optional)</label>
    <input id="programme-provider" name="provider" maxLength={180}/>
    <button className="button" type="submit" disabled={pending}>
      {pending?'Saving…':'Add programme'}
    </button>
    {state.message && <p role="status" className={state.saved?'workspace-success':'identity-error'}>{state.message}</p>}
  </form>;
}
