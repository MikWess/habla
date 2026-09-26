import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreTurn,updateProgress,chooseTargets,validateGrade} from '../server/game.mjs';
const terms=[{id:'solidaridad'},{id:'ayuntamiento'},{id:'fortalecer'},{id:'reto'}];
const base={reply:'¡Bien!',translation:'Good!',feedback:'Keep going.',meaningful:true,emotion:'happy',usedTerms:[],tense:{correct:false,name:'present',evidence:'',explanation:'Try a verb.'}};
test('scoring only accepts known, unique words with evidence in the learner reply',()=>{
 const s=scoreTurn({...base,usedTerms:[{id:'solidaridad',correct:true,evidence:'solidaridad'},{id:'solidaridad',correct:true,evidence:'solidaridad'},{id:'fortalecer',correct:true,evidence:'fortalece'},{id:'invented',correct:true,evidence:'solidaridad'},{id:'reto',correct:false,evidence:'reto'}]},'La solidaridad es importante.',['solidaridad'],terms);
 assert.equal(s.vocabulary,15);assert.equal(s.total,20);assert.equal(s.hits.length,1);
});
test('tense credit requires learner evidence',()=>{
 assert.equal(scoreTurn({...base,tense:{correct:true,evidence:'fuimos'}},'Mi familia es grande.',[],terms).tense,0);
 assert.equal(scoreTurn({...base,tense:{correct:true,evidence:'es grande'}},'Mi familia es grande.',[],terms).tense,10);
});
test('missed words are due immediately; successes are spaced and keep prior progress',()=>{
 const p=updateProgress({},['solidaridad','reto'],{hits:[{id:'solidaridad'}]},1000);
 assert.equal(p.solidaridad.dueAt,86401000);assert.equal(p.reto.dueAt,1000);
 const q=updateProgress(p,['solidaridad'],{hits:[{id:'solidaridad'}]},86401000);
 assert.equal(q.solidaridad.intervalDays,2);assert.equal(q.solidaridad.successes,2);assert.deepEqual(q.reto,p.reto);
});
test('target scheduling prefers misses and new words, avoids immediate repeats',()=>{
 const p={solidaridad:{dueAt:200000,successes:4},reto:{dueAt:0,successes:0}};
 assert.deepEqual(chooseTargets(terms,p,['reto'],1000),['ayuntamiento','fortalecer','solidaridad']);
 assert.equal(chooseTargets(terms,p,[],1000)[0],'reto');
});
test('reject malformed tutor output rather than inventing feedback',()=>{
 assert.throws(()=>validateGrade({...base,usedTerms:[{id:'a'}]}));
 assert.throws(()=>validateGrade({...base,reply:''}));assert.equal(validateGrade(base),base);
});
test('non-meaningful answers cannot earn any credit even with inconsistent model grading',()=>{
 const result=scoreTurn({...base,meaningful:false,usedTerms:[{id:'solidaridad',correct:true,evidence:'solidaridad'}],tense:{correct:true,evidence:'es'}},'solidaridad es',[],terms);
 assert.equal(result.total,0);assert.deepEqual(result.hits,[]);
});
test('all vocabulary entries have stable unique IDs and valid initial targets',async()=>{
 const {readFile}=await import('node:fs/promises');
 const unit=JSON.parse(await readFile(new URL('../data/unit-1.json',import.meta.url),'utf8'));
 assert.equal(unit.decks.length,4);const all=unit.decks.flatMap(d=>d.terms);
 assert.equal(all.length,85);assert.equal(new Set(all.map(t=>t.id)).size,85);
 for(const d of unit.decks){assert.equal(d.initialTargets.length,3);assert.ok(d.initialTargets.every(id=>d.terms.some(t=>t.id===id)));assert.ok(d.terms.every(t=>t.es&&t.en));}
});
