/**
 * Deployment safety gate. This checks the release policy, not production readiness.
 * Use before staging/production deployments to prevent accidentally opening
 * unfinished regulated features through environment variable overrides.
 */
import { readFileSync } from 'node:fs';

const gates = readFileSync('src/lib/release-gates.ts','utf8');
const health = readFileSync('src/app/api/health/route.ts','utf8');
const required = [
  'officialSetaExports',
  'externalSetaSubmission',
  'employerRegistration',
  'collectEmployeeData',
  'grantEligibilityCalculations',
];
const problems=[];
for(const name of required){
  if(!new RegExp('\\b'+name+'\\s*:\\s*false\\b').test(gates)){
    problems.push('Release gate is not statically closed: '+name);
  }
}
if(!/officialSetaExports:\s*false/.test(health)){
  problems.push('Health route does not explicitly report official export disabled');
}
if(/process\.env\.[A-Z0-9_]+\s*===?\s*['"]true['"]/.test(gates)){
  problems.push('Release gates must not be opened by environment variables');
}
if(problems.length){
  console.error('RELEASE SAFETY CHECK FAILED:\n'+problems.join('\n'));
  process.exitCode=1;
}else{
  console.log('PASS: five regulated release gates are hard-disabled.');
  console.log('NOTE: This does not certify authentication, RLS, data privacy or production readiness.');
}
