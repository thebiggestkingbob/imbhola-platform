import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('private alpha robots disallow indexing',()=>{
 const robots=readFileSync('src/app/robots.ts','utf8');
 assert.match(robots,/disallow:\s*['"]\/['"]/);
 assert.doesNotMatch(robots,/process\.env/);
});
test('private alpha sitemap contains no public URLs',()=>{
 const sitemap=readFileSync('src/app/sitemap.ts','utf8');
 assert.match(sitemap,/return\s*\[\s*\]/);
});
test('demo request does not pretend to accept user data',()=>{
 const demo=readFileSync('src/app/request-demo/page.tsx','utf8');
 assert.match(demo,/No information is collected/);
});
