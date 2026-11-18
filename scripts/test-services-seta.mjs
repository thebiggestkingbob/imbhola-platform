import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const raw=readFileSync('src/lib/seta/services-pilot.ts','utf8');
const js=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={};new Function('exports',js)(mod);
const {SERVICES_SETA_PILOT,SERVICES_SETA_PILOT_CHECKS,evaluateServicesSetaPilot}=mod;
test('pilot is locked from official export',()=>{
 assert.equal(SERVICES_SETA_PILOT.officialExportEnabled,false);
 assert.equal(evaluateServicesSetaPilot({}).officialReady,false);
});
test('evidence checklist uses unique keys and cited sources',()=>{
 const keys=SERVICES_SETA_PILOT_CHECKS.map(x=>x.key);
 assert.equal(new Set(keys).size,keys.length);
 const ids=new Set(SERVICES_SETA_PILOT.sources.map(x=>x.id));
 for(const item of SERVICES_SETA_PILOT_CHECKS)assert.ok(ids.has(item.source));
});
test('uninspected workbook cannot silently count as approved',()=>{
 assert.ok(SERVICES_SETA_PILOT.sources.some(s=>s.id==='employee-template'&&s.review==='linked-not-inspected'));
 const all=Object.fromEntries(SERVICES_SETA_PILOT_CHECKS.map(x=>[x.key,true]));
 const result=evaluateServicesSetaPilot(all);
 assert.equal(result.present,result.required);
 assert.equal(result.officialReady,false);
});
test('the missing list is accurate',()=>{
 const result=evaluateServicesSetaPilot({companyName:true,employeeCount:true});
 assert.ok(result.missing.includes('sdlNumber'));
 assert.ok(!result.missing.includes('employeeCount'));
});
