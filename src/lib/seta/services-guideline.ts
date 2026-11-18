/**
 * Extracted from Services SETA's 2026/27 EMPLOYEE SPREADSHEET GUIDELINE PDF.
 * This is a GUIDE-SOURCED LOGICAL MAP, not the actual XLSX worksheet schema.
 * Workbook positions, formulas and allowed code values remain UNVERIFIED.
 * The PDF's historical date examples MUST NOT drive 2026/27 validation.
 */
export const GUIDELINE_URL='https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/2026-27-Mandatory-Grant-Employee-Spreadsheet-Guideline.pdf';

export const GUIDELINE_SHEETS=[
  {name:'Employees',columns:[
    ['A','Companies SDL number'],['B','Employee number'],['C','Employee ID'],['D','ID Type'],
    ['E','First name'],['F','Last name'],['G','Date of birth'],['H','Gender'],
    ['I','Equity'],['J','Disability'],['K','Citizenship'],['L','Municipality'],
    ['M','Highest qualification'],['N','Highest qualification type'],
    ['O','Employment Type'],['P','Employment Status'],['Q','Job title'],['R','OFO Code'],
  ]},
  {name:'Training Interventions',columns:[
    ['A','Companies SDL number'],['B','Intervention number'],['C','Intervention Title'],
    ['D','Intervention type'],['E','Band Level'],['F','Intervention level'],
    ['G','Intervention Cost'],['H','SAQA ID'],['I','Provider Name'],
    ['J','ETQA'],['K','Accreditation number'],['L','PIVOTAL'],
    ['M','External'],['N','Will apply for Discretionary Grant?'],
  ]},
  {name:'Training Completed and Planned',columns:[
    ['A','Companies SDL number'],['B','Intervention number'],['C','Intervention Title'],
    ['D','Employee Number'],['E','Employee ID'],['F','Employee Name'],
    ['G','Employee Intervention status'],['H','Start date'],['I','End date'],
    ['J','Learning Mode'],['K','Appointment section'],
  ]},
] as const;

export type Linkage={employeeNumber:string;interventionNumber:string};
export type ReferenceRow={employeeNumber:string};
export type InterventionRow={interventionNumber:string;period:'ATR'|'WSP'};

export function checkTrainingLinkages(
  employees:ReferenceRow[],interventions:InterventionRow[],links:Linkage[]
):string[]{
  const errors:string[]=[];
  const employeeSet=new Set(employees.map(x=>x.employeeNumber));
  const interventionSet=new Set(interventions.map(x=>x.interventionNumber));
  if(employeeSet.size!==employees.length)errors.push('Duplicate employee number');
  if(interventionSet.size!==interventions.length)errors.push('Duplicate intervention number across ATR/WSP');
  for(const [i,link] of links.entries()){
    if(!employeeSet.has(link.employeeNumber))errors.push('Link '+(i+1)+': employee number not found');
    if(!interventionSet.has(link.interventionNumber))errors.push('Link '+(i+1)+': intervention number not found');
  }
  return errors;
}

/** Repeated interventions in ATR and WSP must have separate IDs, per guidance. */
export function checkInterventionPeriodIds(rows:InterventionRow[]):string[]{
  const seen=new Set<string>();const errors:string[]=[];
  for(const row of rows){
    if(!row.interventionNumber.trim())errors.push('Empty intervention number');
    if(seen.has(row.interventionNumber))errors.push('Duplicate intervention number: '+row.interventionNumber);
    seen.add(row.interventionNumber);
  }
  return errors;
}
export const GUIDELINE_CAVEAT =
 'Guide refers to historical training date examples inconsistent with 2026/27 heading; do not enforce any reporting dates without current official confirmation.';
