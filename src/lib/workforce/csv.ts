/** Deterministic, dependency-free CSV parser for an isolated workforce import preview.
 * No network access, no persistence. Invalid or ambiguous input fails closed.
 */
export const WORKFORCE_FIELDS = ['employee_code','given_name','family_name','job_title','department','status','ofo_code'] as const;
export type WorkforceField = typeof WORKFORCE_FIELDS[number];
export type PreviewIssue = { row:number; field:string; message:string };
export type PreviewRow = Record<WorkforceField,string>;
export type WorkforcePreview = { rows:PreviewRow[]; issues:PreviewIssue[]; duplicates:number; headers:string[] };

export function parseCsv(source:string,maxRows=2000):string[][] {
  if(source.length>2_000_000)throw new Error('CSV exceeds 2 MB');
  const text=source.replace(/^\uFEFF/,'');
  const records:string[][]=[];
  let fields:string[]=[];
  let current='';
  let quoted=false;
  let closedQuote=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quoted){
      if(ch==='"' && text[i+1]==='"'){current+='"';i++;continue;}
      if(ch==='"'){quoted=false;closedQuote=true;continue;}
      current+=ch;
    }else if(ch==='"'){
      if(current!==''||closedQuote)throw new Error('Unexpected quote at CSV position '+i);
      quoted=true;
    }else if(ch===','){
      fields.push(current);current='';closedQuote=false;
    }else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n')i++;
      fields.push(current);current='';closedQuote=false;
      if(fields.some(f=>f.trim()!==''))records.push(fields);
      fields=[];
      if(records.length>maxRows+1)throw new Error('CSV exceeds '+maxRows+' rows');
    }else{
      if(closedQuote && ch!==' ' && ch!=='\t')throw new Error('Unexpected character after quote');
      current+=ch;
    }
  }
  if(quoted)throw new Error('Unterminated CSV quotation');
  fields.push(current);
  if(fields.some(f=>f.trim()!==''))records.push(fields);
  return records;
}

export function previewWorkforceCsv(content:string):WorkforcePreview {
  const records=parseCsv(content);
  if(!records.length)throw new Error('CSV is empty');
  const headers=records[0].map(x=>x.trim().toLowerCase());
  if(new Set(headers).size!==headers.length)throw new Error('CSV headers must be unique');
  const required:WorkforceField[]=['employee_code','given_name','family_name'];
  for(const requiredField of required){
    if(!headers.includes(requiredField))throw new Error('Missing required column: '+requiredField);
  }
  if(headers.some(h=>!WORKFORCE_FIELDS.includes(h as WorkforceField)))throw new Error('Unrecognized column; map fields to the template before importing');
  const rows:PreviewRow[]=[];
  const issues:PreviewIssue[]=[];
  const codes=new Set<string>();
  let duplicates=0;
  for(let i=1;i<records.length;i++){
    const cells=records[i];
    if(cells.length!==headers.length){
      issues.push({row:i+1,field:'row',message:'Unexpected column count'});
      continue;
    }
    const row=Object.fromEntries(WORKFORCE_FIELDS.map(key=>[key,''])) as PreviewRow;
    for(let j=0;j<headers.length;j++)row[headers[j] as WorkforceField]=cells[j].trim();
    for(const key of required){
      if(!row[key])issues.push({row:i+1,field:key,message:'Required value is empty'});
    }
    if(row.employee_code.length>80)issues.push({row:i+1,field:'employee_code',message:'Must be 80 characters or fewer'});
    if(row.given_name.length>150||row.family_name.length>150)issues.push({row:i+1,field:'name',message:'Name too long'});
    if(row.job_title.length>250||row.department.length>180)issues.push({row:i+1,field:'job_title',message:'Title/department too long'});
    if(row.status && !['active','inactive'].includes(row.status.toLowerCase()))
      issues.push({row:i+1,field:'status',message:'Must be active or inactive'});
    if(row.ofo_code && !/^\d{6}$/.test(row.ofo_code))
      issues.push({row:i+1,field:'ofo_code',message:'Expected six digits; code not verified against an OFO reference'});
    const code=row.employee_code.toLowerCase();
    if(code){
      if(codes.has(code)){
        duplicates++;
        issues.push({row:i+1,field:'employee_code',message:'Duplicate employee code in file'});
      }
      codes.add(code);
    }
    // Avoid spreadsheet formula injection when such cells are later exported.
    for(const key of WORKFORCE_FIELDS){
      if(/^[\s]*[=+@]/.test(row[key]))issues.push({row:i+1,field:key,message:'Spreadsheet formula-like value is not permitted'});
    }
    rows.push(row);
  }
  return {rows,issues,duplicates,headers};
}
