import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('src/lib/workforce/ofo.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
new Function('exports',js)(exports);
const {normalizeOccupation,rankOfoCandidates}=exports;
const sample=[
 {code:'123456',title:'Office Administration Clerk',version:'TEST-ONLY'},
 {code:'987654',title:'Training Coordinator',version:'TEST-ONLY'},
 {code:'111111',title:'Civil Engineer',version:'TEST-ONLY'},
];
test('tokenize titles consistently',()=>{
 assert.deepEqual(normalizeOccupation('Senior OFFICE  Administration, Clerk'),['office','administration','clerk']);
});
test('return the best lexical suggestion from supplied references',()=>{
 const got=rankOfoCandidates('Office Administration Clerk',sample);
 assert.equal(got[0].code,'123456');
 assert.equal(got[0].score,100);
});
test('never invent an occupation from incomplete references',()=>{
 assert.deepEqual(rankOfoCandidates('Astronaut',sample),[]);
 assert.deepEqual(rankOfoCandidates('Office Administration Clerk',[]),[]);
});
test('discard invalid reference codes and duplicate versions',()=>{
 const values=[{...sample[0],code:'INVALID'},sample[0],sample[0]];
 assert.equal(rankOfoCandidates('Office Clerk',values).length,1);
});
test('scores are advisory, not proof of official code validity',()=>{
 assert.ok(rankOfoCandidates('Training Coordinator',sample)[0].version==='TEST-ONLY');
});
