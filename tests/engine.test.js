import test from 'node:test';
import assert from 'node:assert/strict';
import {validate,rank,findRepairs,applyActions,minimalMasks,makeReport} from '../src/engine.js';
import {presets} from '../src/fixtures.js';
const demo = () => validate(presets[0]);
test('validates, normalizes and isolates input',()=>{const s=demo();s.items[0].signals.quality=0;assert.equal(presets[0].items[0].signals.quality,.8);assert.equal(validate({...presets[0],secret:'discard'}).secret,undefined);});
test('rejects invalid schema, bounds, duplicates, NaN and coercion',()=>{
  const changes=[s=>s.schema=2,s=>s.items=[],s=>s.items[1].id=s.items[0].id,s=>s.items[0].signals.quality=NaN,s=>s.items[0].retrieved='true',s=>s.policy.k=2.5,s=>s.policy.weights.quality=1.1,s=>s.policy.maxAge=-1,s=>s.items[0].author='',s=>s.items=Array(121).fill(s.items[0]),s=>s.policy.muted=[null],s=>s.name=null,s=>s.policy.k='5'];
  for(const change of changes){const s=demo();change(s);assert.throws(()=>validate(s));}
});
test('empty, missing and null candidates fail usefully',()=>{for(const raw of [null,{}, {schema:1,name:'x',items:[null]}])assert.throws(()=>validate(raw));});
test('reports all independent blockers',()=>{const s=validate(presets[2]),v=rank(s).rows.find(v=>v.id==='08');assert.deepEqual(v.blocks,['retrieval','age','muted']);assert.equal(v.position,null);});
test('age boundary is inclusive',()=>{const s=demo();s.items.forEach(v=>{v.retrieved=true;v.age=48;});assert.ok(rank(s).rows.every(v=>!v.blocks.length));s.items[0].age=48.001;assert.deepEqual(rank(s).rows[0].blocks,['age']);});
test('score cannot bypass a hard blocker',()=>{const s=demo();s.items[7].signals={interest:1,quality:1,freshness:1};assert.ok(!rank(s).chosen.some(v=>v.id==='08'));});
test('deterministic ties use code-unit id ordering, independent of input order',()=>{const s=demo();s.policy.diversity=0;s.policy.authorCap=12;s.policy.maxAge=87600;s.items.forEach(v=>{v.retrieved=true;v.signals={interest:0,quality:0,freshness:0};});assert.deepEqual(rank(s).chosen.map(v=>v.id),['01','02','03','04','05']);s.items.reverse();assert.deepEqual(rank(s).chosen.map(v=>v.id),['01','02','03','04','05']);});
test('zero weights remain finite and deterministic',()=>{const s=demo();s.policy.weights={interest:0,quality:0,freshness:0};assert.ok(rank(s).rows.every(v=>v.score===0));assert.deepEqual(rank(s),rank(s));});
test('greedy trace stores scores at selection and respects author cap',()=>{const s=demo(),r=rank(s),counts={};for(const v of r.chosen){counts[v.author]=(counts[v.author]||0)+1;assert.ok(counts[v.author]<=s.policy.authorCap);assert.ok(Math.abs(v.utility-(v.score-v.penalty))<1e-12);assert.equal(r.trace[v.position-1].winner,v.id);}});
test('finite menu repair needs both retrieval and age in the opening demo',()=>{const s=demo(),res=findRepairs(s,'08');assert.ok(res.repairs.some(r=>r.actions.length===2&&r.actions.includes('age')&&r.actions.includes('retrieve')));assert.ok(res.repairs.every(r=>r.actions.includes('age')&&r.actions.includes('retrieve')));assert.equal(res.searched,2**res.menu.length);assert.ok(res.menu.length<=8);});
test('minimal masks handle non-monotone success, not just one-step removal',()=>{const wins=Array(8).fill(false);wins[1]=true;wins[7]=true;assert.deepEqual(minimalMasks(wins),[1]);});
test('non-monotone incomparable minimal sets survive',()=>{const wins=Array(8).fill(false);wins[3]=true;wins[4]=true;wins[7]=true;assert.deepEqual(minimalMasks(wins),[4,3]);});
test('already admitted has exactly the empty minimal repair',()=>{const s=demo(),id=rank(s).chosen[0].id;assert.deepEqual(findRepairs(s,id).repairs.map(v=>v.actions),[[]]);});
test('no successful policy is a valid result',()=>{const s=demo();s.policy.k=1;s.policy.authorCap=1;s.policy.diversity=0;s.policy.maxAge=87600;s.policy.weights={interest:1,quality:1,freshness:1};s.items.forEach(v=>{v.retrieved=true;v.signals={interest:1,quality:1,freshness:1};});s.items[7].signals={interest:0,quality:0,freshness:0};assert.deepEqual(findRepairs(s,'08').repairs,[]);});
test('all filtered gives an empty list and never fills unsafe slots',()=>{const s=demo();s.items.forEach(v=>v.retrieved=false);assert.equal(rank(s).chosen.length,0);assert.equal(rank(s).trace.length,0);});
test('global age relaxation may admit competitors too',()=>{const s=demo(),next=applyActions(s,'08',['age']);assert.equal(next.policy.maxAge,72);assert.equal(rank(next).rows.find(v=>v.id==='13').blocks.length,0);assert.equal(s.policy.maxAge,48);});
test('unknown targets and action ids are rejected',()=>{assert.throws(()=>findRepairs(demo(),'missing'));assert.throws(()=>applyActions(demo(),'08',['mystery']));});
test('roundtrip preserves ranking and repair results',()=>{const s=demo(),copy=validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(rank(copy),rank(s));assert.deepEqual(findRepairs(copy,'08'),findRepairs(s,'08'));assert.equal(makeReport(s,'08').scenario.schema,1);});
test('seeded randomized exhaustive oracle for repair validity and strict-subset minimality',()=>{
  let seed=731;const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
  for(let trial=0;trial<30;trial++){
    const s=demo();s.items=s.items.slice(0,8);s.policy.k=1+Math.floor(rng()*5);s.policy.authorCap=1+Math.floor(rng()*3);s.policy.diversity=rng();s.items.forEach(v=>{v.retrieved=rng()>.25;v.age=Math.floor(rng()*80);for(const k of ['interest','quality','freshness'])v.signals[k]=rng();});
    const id='08',res=findRepairs(s,id),good=[];
    for(let m=0;m<2**res.menu.length;m++){const actions=res.menu.filter((_,i)=>m&(1<<i)).map(v=>v.id);if(rank(applyActions(s,id,actions)).chosen.some(v=>v.id===id))good.push(m);}
    const expected=good.filter(m=>!good.some(n=>n!==m&&(n&m)===n)).sort((a,b)=>a-b);
    assert.deepEqual(res.repairs.map(v=>v.mask).sort((a,b)=>a-b),expected);
    for(const r of res.repairs){const ids=rank(applyActions(s,id,r.actions)).chosen.map(v=>v.id);assert.ok(ids.includes(id));assert.deepEqual(ids,r.selected);assert.ok(r.displaced.every(x=>!ids.includes(x)));}
  }
});

test('all 65536 four-action success tables match an independent subset oracle',()=>{
  for(let table=0;table<65536;table++){
    const wins=Array.from({length:16},(_,m)=>Boolean(table&(1<<m))),expected=[];
    for(let m=0;m<16;m++)if(wins[m]&&!wins.some((ok,n)=>ok&&n!==m&&(n&m)===n))expected.push(m);
    assert.deepEqual(minimalMasks(wins).sort((a,b)=>a-b),expected);
  }
});
