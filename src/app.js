const $ = id => document.getElementById(id);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scene = Engine.validate(PRESETS[0]), target = '08', tab = 'all', query = '', history = [], snapshot = null, cached = null, busy = false, runId = 0;
const names = {retrieval:'Not recalled',age:'Too old',muted:'Muted topic','author-cap':'Author cap','below-cut':'Below cut',selected:'Selected'};
const fmt = v => v.toFixed(3);
function announce(msg, error = false) { $('notice').textContent = msg; $('notice').className = error ? 'notice error' : 'notice'; }
function remember() { runId++; busy = false; history.push({scene: structuredClone(scene), target, snapshot}); if (history.length > 24) history.shift(); cached = null; }
function setScene(next, id) { runId++; scene = Engine.validate(next); target = id || scene.items[0].id; cached = null; busy = false; render(); }
function render() {
  const result = Engine.rank(scene), picked = result.rows.find(v => v.id === target), p = scene.policy;
  $('scenario').value = PRESETS.findIndex(v => v.name === scene.name);
  if ($('scenario').value === '') $('scenario').value = 'custom';
  $('scene-name').textContent = scene.name;
  $('k').value = p.k; $('maxAge').value = p.maxAge; $('authorCap').value = p.authorCap;
  for (const key of ['interest','quality','freshness','diversity']) {
    $(key).value = key === 'diversity' ? p[key] : p.weights[key];
    $(`${key}-value`).textContent = String(key === 'diversity' ? p[key] : p.weights[key]);
  }
  const topics = [...new Set(scene.items.map(v => v.topic))];
  $('topics').innerHTML = topics.map((v,i) => `<label class="topic"><input type="checkbox" data-topic="${esc(v)}" ${p.muted.includes(v)?'checked':''}><span>${esc(v)}</span></label>`).join('');
  const recalled = result.rows.filter(v => v.retrieved).length;
  const eligible = result.rows.filter(v => !v.blocks.length).length;
  $('stages').innerHTML = [['01','Candidates',scene.items.length],['02','Recalled',recalled],['03','Eligible',eligible],['04','Selected',result.chosen.length]].map(([n,label,count]) => `<div class="stage"><span class="mono">${n}</span><strong>${count}</strong><span>${label}</span></div>`).join('<span class="stage-arrow" aria-hidden="true">→</span>');
  const ordered = [...result.rows].sort((a,b) => (a.position||999)-(b.position||999) || b.score-a.score || (a.id < b.id ? -1 : 1));
  const visible = ordered.filter(v => (tab === 'all' || (tab === 'selected' ? v.status === 'selected' : v.status !== 'selected')) && `${v.title} ${v.author} ${v.topic}`.toLowerCase().includes(query.toLowerCase()));
  $('count').textContent = `${visible.length} shown`;
  $('candidates').innerHTML = visible.length ? visible.map(v => `<button class="candidate ${v.id===target?'active':''}" data-id="${esc(v.id)}" aria-pressed="${v.id===target}"><span class="position ${v.position?'in':''}">${v.position?String(v.position).padStart(2,'0'):'—'}</span><span class="candidate-body"><span class="item-title">${esc(v.title)}</span><span class="item-meta">${esc(v.author)} · ${esc(v.topic)}</span><span class="tag ${v.position?'good':''}">${esc(v.blocks.length?names[v.blocks[0]]:names[v.status])}${v.blocks.length>1?` +${v.blocks.length-1}`:''}</span></span><span class="score mono">${fmt(v.score)}<small>base</small></span></button>`).join('') : '<div class="empty">No matching candidates.<br>Try another search or filter.</div>';
  for (const btn of document.querySelectorAll('[data-tab]')) btn.setAttribute('aria-pressed', btn.dataset.tab === tab);
  $('undo').disabled = !history.length;
  renderDetail(picked, result);
}
function renderDetail(v, result) {
  const p = scene.policy;
  const blockText = {retrieval:'The item never entered the candidate pool. A higher score cannot bypass retrieval.',age:`Age ${v.age}h exceeds the ${p.maxAge}h limit. The age check is independent of the freshness signal.`,muted:`The topic “${v.topic}” is muted for every candidate.`};
  const rows = v.blocks.map(k => `<li><b>${names[k]}</b><span>${esc(blockText[k])}</span></li>`);
  if (!rows.length && v.status === 'author-cap') rows.push(`<li><b>Author cap reached</b><span>${esc(v.author)} already has ${p.authorCap} selected item(s). This describes the final list; it does not prove the cap alone caused exclusion.</span></li>`);
  if (!rows.length && v.status === 'below-cut') rows.push('<li><b>Outranked in the greedy selection</b><span>The available slots went to other candidates after topic penalties. Base score alone does not determine the final list.</span></li>');
  if (v.position) rows.push(`<li class="positive"><b>Selected at #${v.position}</b><span>Base ${fmt(v.score)} − topic penalty ${fmt(v.penalty)} = ${fmt(v.utility)} at selection.</span></li>`);
  $('inspector').innerHTML = `<div class="eyebrow">CANDIDATE INSPECTOR <span class="mono">${esc(v.id)}</span></div><h2>${esc(v.title)}</h2><p class="byline">${esc(v.author)} · ${v.age} hours old</p><ul class="reasons">${rows.join('')}</ul><div class="repair-head"><div><h3>${v.position?'Already on the list.':'Find a way in.'}</h3><p class="micro">Search a finite menu, not an imaginary perfect algorithm.</p></div><button id="solve" class="primary" ${busy?'disabled':''}>${busy?'Searching…':v.position?'Inspect repair menu':'Find minimal repairs'} <span aria-hidden="true">↗</span></button></div><div id="repairs"></div><div class="section-label">Score, taken apart <strong class="mono">${fmt(v.score)}</strong></div><p class="micro">Base score is diagnostic only for blocked items. Signals are supplied, not inferred; displayed contributions are rounded.</p><div class="contributions">${['interest','quality','freshness'].map(k => `<div><span>${k}</span><span class="mono">${v.signals[k].toFixed(2)} × ${p.weights[k].toFixed(2)}</span><strong class="mono">${fmt(v.parts[k])}</strong></div>`).join('')}</div><details class="trace"><summary>Selection trace · ${result.trace.length} slots</summary>${result.trace.map(t => `<div class="trace-row"><b>#${t.slot} ${esc(scene.items.find(x=>x.id===t.winner).title)}</b><span class="micro">${t.candidates.length} candidates considered · selected at ${fmt(t.candidates[0].utility)}</span>${t.candidates.find(x=>x.id===target)?`<span class="micro">Inspected item: ${fmt(t.candidates.find(x=>x.id===target).utility)} after penalty</span>`:'<span class="micro">Inspected item unavailable or already selected.</span>'}</div>`).join('')}</details>`;
  $('solve').onclick = solve;
  if (cached) renderRepairs(cached);
  renderComparison(result);
}
function solve() {
  if (busy) return;
  busy = true;
  const ticket = ++runId, ref = scene, id = target;
  render();
  setTimeout(() => {
    if (ticket !== runId) return;
    try {
      cached = Engine.findRepairs(ref, id);
      announce(`Checked all ${cached.searched} combinations. ${cached.repairs.length} inclusion-minimal result(s).`);
    } catch (e) { announce(e.message, true); }
    finally { if (ticket === runId) { busy = false; render(); } }
  }, 30);
}
function renderRepairs(res) {
  const label = key => res.menu.find(v=>v.id===key).label;
  $('repairs').innerHTML = `<div class="search-summary"><strong>${res.searched}</strong> combinations checked · <strong>${res.repairs.length}</strong> minimal result(s)</div><p class="micro">“Minimal” means no successful strict subset. Not least cost, and only within the menu below.</p><details class="menu"><summary>What was allowed? ${res.menu.length} possible changes</summary><ul>${res.menu.map(a=>`<li><b>${esc(a.label)}</b><span>${esc(a.note)}</span></li>`).join('')}</ul></details>${res.repairs.length?res.repairs.slice(0,12).map((r,i)=>`<div class="repair"><div class="repair-label">${r.actions.length?`${r.actions.length} change${r.actions.length>1?'s':''} → position #${r.position}`:'Already selected · no repair needed'}</div>${r.actions.map(k=>`<div class="repair-action">+ ${esc(label(k))}</div>`).join('')}<p class="micro">${r.displaced.length?'Leaves the list: '+r.displaced.map(id=>esc(scene.items.find(v=>v.id===id).title)).join('; '):'No current selection displaced.'}</p>${r.actions.length?`<button class="secondary apply" data-repair="${i}">Apply & compare <span aria-hidden="true">→</span></button>`:''}</div>`).join(''):'<div class="empty">No repair in this menu.<br>This does not mean no other policy could admit it.</div>'}${res.repairs.length>12?`<p class="micro">Showing 12 of ${res.repairs.length}. Export the report for all results.</p>`:''}`;
}
function renderComparison(result) {
  const el = $('comparison');
  if (!snapshot) {el.hidden = true; return;}
  el.hidden = false;
  const old = Engine.rank(snapshot), oldIds = old.chosen.map(v=>v.id), newIds = result.chosen.map(v=>v.id);
  const list = (items, before) => items.map(v => `<li><span class="mono">${String(v.position).padStart(2,'0')}</span><span>${esc(v.title)}</span><b>${before?!newIds.includes(v.id)?'OUT':'':!oldIds.includes(v.id)?'IN':''}</b></li>`).join('');
  el.innerHTML = `<div class="compare-head"><div><div class="eyebrow">THE CONSEQUENCE</div><h2>A way in. A trade-off.</h2></div><button class="quiet" id="clear-compare">Dismiss comparison</button></div><div class="compare-grid"><div><h3>Before repair</h3><ol>${list(old.chosen,true)}</ol></div><div><h3>Current policy</h3><ol>${list(result.chosen,false)}</ol></div></div><p class="micro">The left list is the snapshot before the most recent applied repair. Further manual edits update only the right list. Undo restores the previous state.</p>`;
  $('clear-compare').onclick = () => {snapshot=null;render();};
}
function saveFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
$('policy-details').open = !matchMedia('(max-width:580px)').matches;
$('scenario').innerHTML = PRESETS.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')+'<option value="custom" disabled>Imported / edited scenario</option>';
$('scenario').onchange = e => {if(e.target.value==='custom')return;remember();snapshot=null;setScene(PRESETS[Number(e.target.value)],Number(e.target.value)===1?'05':'08');announce('Loaded synthetic demo.');};
for (const key of ['interest','quality','freshness','diversity']) {
  $(key).oninput = e => $(`${key}-value`).textContent = String(Number(e.target.value));
  $(key).onchange = e => {const val=Number(e.target.value);remember();scene=structuredClone(scene);if(key==='diversity')scene.policy.diversity=val;else scene.policy.weights[key]=val;render();};
}
for (const key of ['k','maxAge','authorCap']) $(key).onchange = e => {
  const next=structuredClone(scene); next.policy[key]=Number(e.target.value);
  try {const valid=Engine.validate(next);remember();setScene(valid,target);announce('Policy updated.');}catch(err){announce(err.message,true);render();}
};
$('topics').onchange = e => {if(!e.target.matches('input'))return;remember();scene=structuredClone(scene);const t=e.target.dataset.topic;scene.policy.muted=e.target.checked?[...scene.policy.muted,t]:scene.policy.muted.filter(v=>v!==t);render();};
$('candidates').onclick = e => {const btn=e.target.closest('[data-id]');if(!btn)return;runId++;target=btn.dataset.id;cached=null;busy=false;render();if(matchMedia('(max-width:900px)').matches)$('inspector').scrollIntoView({block:'start'});};
$('inspector').onclick = e => {const btn=e.target.closest('[data-repair]');if(!btn||!cached)return;const repair=cached.repairs[Number(btn.dataset.repair)];const before=structuredClone(scene);remember();snapshot=before;setScene(Engine.applyActions(scene,target,repair.actions),target);announce('Repair applied. The before/after lists are below. Undo is available.');};
document.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>{tab=btn.dataset.tab;render();});
$('search').oninput = e=>{query=e.target.value;render();};
$('undo').onclick=()=>{if(!history.length)return;const prev=history.pop();snapshot=prev.snapshot;setScene(prev.scene,prev.target);announce('Undid the last change.');};
$('reset').onclick=()=>{remember();snapshot=null;setScene(PRESETS[0],'08');query='';$('search').value='';tab='all';render();announce('Demo restored.');};
$('import').onclick=()=>$('file').click();
$('file').onchange=async e=>{
  const file=e.target.files[0]; e.target.value='';if(!file)return;
  try {if(file.size>262144)throw new Error('File too large. Maximum 256 KiB.');const raw=JSON.parse(await file.text());const next=Engine.validate(raw);remember();snapshot=null;query='';$('search').value='';tab='all';setScene(next);announce('Imported locally. No data was uploaded.');}catch(err){announce(`Import rejected: ${err.message}`,true);}
};
$('export').onclick=()=>{$('export-note').textContent='Scenario export includes all candidate titles, authors, signals and policy. Report export additionally includes the target, ranking trace and repair results. Downloads may contain sensitive data. Nothing is uploaded.';$('export-dialog').showModal();};
$('download-scenario').onclick=()=>{saveFile('unseen-scenario.json',JSON.stringify(scene,null,2),'application/json');$('export-dialog').close();announce('Scenario downloaded. Review before sharing.');};
$('download-report').onclick=()=>{try{saveFile('unseen-report.json',JSON.stringify(Engine.makeReport(scene,target),null,2),'application/json');$('export-dialog').close();announce('Full report downloaded. It contains your scenario data.');}catch(err){announce(err.message,true);}};
$('help').onclick=()=>$('help-dialog').showModal();
document.querySelectorAll('[data-close]').forEach(btn=>btn.onclick=()=>$(btn.dataset.close).close());
render();
