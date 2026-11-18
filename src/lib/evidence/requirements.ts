/** General preparation guidance only; not an approved SETA rulebook. */
export const EVIDENCE_CATEGORIES = [
  {code:'attendance_register',label:'Attendance register',description:'Proof of participation with dates and authorised sign-off'},
  {code:'certificate',label:'Training certificate',description:'Completion or attendance document issued by the provider'},
  {code:'invoice',label:'Training invoice',description:'Provider invoice linked to the relevant intervention'},
  {code:'proof_of_payment',label:'Proof of payment',description:'Financial evidence matching the invoice where relevant'},
  {code:'training_material',label:'Learning material',description:'Training course or intervention reference material'},
  {code:'approval',label:'Review and sign-off',description:'Authorised approvals, declarations and consultations'},
  {code:'other',label:'Other supporting proof',description:'Additional evidence subject to manual classification'},
] as const;
export type EvidenceCategory=typeof EVIDENCE_CATEGORIES[number]['code'];
export type EvidenceStatus='pending_review'|'needs_changes'|'accepted'|'rejected';
export function evidenceIsReportReady(scanStatus:string,reviewStatus:string,retentionUntil:string|null,asOf:string):boolean {
  if(scanStatus!=='clean'||reviewStatus!=='accepted')return false;
  if(retentionUntil && retentionUntil<asOf)return false;
  return true;
}
