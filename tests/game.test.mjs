import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scoreTurn,updateProgress,chooseTargets,makeGoal,openingFor,validateGrade} from '../server/game.mjs';
const terms=[{id:'compartir',es:'compartir',en:'to share'},{id:'hogar',es:'el hogar',en:'home'},{id:'ninez',es:'la niñez',en:'childhood'}];
const goal={kind:'word',id:'compartir',label:'compartir',meaning:'to share',tense:null};
const base={nextTargetId:'',reply:'¡Bien!',translation:'Good!',feedback:'Nice sentence.',meaningful:true,emotion:'happy',usedTerms:[],tense:{correct:false,name:'',evidence:'',explanation:''}};
test('only the ONE current word earns credit; other words and tense do not stack',()=>{
 const result=scoreTurn({...base,usedTerms:[{id:'compartir',correct:true,evidence:'Comparto'},{id:'hogar',correct:true,evidence:'hogar'}],tense:{correct:true,evidence:'Comparto'}},'Comparto las tareas de mi hogar.',goal,terms);
 assert.equal(result.total,20);assert.equal(result.goalMet,true);assert.equal(result.hits.length,1);assert.equal(result.tense,0);
});
test('a meaningful sentence without the target earns no points and does not pass',()=>{
 const result=scoreTurn({...base,usedTerms:[{id:'hogar',correct:true,evidence:'hogar'}]},'Mi hogar es grande.',goal,terms);
 assert.equal(result.total,0);assert.equal(result.goalMet,false);
});
test('conjugated vocabulary can pass; fabricated, incorrect, or absent evidence cannot',()=>{
 assert.equal(scoreTurn({...base,usedTerms:[{id:'compartir',correct:true,evidence:'compartimos'}]},'Nosotros compartimos libros.',goal,terms).goalMet,true);
 for(const hit of [{id:'compartir',correct:true,evidence:'compartimos'},{id:'compartir',correct:false,evidence:'comparto'},{id:'invented',correct:true,evidence:'comparto'}])assert.equal(scoreTurn({...base,usedTerms:[hit]},'Yo comparto libros.',goal,terms).goalMet,false);
});
test('tense practice has no vocabulary requirement and earns one fixed award',()=>{
 const tenseGoal={kind:'tense',id:'tense:preterite',tense:'preterite'};
 const result=scoreTurn({...base,tense:{correct:true,name:'Preterite',evidence:'fui'}},'Ayer fui al parque.',tenseGoal,terms);
 assert.equal(result.total,20);assert.equal(result.tense,20);assert.equal(result.hits.length,0);
 assert.equal(scoreTurn({...base,tense:{correct:true,evidence:'fui'}},'Voy al parque.',tenseGoal,terms).total,0);
});
test('keyword lists and copied prior sentences cannot earn XP',()=>{
 const result={...base,usedTerms:[{id:'compartir',correct:true,evidence:'comparto'}]};
 assert.equal(scoreTurn({...result,meaningful:false},'comparto',goal,terms).total,0);
 assert.equal(scoreTurn(result,'Yo comparto libros.',goal,terms,[{role:'user',text:'Yo comparto libros.'}]).total,0);
});
test('missed words stay due; successful words get spaced review',()=>{
 const missed=updateProgress({},['compartir'],{hits:[],goalMet:false},1000);assert.equal(missed.compartir.dueAt,1000);
 const success=updateProgress(missed,['compartir'],{hits:[{id:'compartir'}],goalMet:true},2000);assert.equal(success.compartir.dueAt,86402000);assert.equal(success.compartir.successes,1);
 const twice=updateProgress(success,['compartir'],{hits:[{id:'compartir'}],goalMet:true},86402000);assert.equal(twice.compartir.intervalDays,2);
});
test('scheduling chooses exactly one target and avoids recent targets',()=>{
 assert.equal(chooseTargets(terms).length,1);assert.deepEqual(chooseTargets(terms,{},['compartir']),['hogar']);
 const deck={id:'unit-1-1',terms,initialTargets:['compartir','hogar','ninez']};
 assert.equal(makeGoal(deck,'vocabulary','present',{},[],true).id,'compartir');
 assert.equal(makeGoal(deck,'tense','preterite').kind,'tense');assert.ok(openingFor(goal).text.includes('compartir'));
});
test('schema rejects malformed tutor feedback',()=>{
 assert.throws(()=>validateGrade({...base,usedTerms:[{id:'a'}]}));assert.throws(()=>validateGrade({...base,reply:''}));assert.equal(validateGrade(base),base);
});
test('85 sourced terms are unique and available for single-goal practice',async()=>{
 const unit=JSON.parse(await readFile(new URL('../data/unit-1.json',import.meta.url),'utf8'));const all=unit.decks.flatMap(d=>d.terms);
 assert.equal(unit.decks.length,4);assert.equal(all.length,85);assert.equal(new Set(all.map(t=>t.id)).size,85);
 for(const deck of unit.decks){const g=makeGoal(deck,'vocabulary','present',{},[],true);assert.ok(deck.terms.some(t=>t.id===g.id));}
});

test('multiple decks combine into a unique full-unit pool and reject invalid selections',async()=>{
 const {combineDecks}=await import('../server/game.mjs');
 const unit=JSON.parse(await readFile(new URL('../data/unit-1.json',import.meta.url),'utf8'));
 assert.equal(combineDecks(unit,unit.decks.map(d=>d.id)).terms.length,85);
 assert.equal(combineDecks(unit,[unit.decks[0].id,unit.decks[1].id]).terms.length,45);
 assert.equal(combineDecks(unit,[unit.decks[0].id,unit.decks[0].id]).terms.length,25);
 assert.throws(()=>combineDecks(unit,[]));assert.throws(()=>combineDecks(unit,['unknown']));
});
test('conversation credits any selected words once, rejects invented evidence and copies',async()=>{
 const {scoreConversation}=await import('../server/game.mjs');
 const terms=[{id:'compartir'},{id:'apoyar'}];
 const result={meaningful:true,usedTerms:[{id:'compartir',correct:true,evidence:'Comparto'},{id:'apoyar',correct:true,evidence:'apoyo'},{id:'invented',correct:true,evidence:'libros'}]};
 const text='Comparto libros y apoyo a mi hermana.';
 assert.equal(scoreConversation(result,text,terms).total,40);
 assert.equal(scoreConversation(result,text,terms,['compartir']).total,20);
 assert.equal(scoreConversation(result,text,terms,['compartir','apoyar']).total,0);
 assert.equal(scoreConversation(result,'Hablo con mi madre.',terms).total,0);
 assert.equal(scoreConversation(result,text,terms,[],[{text}]).total,0);
});
