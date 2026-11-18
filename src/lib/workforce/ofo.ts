/** Candidate ranking for a verified, versioned OFO catalogue.
 * Scores are advisory only. These are NOT official determinations.
 */
export type OccupationReference = {code:string;title:string;version:string};
export type OfoCandidate = OccupationReference & {score:number;matchedTerms:string[]};
const STOP=new Set(['the','and','for','with','in','of','a','an','to','senior','junior','assistant','lead','level','grade']);
export function normalizeOccupation(text:string):string[]{
 return [...new Set(text.normalize('NFKC').toLowerCase().replace(/[^a-z0-9\s]/g,' ')
   .split(/\s+/).map(t=>t.trim()).filter(t=>t.length>1&&!STOP.has(t)))];
}
export function rankOfoCandidates(jobTitle:string,verifiedReferences:OccupationReference[],max=3):OfoCandidate[]{
 const query=normalizeOccupation(jobTitle);
 if(!query.length||max<=0)return [];
 const referenceSet=new Set<string>();
 const results:OfoCandidate[]=[];
 for(const candidate of verifiedReferences){
  if(!/^\d{6}$/.test(candidate.code)||!candidate.title.trim()||!candidate.version.trim())continue;
  const distinct=candidate.version+'|'+candidate.code;
  if(referenceSet.has(distinct))continue;
  referenceSet.add(distinct);
  const terms=normalizeOccupation(candidate.title);
  const matched=query.filter(q=>terms.includes(q));
  const coverage=matched.length/query.length;
  const specificity=matched.length/Math.max(terms.length,1);
  const score=Math.round((coverage*0.8+specificity*0.2)*100);
  if(score>0)results.push({...candidate,score,matchedTerms:matched});
 }
 return results.sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code)).slice(0,Math.min(max,10));
}
