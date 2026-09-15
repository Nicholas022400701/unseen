/* Unseen: deterministic ranking and exhaustive finite-menu repair search. */
export const version = '1.0.0';
const keys = ['interest', 'quality', 'freshness'];
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export function validate(raw) {
  const fail = msg => { throw new Error(msg); };
  const str = (v, n, max = 160) => typeof v === 'string' && v.trim() && v.length <= max || fail(`${n}: expected nonempty text (max ${max}).`);
  const num = (v, n, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi || fail(`${n}: expected a number from ${lo} to ${hi}.`);
  const int = (v, n, lo, hi) => { num(v, n, lo, hi); if (!Number.isInteger(v)) fail(`${n}: expected an integer.`); };
  if (!raw || raw.schema !== 1) fail('Expected scenario schema 1.');
  str(raw.name, 'name', 80);
  if (!Array.isArray(raw.items) || raw.items.length < 1 || raw.items.length > 120) fail('Use 1–120 candidates.');
  const ids = new Set();
  const items = raw.items.map((v, i) => {
    if (!v || typeof v !== 'object') fail(`Candidate ${i + 1}: expected an object.`);
    for (const k of ['id', 'title', 'author', 'topic']) str(v[k], `Candidate ${i + 1}.${k}`, k === 'title' ? 160 : 60);
    if (ids.has(v.id)) fail(`Duplicate candidate id: ${v.id}`);
    ids.add(v.id);
    if (typeof v.retrieved !== 'boolean') fail(`${v.id}.retrieved: expected true or false.`);
    num(v.age, `${v.id}.age`, 0, 87600);
    if (!v.signals) fail(`${v.id}: missing signals.`);
    const signals = {};
    for (const k of keys) { num(v.signals[k], `${v.id}.${k}`, 0, 1); signals[k] = v.signals[k]; }
    return {id: v.id, title: v.title, author: v.author, topic: v.topic, retrieved: v.retrieved, age: v.age, signals};
  });
  const p = raw.policy;
  if (!p || !p.weights) fail('Missing policy or weights.');
  int(p.k, 'policy.k', 1, 12);
  int(p.authorCap, 'policy.authorCap', 1, 12);
  num(p.maxAge, 'policy.maxAge', 0, 87600);
  num(p.diversity, 'policy.diversity', 0, 1);
  const weights = {};
  for (const k of keys) { num(p.weights[k], `policy.weights.${k}`, 0, 1); weights[k] = p.weights[k]; }
  if (!Array.isArray(p.muted) || p.muted.length > 120) fail('policy.muted must be an array (max 120).');
  p.muted.forEach(v => str(v, 'Muted topic', 60));
  return {schema: 1, name: raw.name, items, policy: {k: p.k, authorCap: p.authorCap, maxAge: p.maxAge, diversity: p.diversity, muted: [...new Set(p.muted)], weights}};
}
export function rank(s) {
  const p = s.policy, authors = new Map(), topics = new Map();
  const rows = s.items.map(v => {
    const parts = Object.fromEntries(keys.map(k => [k, v.signals[k] * p.weights[k]]));
    const blocks = [];
    if (!v.retrieved) blocks.push('retrieval');
    if (v.age > p.maxAge) blocks.push('age');
    if (p.muted.includes(v.topic)) blocks.push('muted');
    return {...v, parts, score: keys.reduce((n, k) => n + parts[k], 0), blocks, status: blocks.length ? 'filtered' : 'eligible', position: null, utility: null, penalty: null};
  });
  const chosen = [], trace = [];
  for (let slot = 0; slot < p.k; slot++) {
    const pool = rows.filter(v => v.status === 'eligible' && (authors.get(v.author) || 0) < p.authorCap);
    const order = pool.map(v => ({v, penalty: p.diversity * (topics.get(v.topic) || 0)})).map(x => ({...x, utility: x.v.score - x.penalty})).sort((a, b) => b.utility - a.utility || cmp(a.v.id, b.v.id));
    if (!order.length) break;
    const x = order[0], v = x.v;
    trace.push({slot: slot + 1, winner: v.id, candidates: order.map(x => ({id: x.v.id, utility: x.utility, penalty: x.penalty}))});
    v.status = 'selected'; v.position = slot + 1; v.utility = x.utility; v.penalty = x.penalty;
    chosen.push(v);
    authors.set(v.author, (authors.get(v.author) || 0) + 1);
    topics.set(v.topic, (topics.get(v.topic) || 0) + 1);
  }
  for (const v of rows) if (v.status === 'eligible') v.status = (authors.get(v.author) || 0) >= p.authorCap ? 'author-cap' : 'below-cut';
  return {rows, chosen, trace};
}
export function actionsFor(s, id) {
  const v = s.items.find(x => x.id === id);
  if (!v) throw new Error('Unknown candidate.');
  const p = s.policy, actions = [];
  if (!v.retrieved) actions.push({id: 'retrieve', label: 'Recall this candidate', note: 'Only this item enters the candidate pool.'});
  if (v.age > p.maxAge) actions.push({id: 'age', label: `Extend age limit to ${v.age}h`, note: 'Applies to every item, not just this one.'});
  if (p.muted.includes(v.topic)) actions.push({id: 'unmute', label: `Unmute “${v.topic}”`, note: 'Allows every item in this topic.'});
  if (p.authorCap < p.k) actions.push({id: 'cap', label: 'Remove author cap', note: `At most ${p.k} items per author.`});
  if (p.diversity > 0) actions.push({id: 'diversity', label: 'Remove topic penalty', note: 'Repeated topics no longer lose points.'});
  for (const k of keys) if (p.weights[k] < 1) actions.push({id: k, label: `Set ${k} weight to 1`, note: 'Changes scores for all candidates.'});
  return actions;
}
export function applyActions(s, id, actions) {
  const next = structuredClone(s), v = next.items.find(x => x.id === id), p = next.policy;
  if (!v) throw new Error('Unknown candidate.');
  for (const key of actions) {
    if (key === 'retrieve') v.retrieved = true;
    else if (key === 'age') p.maxAge = Math.max(p.maxAge, v.age);
    else if (key === 'unmute') p.muted = p.muted.filter(x => x !== v.topic);
    else if (key === 'cap') p.authorCap = p.k;
    else if (key === 'diversity') p.diversity = 0;
    else if (keys.includes(key)) p.weights[key] = 1;
    else throw new Error(`Unknown action: ${key}`);
  }
  return next;
}
export function minimalMasks(wins) {
  // Check EVERY strict subset: greedy reranking need not be monotone.
  const found = [];
  for (let mask = 0; mask < wins.length; mask++) {
    if (!wins[mask]) continue;
    let minimal = true;
    if (mask) {
      let sub = (mask - 1) & mask;
      while (true) {
        if (wins[sub]) { minimal = false; break; }
        if (!sub) break;
        sub = (sub - 1) & mask;
      }
    }
    if (minimal) found.push(mask);
  }
  return found.sort((a, b) => popcount(a) - popcount(b) || a - b);
}
const popcount = v => v.toString(2).replaceAll('0', '').length;
export function findRepairs(s, id) {
  const menu = actionsFor(s, id), before = rank(s), count = 2 ** menu.length;
  const masks = Array.from({length: count}, (_, m) => menu.filter((_, i) => m & (1 << i)).map(v => v.id));
  const lists = masks.map(a => rank(applyActions(s, id, a)).chosen.map(v => v.id));
  const wins = lists.map(ids => ids.includes(id));
  const base = before.chosen.map(v => v.id);
  return {menu, searched: count, successful: wins.filter(Boolean).length, repairs: minimalMasks(wins).map(mask => ({mask, actions: masks[mask], position: lists[mask].indexOf(id) + 1, entered: lists[mask].filter(v => !base.includes(v)), displaced: base.filter(v => !lists[mask].includes(v)), selected: lists[mask]}))};
}
export function makeReport(s, id) {
  return {format: 'unseen-report', version, scope: 'Exact only for this deterministic model and finite action menu. Not a claim about any live platform.', scenario: validate(s), target: id, ranking: rank(s), search: findRepairs(s, id)};
}
