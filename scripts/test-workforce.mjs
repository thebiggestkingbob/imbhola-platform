import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const source=readFileSync('src/lib/workforce/csv.ts','utf8');
const compiled=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const exported={};
new Function('exports','require',compiled)(exported,require);
const {parseCsv,previewWorkforceCsv}=exported;

test('quoted commas, escaped quotes, and newlines',()=>{
  const rows=parseCsv('id,title\n"a","Role, Senior"\n"b","He said ""Hi"""\n');
  assert.deepEqual(rows,[['id','title'],['a','Role, Senior'],['b','He said "Hi"']]);
});
test('required headers and duplicate employee codes',()=>{
  const preview=previewWorkforceCsv(
    'employee_code,given_name,family_name,job_title\nE1,Jane,One,Admin\ne1,John,Two,Clerk\n'
  );
  assert.equal(preview.rows.length,2);
  assert.equal(preview.duplicates,1);
  assert.ok(preview.issues.some(x=>x.message.includes('Duplicate')));
});
test('reject missing required fields',()=>{
  assert.throws(()=>previewWorkforceCsv('employee_code,given_name\nE1,Jane'),/family_name/);
});
test('reject malicious spreadsheet formulas',()=>{
  const preview=previewWorkforceCsv('employee_code,given_name,family_name\nE1,=1+1,One');
  assert.ok(preview.issues.some(x=>x.message.includes('formula-like')));
});
test('reject broken quotes and extra columns',()=>{
  assert.throws(()=>parseCsv('a,b\n"oops'),/Unterminated/);
  const result=previewWorkforceCsv('employee_code,given_name,family_name\nE1,Jane,One,EXTRA');
  assert.ok(result.issues.some(x=>x.message.includes('column count')));
});
test('reject excessive row limit',()=>{
  assert.throws(()=>parseCsv('x\ny\nz',1),/exceeds/);
});
