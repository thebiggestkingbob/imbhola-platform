import type { Pool, PoolClient } from 'pg';
import type { VerifiedIdentity } from './identity.ts';

export async function scopedTransaction<T>(
  pool: Pick<Pool,'connect'>,
  identity: VerifiedIdentity,
  companyId: string,
  work: (client: PoolClient) => Promise<T>,
  readOnly = true,
) {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
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
    const result = await work(client);
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

export function listWorkspaces(pool: Pick<Pool,'connect'>, identity: VerifiedIdentity, after: string | null) {
  return scopedTransaction(pool,identity,'',async client => {
    const {rows} = await client.query<{id:string;legal_name:string;roles:string[]}>(
      'SELECT * FROM imbhola.available_workspaces($1::uuid)',[after],
    );
    const entries = rows.slice(0,50);
    return {entries,next:rows.length > 50 ? entries.at(-1)?.id ?? null : null};
  });
}
