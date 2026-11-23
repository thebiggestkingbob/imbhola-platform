import { notFound } from 'next/navigation';
import PilotWorkspace from '@/components/PilotWorkspace';
import { pilotWorkspaceConfig } from '@/production/config';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Private IMBHOLA pilot',robots:{index:false,follow:false}};

export default function PilotPage() {
  const config = pilotWorkspaceConfig();
  if (!config) notFound();
  return <main className="container workspace">
    <h1>IMBHOLA pilot workspace</h1>
    <PilotWorkspace projectId={config.projectId} flowId={config.flowId}/>
  </main>;
}
