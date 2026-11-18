import Link from 'next/link';

type Role=string;
const entries:{title:string;slug:string;roles:readonly string[]}[]=[
  {title:'Overview',slug:'',roles:['*']},
  {title:'My learning',slug:'my-learning',roles:['*']},
  {title:'Company & SDL',slug:'company',roles:['company_admin','executive','hr_admin','sdf','auditor']},
  {title:'Levy records',slug:'levies',roles:['company_admin','executive','hr_admin','sdf','auditor']},
  {title:'Team',slug:'team',roles:['company_admin','hr_admin']},
  {title:'Workforce',slug:'workforce',roles:['company_admin','hr_admin','training_admin','sdf','auditor']},
  {title:'Training catalogue',slug:'training',roles:['*']},
  {title:'Training events',slug:'training-events',roles:['company_admin','executive','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor']},
  {title:'WSP plans',slug:'wsp',roles:['company_admin','executive','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor']},
  {title:'ATR records',slug:'atr',roles:['company_admin','executive','hr_admin','training_admin','sdf','committee_member','signatory','auditor']},
  {title:'Evidence',slug:'evidence',roles:['company_admin','hr_admin','training_admin','sdf','signatory','auditor']},
  {title:'Approvals',slug:'approvals',roles:['company_admin','executive','hr_admin','sdf','committee_member','signatory','auditor']},
  {title:'Grants',slug:'grants',roles:['company_admin','executive','hr_admin','sdf','auditor']},
  {title:'Tasks',slug:'tasks',roles:['*']},
  {title:'Readiness',slug:'validation',roles:['company_admin','executive','hr_admin','training_admin','sdf','committee_member','signatory','auditor']},
  {title:'Reporting years',slug:'reporting',roles:['company_admin','executive','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor']},
];
export default function WorkspaceNav({organizationId,roles}:{organizationId:string;roles:Role[]}){
  const base='/workspace/'+organizationId;
  return <nav className="workspace-navigation" aria-label="Organisation workspace">
    {entries.filter(e=>e.roles.includes('*')||e.roles.some(r=>roles.includes(r))).map(e=>
      <Link key={e.slug} href={e.slug?base+'/'+e.slug:base}>{e.title}</Link>
    )}
  </nav>;
}
