import type { Pool } from 'pg';
import { scopedTransaction } from './workspace-db.ts';
import type { VerifiedIdentity } from './identity.ts';

export type Employee = {
  employee_number: string;
  job_title: string | null;
  department: string | null;
  employment_status: string;
};

export function readWorkforcePage(pool: Pick<Pool,'connect'>, identity: VerifiedIdentity, companyId: string, after: string) {
  return scopedTransaction(pool,identity,companyId,async client => {
    const permission = await client.query<{allowed:boolean}>(`SELECT imbhola.has_company_role(
      $1::uuid,array['owner','hr','training','sdf']) AND EXISTS (
        SELECT 1 FROM imbhola.companies WHERE id=$1::uuid AND status NOT IN ('suspended','archived')
      ) AS allowed`,[companyId]);
    if (!permission.rows[0]?.allowed) return;

    const {rows} = await client.query<Employee>(`
      SELECT employee_number,job_title,department,employment_status
      FROM imbhola.employees
      WHERE company_id = $1::uuid AND employee_number > $2
      ORDER BY employee_number
      LIMIT 51`,[companyId,after]);
    const entries = rows.slice(0,50);
    return {entries,next:rows.length > 50 ? entries.at(-1)?.employee_number : null};
  });
}

export type WorkforceEdit = {
  employeeNumber: string;
  jobTitle: string;
  department: string;
  status: 'active' | 'inactive';
  intent: 'create' | 'update';
};

export function validateWorkforceEdit(value: unknown): WorkforceEdit | undefined {
  if (!value || typeof value !== 'object') return;
  const {employeeNumber,jobTitle,department,status,intent} = value as Record<string,unknown>;
  if (typeof employeeNumber !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,79}$/.test(employeeNumber) ||
      employeeNumber !== employeeNumber.trim() || typeof jobTitle !== 'string' || !jobTitle.trim() || jobTitle.length > 160 ||
      typeof department !== 'string' || !department.trim() || department.length > 120 ||
      (status !== 'active' && status !== 'inactive') || (intent !== 'create' && intent !== 'update')) return;
  if (/[\u0000-\u001f\u007f]/.test(jobTitle + department)) return;
  return {employeeNumber,jobTitle:jobTitle.trim(),department:department.trim(),status,intent};
}

export function writeWorkforceEntry(pool: Pick<Pool,'connect'>, identity: VerifiedIdentity, companyId: string, edit: WorkforceEdit) {
  return scopedTransaction(pool,identity,companyId,async client => {
    const permission = await client.query<{allowed:boolean}>(`
      SELECT imbhola.has_company_role($1::uuid,array['owner','hr','sdf']) AND EXISTS (
        SELECT 1 FROM imbhola.companies WHERE id=$1::uuid AND status NOT IN ('suspended','archived')
      ) AS allowed`,[companyId]);
    if (!permission.rows[0]?.allowed) return;
    const fields = [companyId,edit.employeeNumber,edit.jobTitle,edit.department,edit.status];
    const columns = 'employee_number,job_title,department,employment_status';
    if (edit.intent === 'create') {
      const {rows} = await client.query<Employee>(`
        INSERT INTO imbhola.employees(company_id,employee_number,job_title,department,employment_status)
        VALUES($1::uuid,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING ${columns}`,fields);
      return rows[0] ? {outcome:'saved' as const,employee:rows[0]} : {outcome:'duplicate' as const};
    }
    const {rows} = await client.query<Employee>(`
      UPDATE imbhola.employees SET job_title=$3,department=$4,employment_status=$5
      WHERE company_id=$1::uuid AND employee_number=$2 RETURNING ${columns}`,fields);
    return rows[0] ? {outcome:'saved' as const,employee:rows[0]} : undefined;
  },false);
}
