export const TENSES = ['present', 'preterite', 'imperfect', 'mixed'];
export const normalize = text => text.toLocaleLowerCase('es').normalize('NFC').replace(/\s+/g, ' ').trim();
export function chooseTargets(terms, progress = {}, excluded = [], now = Date.now()) {
  return [...terms].sort((a,b) => {
    const priority = t => {const p=progress[t.id]; return (excluded.includes(t.id)?1000:0)+(p ? (p.dueAt > now ? 100 : 0) + p.successes * 3 + (p.lastSeen || 0)/1e14 : 1);};
    return priority(a)-priority(b);
  }).slice(0,3).map(t=>t.id);
}
export function scoreTurn(result, text, targets, terms) {
  if (!result.meaningful) return {hits:[],vocabulary:0,tense:0,conversation:0,total:0,targetHits:0};
  const allowed = new Set(terms.map(t=>t.id));
  const seen = new Set();
  const hits = result.usedTerms.filter(hit => {
    if (!allowed.has(hit.id) || seen.has(hit.id) || !hit.correct || !hit.evidence?.trim() || !normalize(text).includes(normalize(hit.evidence))) return false;
    seen.add(hit.id); return true;
  }).slice(0,5);
  const tenseHit = result.tense.correct && result.tense.evidence?.trim() && normalize(text).includes(normalize(result.tense.evidence));
  const vocabulary = hits.length * 15;
  const tense = tenseHit ? 10 : 0;
  const conversation = result.meaningful ? 5 : 0;
  return {hits, vocabulary, tense, conversation, total: vocabulary+tense+conversation, targetHits:hits.filter(h=>targets.includes(h.id)).length};
}
export function updateProgress(progress, targets, score, now = Date.now()) {
  const next = structuredClone(progress);
  for (const id of new Set([...targets, ...score.hits.map(h=>h.id)])) {
    const old = next[id] || {successes:0,attempts:0,intervalDays:0};
    const correct = score.hits.some(h=>h.id===id);
    const intervalDays = correct ? (old.intervalDays ? Math.min(30,old.intervalDays*2) : 1) : 0;
    next[id] = {...old, attempts:old.attempts+1, successes:old.successes+(correct?1:0), intervalDays, dueAt:correct?now+intervalDays*86400000:now, lastSeen:now};
  }
  return next;
}
export const gradeSchema = {
  type:'object',additionalProperties:false,required:['reply','translation','feedback','meaningful','usedTerms','tense','emotion'],
  properties:{reply:{type:'string'},translation:{type:'string'},feedback:{type:'string'},meaningful:{type:'boolean'},emotion:{type:'string',enum:['happy','idle']},usedTerms:{type:'array',items:{type:'object',additionalProperties:false,required:['id','evidence','correct','reason'],properties:{id:{type:'string'},evidence:{type:'string'},correct:{type:'boolean'},reason:{type:'string'}}}},tense:{type:'object',additionalProperties:false,required:['correct','name','evidence','explanation'],properties:{correct:{type:'boolean'},name:{type:'string'},evidence:{type:'string'},explanation:{type:'string'}}}}
};
export function validateGrade(r) {
  if (!r || typeof r.reply!=='string' || !r.reply.trim() || r.reply.length>2000 || typeof r.translation!=='string' || typeof r.feedback!=='string' || typeof r.meaningful!=='boolean' || !['happy','idle'].includes(r.emotion) || !Array.isArray(r.usedTerms) || r.usedTerms.length>30 || !r.usedTerms.every(h=>h&&['id','evidence','reason'].every(k=>typeof h[k]==='string')&&typeof h.correct==='boolean') || !r.tense || typeof r.tense.correct!=='boolean' || !['name','evidence','explanation'].every(k=>typeof r.tense[k]==='string')) throw new Error('Invalid tutor response');
  return r;
}
