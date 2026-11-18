export type WorkspaceSection =
  'workforce'|'training'|'training-events'|'wsp'|'atr'|'evidence'|'approvals'|'grants'|'tasks'|'reporting';

export const WORKSPACE_SECTIONS: Record<WorkspaceSection, {
  label: string;
  summary: string;
  table: string;
  columns: { key: string; label: string }[];
}> = {
  workforce: { label:'Workforce register', summary:'Employee records and occupational mapping. Personal data editing is disabled pending POPIA sign-off.', table:'employee_profiles', columns:[
    {key:'employee_code',label:'Employee code'},{key:'given_name',label:'Given name'},{key:'family_name',label:'Family name'},
    {key:'job_title',label:'Role'},{key:'ofo_code',label:'OFO code'},{key:'status',label:'Status'}]},
  training: {label:'Training catalogue',summary:'Training programmes and their provisional classifications.',table:'training_programs',columns:[
    {key:'title',label:'Programme'},{key:'training_type',label:'Classification'},{key:'provider',label:'Provider'},{key:'created_at',label:'Added'}]},
  'training-events':{label:'Training events',summary:'Recorded learning activity; participant figures are not proof of verified attendance.',table:'training_events',columns:[
    {key:'event_date',label:'Date'},{key:'participants_count',label:'Participants'},{key:'actual_cost',label:'Recorded cost (ZAR)'},{key:'status',label:'Status'}]},
  wsp: {label:'Workplace Skills Plan',summary:'Planned training, estimated cost, learning targets and review status.',table:'wsp_plan_items',columns:[
    {key:'planned_learners',label:'Learners planned'},{key:'planned_cost',label:'Planned cost (ZAR)'},{key:'quarter',label:'Quarter'},{key:'status',label:'Status'}]},
  atr: {label:'Annual Training Report',summary:'Actual training records and evidence state, pending verified reporting rules.',table:'atr_records',columns:[
    {key:'evidence_state',label:'Evidence'},{key:'status',label:'Review status'},{key:'created_at',label:'Recorded'}]},
  evidence: {label:'Evidence register',summary:'Only clean, authorised evidence metadata is visible. File upload/download is not activated.',table:'evidence_metadata',columns:[
    {key:'original_filename',label:'File'},{key:'related_record_type',label:'Record type'},{key:'scan_status',label:'Scan status'},{key:'created_at',label:'Added'}]},
  approvals: {label:'Reviews and decisions',summary:'Review history; formal signing and report lock require additional workflows.',table:'review_decisions',columns:[
    {key:'decision',label:'Decision'},{key:'comment',label:'Notes'},{key:'created_at',label:'Date'}]},
  grants: {label:'Grants and funding',summary:'Estimated, applied, approved and paid values are distinct financial states. None is guaranteed.',table:'grant_records',columns:[
    {key:'grant_category',label:'Category'},{key:'stage',label:'Stage'},{key:'amount',label:'Amount (ZAR)'},{key:'reference_number',label:'Reference'}]},
  tasks: {label:'Workflow tasks',summary:'Open responsibilities and reporting preparation tasks.',table:'workflow_tasks',columns:[
    {key:'title',label:'Task'},{key:'status',label:'Status'},{key:'due_on',label:'Due'}]},
  reporting: {label:'Reporting years',summary:'Annual reporting cycles. No official SETA exports are enabled.',table:'reporting_cycles',columns:[
    {key:'reporting_year',label:'Year'},{key:'status',label:'Stage'},{key:'created_at',label:'Created'}]},
};
export function isWorkspaceSection(s: string): s is WorkspaceSection {
  return Object.prototype.hasOwnProperty.call(WORKSPACE_SECTIONS,s);
}
