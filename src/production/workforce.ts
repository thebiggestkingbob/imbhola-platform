import type { Pool, PoolClient } from 'pg';
import type { VerifiedIdentity } from './identity.ts';

type Employee = {
  employee_number: string;
  job_title: string | null;
  department: string | null;
  employment_status: string;
};

async function scopedTransaction<T>(
  pool: Pick<Pool,'connect'>,
  identity: VerifiedIdentity,
  companyId: string,
  read: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query('BEGIN READ ONLY');
    await client.query('SET LOCAL ROLE imbhola_runtime');
    await client.query("SET LOCAL statement_timeout = '5s'");
    const lookup = await client.query<{id:string | null}>(
      'SELECT imbhola.actor_for_identity($1,$2) AS id',[identity.issuer,identity.subject],
    );
    const actorId = lookup.rows[0]?.id;
    if (!actorId) {
      await client.query('ROLLBACK');
      return;
    }

    await client.query(`SELECT set_config('imbhola.actor_id',$1,true),set_config('imbhola.company_id',$2,true)`,
      [actorId,companyId]);
    const result = await read(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      discard = true;
    }
    throw error;
  } finally {
    client.release(discard);
  }
}

export function readWorkforcePage(pool: Pick<Pool,'connect'>, identity: VerifiedIdentity, companyId: string, after: string) {
  return scopedTransaction(pool,identity,companyId,async client => {
    const permission = await client.query<{allowed:boolean}>(`SELECT imbhola.has_company_role(
      $1::uuid,array['owner','hr','training','sdf']) AS allowed`,[companyId]);
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
