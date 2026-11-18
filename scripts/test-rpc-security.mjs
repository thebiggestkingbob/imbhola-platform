import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/tests/rpc_negative_unassigned.sql','utf8');
const structural=readFileSync('supabase/tests/security_definer_rpc_audit.sql','utf8');

test('negative tests run inside an explicit rollback transaction',()=>{
 assert.match(sql,/^BEGIN;/m);
 assert.match(sql,/^ROLLBACK;/m);
 assert.doesNotMatch(sql,/^COMMIT;/m);
 assert.match(sql,/SET LOCAL ROLE authenticated/);
 assert.match(sql,/request\.jwt\.claim\.sub/);
});

test('all sensitive RPCs have denial assertions',()=>{
 for(const fn of ['issue_organization_invite','submit_reporting_cycle_for_review',
 'request_reporting_cycle_changes','accept_organization_invite']){
   assert.ok(sql.includes('public.'+fn+'('),fn+' is missing');
 }
 assert.equal((sql.match(/IF NOT denied THEN RAISE EXCEPTION/g)||[]).length,4);
});

test('structural audit covers each privileged function',()=>{
 for(const fn of ['issue_organization_invite','submit_reporting_cycle_for_review',
 'request_reporting_cycle_changes','accept_organization_invite']){
   assert.ok(structural.includes("'"+fn+"'"),fn+' missing from structural audit');
 }
 assert.match(structural,/anonymous_denied/);
 assert.match(structural,/role_or_invitee_guard_present/);
});

test('negative tests use reserved synthetic UUIDs and example emails only',()=>{
 assert.match(sql,/99999999-9999-4999-8999-999999999999/);
 assert.match(sql,/invalid\.example/);
 assert.doesNotMatch(sql,/@(?:gmail|outlook|yahoo)\./i);
});
