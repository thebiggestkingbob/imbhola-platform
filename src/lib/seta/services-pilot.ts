/**
 * Services SETA 2026–27 mandatory-grant PILOT checklist.
 * Source: Services SETA employers page + MG_ANNEX_03 declaration PDF.
 * This is a source-traceable preparation aid, NOT an official adapter,
 * regulatory compliance determination, or approved template exporter.
 */
export const SERVICES_SETA_PILOT = Object.freeze({
  seta: 'Services SETA',
  period: '2026–27',
  status: 'source-review',
  officialExportEnabled: false,
  sources: [
    {id:'employers',label:'2026–27 mandatory grant resources',url:'https://www.serviceseta.org.za/employers/',review:'listed'},
    {id:'declaration',label:'Mandatory Grant Delegation & Declaration',url:'https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/1.-MG_SOP_ANNEX_03_MANDATORY-GRANT-FORMS.pdf',review:'inspected'},
    {id:'employee-template',label:'2026–27 employee profile workbook',url:'https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/2.-MG_SOP_ANNEX_05_25-MANDATORY-GRANT-EMPLOYEE-PROFILE-TEMPLATE-Final.xlsx',review:'linked-not-inspected'},
    {id:'code-sheet',label:'2026–27 mandatory grants code sheet',url:'https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/3.-MG_SOP_ANNEX_MANDATORY-GRANTS_CODE-SHEET.xlsx',review:'linked-not-inspected'},
    {id:'interventions',label:'WSP and ATR intervention matrix',url:'https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/e.-MG_SOP_ANNEX_06_26-WSP-AND-ATR-INTERVENTION-MATRIX.pdf',review:'linked-not-inspected'},
    {id:'spreadsheet-guide',label:'2026–27 employee spreadsheet guideline',url:'https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/d.-2026-27-Mandatory-Grant_Employee-Spreadsheet-Guideline_Services-SETA.pdf',review:'linked-not-inspected'},
    {id:'spreadsheet-guide-secondary',label:'2026/27 employee spreadsheet guideline (indexed PDF)',url:'https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/2026-27-Mandatory-Grant-Employee-Spreadsheet-Guideline.pdf',review:'inspected'},
  ] as const,
});

export type PilotEvidence = {
  companyName:boolean;
  sdlNumber:boolean;
  employeeCount:boolean;
  sdfAppointmentLetter:boolean;
  sdfSignature:boolean;
  employeeOrUnionRepresentativeSignature:boolean;
  executiveSignature:boolean;
  popiaAuthorisedExecutiveSignature:boolean;
  employerDeclaration:boolean;
  wspDraft:boolean;
  atrDraft:boolean;
};
export const SERVICES_SETA_PILOT_CHECKS = [
  {key:'companyName',label:'Registered company name',source:'declaration'},
  {key:'sdlNumber',label:'SDL number',source:'declaration'},
  {key:'employeeCount',label:'Total employees at submission',source:'declaration'},
  {key:'sdfAppointmentLetter',label:'SDF appointment letter attached',source:'declaration'},
  {key:'sdfSignature',label:'SDF declaration/signature',source:'declaration'},
  {key:'employeeOrUnionRepresentativeSignature',label:'Employee or trade-union representative declaration/signature',source:'declaration'},
  {key:'executiveSignature',label:'CEO/Managing Director declaration/signature',source:'declaration'},
  {key:'popiaAuthorisedExecutiveSignature',label:'POPIA declaration signed by authorised CEO/Director/Executive (not external SDF)',source:'declaration'},
  {key:'employerDeclaration',label:'Employer delegation and declaration form',source:'declaration'},
  {key:'wspDraft',label:'WSP draft prepared',source:'employers'},
  {key:'atrDraft',label:'ATR draft prepared',source:'employers'},
] as const;

export function evaluateServicesSetaPilot(input:Partial<PilotEvidence>) {
  const checks=SERVICES_SETA_PILOT_CHECKS.map(check=>({
    ...check,provided:input[check.key]===true,
  }));
  return {checks,present:checks.filter(c=>c.provided).length,required:checks.length,
    missing:checks.filter(c=>!c.provided).map(c=>c.key),
    officialReady:false as const,
    reason:'Source review incomplete, no verified workbook mapping or approved legal sign-off. No official export enabled.',
  };
}
