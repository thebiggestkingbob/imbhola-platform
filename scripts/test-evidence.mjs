import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('src/lib/evidence/requirements.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported={};new Function('exports',js)(exported);
const {evidenceIsReportReady,EVIDENCE_CATEGORIES}=exported;
test('only malware-clean reviewed and unexpired evidence is ready',()=>{
 assert.equal(evidenceIsReportReady('clean','accepted',null,'2026-11-18'),true);
 assert.equal(evidenceIsReportReady('pending','accepted',null,'2026-11-18'),false);
 assert.equal(evidenceIsReportReady('rejected','accepted',null,'2026-11-18'),false);
 assert.equal(evidenceIsReportReady('clean','pending_review',null,'2026-11-18'),false);
 assert.equal(evidenceIsReportReady('clean','rejected',null,'2026-11-18'),false);
 assert.equal(evidenceIsReportReady('clean','accepted','2026-11-17','2026-11-18'),false);
 assert.equal(evidenceIsReportReady('clean','accepted','2026-11-18','2026-11-18'),true);
});
test('required categories have unique identifiers',()=>{
 const codes=EVIDENCE_CATEGORIES.map(c=>c.code);
 assert.equal(new Set(codes).size,codes.length);
 assert.ok(codes.includes('attendance_register'));
 assert.ok(codes.includes('certificate'));
 assert.ok(codes.includes('proof_of_payment'));
});
