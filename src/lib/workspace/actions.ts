'use server';

import { revalidatePath } from 'next/cache';
import { requireOrgWorkspace } from './access';

type State = { message: string; saved: boolean };

export async function addTrainingProgram(_prev: State, data: FormData): Promise<State> {
  const organizationId = data.get('organizationId');
  const title = data.get('title');
  const trainingType = data.get('trainingType');
  const provider = data.get('provider');
  if (typeof organizationId !== 'string' || typeof title !== 'string' ||
    typeof trainingType !== 'string' || typeof provider !== 'string') {
    return { message:'Invalid form input.', saved:false };
  }
  const name = title.trim();
  if (name.length < 3 || name.length > 220 || provider.length > 180 ||
    !['unclassified','pivotal','non_pivotal'].includes(trainingType)) {
    return { message:'Check the programme name and classification.', saved:false };
  }
  const { client, user, roles } = await requireOrgWorkspace(organizationId);
  if (!roles.some(r=>['company_admin','hr_admin','training_admin','sdf'].includes(r))) {
    return { message:'You do not have permission to add training programmes.',saved:false };
  }
  const { error } = await client.from('training_programs').insert({
    organization_id:organizationId, title:name, training_type:trainingType,
    provider:provider.trim() || null, created_by:user.id,
  });
  if (error) return {message:'The programme could not be saved. Please try again.',saved:false};
  revalidatePath('/workspace/'+organizationId+'/training');
  return {message:'Programme added to this organisation.',saved:true};
}
