import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('src/lib/seta/services-guideline.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const obj={};new Function('exports',js)(obj);
test('guideline has three named sections but is not a verified workbook',()=>{
 assert.deepEqual(obj.GUIDELINE_SHEETS.map(x=>x.name),
 ['Employees','Training Interventions','Training Completed and Planned']);
 assert.match(obj.GUIDELINE_CAVEAT,/historical/);
});
test('no invented column beyond the guide-sourced ranges',()=>{
 assert.equal(obj.GUIDELINE_SHEETS[0].columns.length,18);
 assert.equal(obj.GUIDELINE_SHEETS[1].columns.length,14);
 assert.equal(obj.GUIDELINE_SHEETS[2].columns.length,11);
});
test('links must match employee and intervention references exactly',()=>{
 const employees=[{employeeNumber:'E01'}];
 const interventions=[{interventionNumber:'I-ATR',period:'ATR'},{interventionNumber:'I-WSP',period:'WSP'}];
 assert.deepEqual(obj.checkTrainingLinkages(employees,interventions,[{employeeNumber:'E01',interventionNumber:'I-WSP'}]),[]);
 assert.equal(obj.checkTrainingLinkages(employees,interventions,[{employeeNumber:'e01',interventionNumber:'I-WSP'}]).length,1);
 assert.equal(obj.checkTrainingLinkages(employees,interventions,[{employeeNumber:'E01',interventionNumber:'bad'}]).length,1);
});
test('ATR and WSP reusing the same intervention identifier is rejected',()=>{
 const duplicates=[{interventionNumber:'I01',period:'ATR'},{interventionNumber:'I01',period:'WSP'}];
 assert.equal(obj.checkInterventionPeriodIds(duplicates).length,1);
});
