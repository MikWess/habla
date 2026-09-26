export const TENSES = ['present', 'preterite', 'imperfect', 'mixed'];
export const normalize = text => text.toLocaleLowerCase('es').normalize('NFC').replace(/\s+/g, ' ').trim();
export function chooseTargets(terms, progress = {}, excluded = [], now = Date.now()) {
  return [...terms].sort((a,b) => {
    const priority = t => {const p=progress[t.id]; return (excluded.includes(t.id)?1000:0)+(p ? (p.dueAt > now ? 100 : 0) + p.successes * 3 + (p.lastSeen || 0)/1e14 : 1);};
    return priority(a)-priority(b);
  }).slice(0,1).map(t=>t.id);
}
const tenseLabels={present:['Presente','Talk about now'],preterite:['Pretérito','Tell me what happened'],imperfect:['Imperfecto','Tell me how things used to be'],mixed:['A tense of your choice','Now, then, or back then']};
export function makeGoal(deck,mode,tense,progress={},exclude=[],initial=false){
 if(mode==='tense'){const [label,meaning]=tenseLabels[tense];return {kind:'tense',id:'tense:'+tense,label,meaning,tense};}
 const preferred=deck.id==='unit-1-1'?'compartir':deck.initialTargets[0];
 const id=initial&&!deck.terms.some(t=>progress[t.id])?preferred:chooseTargets(deck.terms,progress,exclude)[0];
 const term=deck.terms.find(t=>t.id===id);
 return {kind:'word',id:term.id,label:term.es,meaning:term.en,tense:null};
}
export function openingFor(goal){
 if(goal.kind==='tense'){
  const prompts={present:['¿Qué te gusta hacer los fines de semana?','What do you like to do on weekends?'],preterite:['¿Qué hiciste ayer después de clase?','What did you do after class yesterday?'],imperfect:['¿Cómo eran tus fines de semana cuando eras pequeño?','What were your weekends like when you were little?'],mixed:['Cuéntame algo de tu día.','Tell me something about your day.']};
  const [text,translation]=prompts[goal.tense];return {role:'assistant',text,translation};
 }
 const prompts={compartir:['¿Qué te gusta compartir con tu familia?','What do you like sharing with your family?'],ayuntamiento:['¿Qué hace el ayuntamiento por tu barrio?','What does the town council do for your neighborhood?'],ampliar:['¿Qué te gustaría ampliar en tu escuela?','What would you like to expand at your school?'],animar:['¿Cómo puedes animar a un amigo?','How can you encourage a friend?']};
 const [text,translation]=prompts[goal.id]||['Cuéntame algo de tu vida con esta palabra.','Tell me something about your life using this word.'];return {role:'assistant',text,translation};
}
export function scoreTurn(result,text,goal,terms,history=[]){
 const empty={hits:[],vocabulary:0,tense:0,conversation:0,total:0,targetHits:0,goalMet:false};
 if(!result.meaningful||history.some(m=>normalize(m.text)===normalize(text)))return empty;
 const hasEvidence=quote=>typeof quote==='string'&&quote.trim().length>0&&normalize(text).includes(normalize(quote));
 if(goal.kind==='tense'){
  const met=Boolean(result.tense.correct&&hasEvidence(result.tense.evidence));
  return {...empty,tense:met?20:0,total:met?20:0,goalMet:met};
 }
 const hit=result.usedTerms.find(h=>h.id===goal.id&&terms.some(t=>t.id===h.id)&&h.correct&&hasEvidence(h.evidence));
 return {...empty,hits:hit?[hit]:[],vocabulary:hit?20:0,total:hit?20:0,targetHits:hit?1:0,goalMet:Boolean(hit)};
}
export function updateProgress(progress, targets, score, now = Date.now()) {
  const next = structuredClone(progress);
  for (const id of new Set([...targets, ...score.hits.map(h=>h.id)])) {
    const old = next[id] || {successes:0,attempts:0,intervalDays:0};
    const correct = score.hits.some(h=>h.id===id) || (id.startsWith('tense:')&&score.goalMet);
    const intervalDays = correct ? (old.intervalDays ? Math.min(30,old.intervalDays*2) : 1) : 0;
    next[id] = {...old, attempts:old.attempts+1, successes:old.successes+(correct?1:0), intervalDays, dueAt:correct?now+intervalDays*86400000:now, lastSeen:now};
  }
  return next;
}
export const gradeSchema = {
 type:'object',additionalProperties:false,required:['reply','translation','feedback','meaningful','usedTerms','tense','emotion','nextTargetId'],
 properties:{nextTargetId:{type:'string'},reply:{type:'string'},translation:{type:'string'},feedback:{type:'string'},meaningful:{type:'boolean'},emotion:{type:'string',enum:['happy','idle']},usedTerms:{type:'array',items:{type:'object',additionalProperties:false,required:['id','evidence','correct','reason'],properties:{id:{type:'string'},evidence:{type:'string'},correct:{type:'boolean'},reason:{type:'string'}}}},tense:{type:'object',additionalProperties:false,required:['correct','name','evidence','explanation'],properties:{correct:{type:'boolean'},name:{type:'string'},evidence:{type:'string'},explanation:{type:'string'}}}}
};
export function validateGrade(r) {
 if(!r||typeof r.nextTargetId!=='string'||typeof r.reply!=='string'||!r.reply.trim()||r.reply.length>1200||typeof r.translation!=='string'||typeof r.feedback!=='string'||typeof r.meaningful!=='boolean'||!['happy','idle'].includes(r.emotion)||!Array.isArray(r.usedTerms)||r.usedTerms.length>30||!r.usedTerms.every(h=>h&&['id','evidence','reason'].every(k=>typeof h[k]==='string')&&typeof h.correct==='boolean')||!r.tense||typeof r.tense.correct!=='boolean'||!['name','evidence','explanation'].every(k=>typeof r.tense[k]==='string'))throw new Error('Invalid tutor response');
 return r;
}

export function combineDecks(unit, ids) {
 if(!Array.isArray(ids)||!ids.length||ids.length>unit.decks.length||ids.some(id=>!unit.decks.some(d=>d.id===id)))throw new Error('Invalid decks');
 const decks=unit.decks.filter(d=>ids.includes(d.id));
 return {...decks[0],id:decks[0].id,deckIds:decks.map(d=>d.id),title:decks.length===unit.decks.length?'All of Unit 1':decks.length>1?`${decks.length} sets`:decks[0].title,terms:[...new Map(decks.flatMap(d=>d.terms).map(t=>[t.id,t])).values()]};
}
export function scoreConversation(result,text,terms,covered=[],history=[]){
 const empty={hits:[],vocabulary:0,tense:0,conversation:0,total:0,targetHits:0,goalMet:false};
 if(!result.meaningful||history.some(m=>normalize(m.text)===normalize(text)))return empty;
 const hits=[...new Map(result.usedTerms.filter(h=>h.correct&&terms.some(t=>t.id===h.id)&&h.evidence.trim()&&normalize(text).includes(normalize(h.evidence))).map(h=>[h.id,h])).values()];
 const fresh=hits.filter(h=>!covered.includes(h.id));
 return {...empty,hits,vocabulary:fresh.length*20,total:fresh.length*20,targetHits:fresh.length,goalMet:hits.length>0};
}
