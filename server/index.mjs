import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { randomUUID, randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { TENSES, chooseTargets, scoreTurn, updateProgress } from './game.mjs';
try { process.loadEnvFile('.env'); } catch {}
const { tutor, providerName } = await import('./tutor.mjs');
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const unit=JSON.parse(await readFile(path.join(root,'data/unit-1.json'),'utf8'));
const dataDir=process.env.HABLA_DATA_DIR||path.join(root,'.local'); await mkdir(dataDir,{recursive:true});
const savePath=path.join(dataDir,'progress.json');
let db={sessions:[],progress:{}};
try{db=JSON.parse(await readFile(savePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const port=Number(process.env.PORT||4347);const host='127.0.0.1';
const token=randomBytes(24).toString('hex');
let busy=false;
async function persist(){const tmp=savePath+'.tmp';await writeFile(tmp,JSON.stringify(db,null,2),{mode:0o600});await rename(tmp,savePath);}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const view=()=>({unit,sessions:db.sessions.map(s=>({...s})),progress:db.progress,provider:providerName,token});
const cleanText=t=>typeof t==='string'&&t.trim().length>0&&t.length<=1200;
const vite=process.env.NODE_ENV==='production'?null:await (await import('vite')).createServer({root,server:{middlewareMode:true,host,hmr:{port:port+2000}},appType:'spa'});
const server=createServer(async(req,res)=>{
  const expected=new Set([`${host}:${port}`,`localhost:${port}`]);
  if(!expected.has(req.headers.host))return json(res,403,{error:'Local access only.'});
  const url=new URL(req.url,`http://${host}:${port}`);
  if(url.pathname.startsWith('/api/')){
    if(req.headers.origin && ![`http://${host}:${port}`,`http://localhost:${port}`].includes(req.headers.origin))return json(res,403,{error:'Origin not allowed.'});
    if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,view());
    if(req.method!=='POST')return json(res,404,{error:'Not found.'});
    if(req.headers['content-type']!=='application/json'||typeof req.headers['x-habla-token']!=='string'||Buffer.byteLength(req.headers['x-habla-token'])!==Buffer.byteLength(token)||!timingSafeEqual(Buffer.from(req.headers['x-habla-token']),Buffer.from(token)))return json(res,403,{error:'Refresh the page to reconnect.'});
    if(busy)return json(res,409,{error:'Lucía is finishing another reply. Try again in a moment.'});
    let raw='';try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16000)return json(res,413,{error:'Message too large.'});}}catch{return json(res,400,{error:'Request interrupted.'});}
    let body;try{body=JSON.parse(raw);}catch{return json(res,400,{error:'Invalid JSON.'});}
    if(!body||typeof body!=='object')return json(res,400,{error:'Invalid request.'});
    busy=true;
    const before=structuredClone(db);
    try{
      if(url.pathname==='/api/sessions'){
        const deck=unit.decks.find(d=>d.id===body.deckId);if(!deck||!TENSES.includes(body.tense))return json(res,400,{error:'Choose a valid deck and tense.'});
        const defaults=deck.initialTargets || ['ayuntamiento','solidaridad','fortalecer'].filter(id=>deck.terms.some(t=>t.id===id));
        const targets=Object.keys(db.progress).length||defaults.length<3?chooseTargets(deck.terms,db.progress):defaults;
        const session={id:randomUUID(),deckId:deck.id,title:deck.title,createdAt:Date.now(),updatedAt:Date.now(),tense:body.tense,turns:0,xp:0,targets,scene:deck.scene||'community',complete:false,messages:[{role:'assistant',text:deck.opening,translation:deck.openingTranslation||'Hi! I’m Lucía. Let’s talk about your community.'}],receipts:{}};
        if(targets.join()!==defaults.join()) {session.messages[0]={role:'assistant',text:`¡Hola! Hoy vamos a hablar de ${deck.title.toLowerCase()}. ¿Qué relación ves entre «${targets.map(id=>deck.terms.find(t=>t.id===id).es).join('», «')}» en tu comunidad?`,translation:'Hi! Let’s talk about this topic. How are these three ideas connected in your community?'};}
        if(body.tense==='preterite'){session.messages[0].text+=' Cuéntamelo en pretérito: ¿qué pasó la última vez?';session.messages[0].translation+=' Tell me in the preterite: what happened last time?';}else if(body.tense==='imperfect'){session.messages[0].text+=' Cuéntamelo en imperfecto: ¿cómo era antes?';session.messages[0].translation+=' Tell me in the imperfect: what was it like before?';}
        db.sessions.unshift(session);await persist();return json(res,201,{session});
      }
      if(url.pathname==='/api/turn'){
        const session=db.sessions.find(s=>s.id===body.sessionId);if(!session)return json(res,404,{error:'Conversation not found.'});
        if(typeof body.requestId!=='string'||body.requestId.length>80)return json(res,400,{error:'Missing request ID.'});
        if(session.receipts?.[body.requestId])return json(res,200,{session,progress:db.progress,result:session.receipts[body.requestId]});
        if(session.complete||!cleanText(body.text))return json(res,400,{error:session.complete?'This round is complete. Start another to keep practicing.':'Write a reply between 1 and 1,200 characters.'});
        const deck=unit.decks.find(d=>d.id===session.deckId);const nextTargets=chooseTargets(deck.terms,db.progress,session.targets);
        const result=await tutor({session,deck,text:body.text.trim(),nextTargets});
        const score=scoreTurn(result,body.text,session.targets,deck.terms);
        db.progress=updateProgress(db.progress,session.targets,score);
        session.messages.push({role:'user',text:body.text.trim()},{role:'assistant',text:result.reply,translation:result.translation,feedback:result.feedback,score,tense:result.tense,usedTerms:result.usedTerms});
        session.turns++;session.xp+=score.total;session.updatedAt=Date.now();session.complete=session.turns>=6;session.targets=nextTargets;
        session.receipts??={};session.receipts[body.requestId]={...result,score};await persist();return json(res,200,{session,progress:db.progress,result:{...result,score}});
      }
      if(url.pathname==='/api/scene'){
        const session=db.sessions.find(s=>s.id===body.sessionId);if(!session||!['community','school','family'].includes(body.scene))return json(res,400,{error:'Invalid scene.'});
        session.scene=body.scene;await persist();return json(res,200,{session});
      }
      return json(res,404,{error:'Not found.'});
    }catch(e){db=before;console.error('Tutor request failed:',e.name, String(e.message).replace(/sk-[\w-]+/g,'[redacted]').slice(0,250));return json(res,503,{error:'Lucía couldn’t connect. Your answer is still here — try again. Check the local server’s model/login configuration if this continues.'});}
    finally{busy=false;}
  }
  if(vite)return vite.middlewares(req,res);
  const file=url.pathname==='/'?'/index.html':url.pathname;
  const allowed=path.resolve(root,'dist','.'+file);
  if(!allowed.startsWith(path.join(root,'dist')+path.sep))return json(res,404,{error:'Not found.'});
  try{const bytes=await readFile(allowed);const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,host,()=>console.log(`Habla is ready: http://${host}:${port} (${providerName})`));
