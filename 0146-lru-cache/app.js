const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const source = `class Node:
    def __init__(self, key, val):
        self.key = key
        self.val = val
        self.prev = None
        self.nxt = None

class LRUCache:

    def __init__(self, capacity: int):
        self.cache = {}
        self.capacity = capacity
        self.left, self.right = Node(0, 0), Node(0, 0)
        self.left.nxt, self.right.prev = self.right, self.left

    def insert(self, node):
        cur_head = self.right.prev
        cur_head.nxt, self.right.prev = node, node
        node.prev, node.nxt = cur_head, self.right

    def remove(self, node):
        cur_prev = node.prev
        cur_nxt = node.nxt
        cur_prev.nxt = cur_nxt
        cur_nxt.prev = cur_prev

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        if key in self.cache:
            node = self.cache[key]
            self.remove(node)
            self.insert(node)

        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.remove(self.cache[key])

        node = Node(key, value)
        self.cache[key] = node
        self.insert(node)

        if len(self.cache) > self.capacity:
            lru = self.left.nxt
            self.remove(lru)
            del self.cache[lru.key]`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
// Board geometry. A node is a module: an id header over [prev | data | nxt].
const W = 110;
const H = 72;
const HEAD = 22;
const PORT = 28;
const NXT_Y = HEAD + 18;
const PREV_Y = HEAD + 36;
const SLOT = 164;
const PAD = 24;
const DICT_Y = 30;
const DW = 64;
const DH = 34;
const DGAP = 14;
const LIST_Y = 150;
const OUT_Y = LIST_Y + H + 92;
const HEIGHT = OUT_Y + H + 46;
let capacity;
let operations;
let frames;
let layouts;
let step = 0;
let timer = null;
const els = {nodes: {}, wires: {}, dict: {}, links: {}};
let shown = {};
let anim = 0;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
function pause() {
  clearInterval(timer);
  timer = null;
  $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫';
}
function svg(tag, attrs, parent) {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent.append(el);
  return el;
}
function walk(f) {
  // Follow nxt from left; right always closes the row so the layout stays
  // stable while an insert is half done.
  if (!f.nodes.left) return [];
  const chain = ['left'];
  const seen = new Set(chain);
  let id = f.nodes.left.nxt;
  while (id && id !== 'right' && !seen.has(id)) {
    chain.push(id);
    seen.add(id);
    id = f.nodes[id].nxt;
  }
  chain.push('right');
  return chain;
}
function computeLayouts() {
  // Positions depend on history (a detached node stays under its old slot),
  // so every frame is laid out once, in order, and seeking stays exact.
  const lastX = {};
  let before = {nodes: new Set(), keys: []};
  return frames.map((f) => {
    const chain = walk(f);
    const inChain = new Set(chain);
    const pos = {};
    chain.forEach((id, k) => {
      pos[id] = {x: PAD + k * SLOT, y: LIST_Y, a: 1};
      lastX[id] = pos[id].x;
    });
    const held = new Set([
      ...f.cache.map(([, id]) => id),
      ...Object.values(f.locals),
    ]);
    const rightX = pos.right?.x ?? PAD;
    const alive = new Set(chain);
    for (const id of Object.keys(f.nodes)) {
      if (inChain.has(id)) continue;
      // A brand-new node waits under right, or one slot further if an old
      // node being replaced already sits there.
      const taken = Object.values(pos).some(
        (p) => p.y === OUT_Y && p.x === rightX,
      );
      const x = lastX[id] ?? rightX + (taken ? SLOT : 0);
      lastX[id] = x;
      if (held.has(id)) {
        pos[id] = {x, y: OUT_Y, a: 1};
        alive.add(id);
      } else if (before.nodes.has(id)) {
        pos[id] = {x, y: OUT_Y, a: 0, gone: true};
      }
    }
    const keys = f.cache.map(([key]) => key);
    const dict = {};
    keys.forEach((key, k) => {
      dict[key] = {x: PAD + k * (DW + DGAP), y: DICT_Y, a: 1};
    });
    before.keys.forEach(({key, x}) => {
      if (!(key in dict)) dict[key] = {x, y: DICT_Y, a: 0, gone: true};
    });
    before = {
      nodes: alive,
      keys: keys.map((key) => ({key, x: dict[key].x})),
    };
    return {chain, inChain, pos, dict};
  });
}
function nodeText(g, cls, x, y, text) {
  const el = svg('text', {class: cls, x, y}, g);
  el.textContent = text;
  return el;
}
function build() {
  layouts = computeLayouts();
  for (const group of ['wires', 'dict', 'nodes', 'flags']) {
    $(group).replaceChildren();
  }
  for (const key of Object.keys(els)) els[key] = {};
  shown = {};
  const last = frames.at(-1);
  const keys = new Set(frames.flatMap((f) => f.cache.map(([key]) => key)));
  for (const id of Object.keys(last.nodes)) {
    for (const field of ['prev', 'nxt']) {
      const path = svg(
        'path',
        {class: `wire ${field}`, pathLength: 1},
        $('wires'),
      );
      els.wires[`${id}.${field}`] = path;
    }
  }
  for (const key of keys) {
    els.links[key] = svg(
      'path',
      {class: 'wire dict', pathLength: 1},
      $('wires'),
    );
    const g = svg('g', {class: 'entry'}, $('dict'));
    svg('rect', {class: 'slot', width: DW, height: DH, rx: 8}, g);
    nodeText(g, 'entry-key', DW / 2, DH / 2 + 5, key);
    els.dict[key] = g;
  }
  for (const [id, n] of Object.entries(last.nodes)) {
    const sentinel = id === 'left' || id === 'right';
    const g = svg(
      'g',
      {class: `node${sentinel ? ' sentinel' : ''}`},
      $('nodes'),
    );
    svg(
      'rect',
      {class: 'halo', x: -5, y: -5, width: W + 10, height: H + 10, rx: 14},
      g,
    );
    svg('rect', {class: 'box', width: W, height: H, rx: 10}, g);
    svg(
      'path',
      {
        class: 'rule',
        d: `M0 ${HEAD}H${W}M${PORT} ${HEAD}V${H}M${W - PORT} ${HEAD}V${H}`,
      },
      g,
    );
    nodeText(g, 'node-id', 10, 15, id);
    nodeText(g, 'node-tag', W - 10, 15, sentinel ? '哨兵' : 'Node');
    nodeText(g, 'port-name', PORT / 2, HEAD + 12, 'prev');
    nodeText(g, 'port-name', W - PORT / 2, HEAD + 12, 'nxt');
    const prev = nodeText(g, 'port', PORT / 2, PREV_Y + 4, '');
    const nxt = nodeText(g, 'port', W - PORT / 2, NXT_Y + 4, '');
    if (sentinel) {
      nodeText(g, 'data dim', W / 2, HEAD + 30, '0 : 0');
    } else {
      nodeText(g, 'data', W / 2, HEAD + 22, `key ${n.key}`);
      nodeText(g, 'data val', W / 2, HEAD + 40, `val ${n.val}`);
    }
    const flag = svg('g', {class: 'flag'}, $('flags'));
    svg('path', {class: 'flag-stem', d: `M${W / 2} ${H + 2}V${H + 12}`}, flag);
    const pill = svg(
      'rect',
      {class: 'flag-pill', y: H + 12, height: 20, rx: 10},
      flag,
    );
    const label = nodeText(flag, 'flag-text', W / 2, H + 26, '');
    els.nodes[id] = {g, prev, nxt, flag, pill, label};
  }
  const width = Math.max(
    ...layouts.flatMap((l) => Object.values(l.pos).map((p) => p.x + W + PAD)),
    ...layouts.flatMap((l) => Object.values(l.dict).map((p) => p.x + DW + PAD)),
    PAD * 2 + W,
  );
  const board = $('board');
  board.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
  board.setAttribute('width', width);
  board.setAttribute('height', HEIGHT);
  $('zone-out').setAttribute('y', OUT_Y - 14);
}
function curve(sx, sy, ex, ey, dir) {
  // A pointer leaves its port and enters the target's side head-on;
  // a pointer that runs backwards swings above (nxt) or below (prev).
  const dx = (ex - sx) * dir;
  if (dx < 20 && Math.abs(ey - sy) < 30) {
    const lift = dir > 0 ? -64 : 64;
    return `M${sx} ${sy}C${sx + dir * 60} ${sy + lift} ${ex - dir * 60} ${
      ey + lift
    } ${ex} ${ey}`;
  }
  const k = Math.min(140, Math.max(30, Math.abs(ex - sx) * 0.42));
  return `M${sx} ${sy}C${sx + dir * k} ${sy} ${ex - dir * k} ${ey} ${ex} ${ey}`;
}
function draw(at) {
  const f = frames[step];
  for (const [id, el] of Object.entries(els.nodes)) {
    const p = at.nodes[id];
    if (!p) {
      el.g.style.display = 'none';
      el.flag.style.display = 'none';
      continue;
    }
    el.g.style.display = '';
    el.flag.style.display = '';
    el.g.setAttribute('transform', `translate(${p.x} ${p.y})`);
    el.flag.setAttribute('transform', `translate(${p.x} ${p.y})`);
    el.g.style.opacity = p.a;
    el.flag.style.opacity = p.a;
  }
  for (const [name, path] of Object.entries(els.wires)) {
    const [id, field] = name.split('.');
    const to = f.nodes[id]?.[field];
    const a = at.nodes[id];
    const b = to && at.nodes[to];
    if (!a || !b) {
      path.style.display = 'none';
      continue;
    }
    path.style.display = '';
    path.style.opacity = Math.min(a.a, b.a);
    path.setAttribute(
      'd',
      field === 'nxt'
        ? curve(a.x + W - PORT / 2, a.y + NXT_Y, b.x, b.y + NXT_Y, 1)
        : curve(a.x + PORT / 2, a.y + PREV_Y, b.x + W, b.y + PREV_Y, -1),
    );
  }
  const owner = new Map(frames[step].cache);
  const ghost = new Map(frames[step - 1]?.cache ?? []);
  for (const [key, g] of Object.entries(els.dict)) {
    const p = at.dict[key];
    const link = els.links[key];
    if (!p) {
      g.style.display = 'none';
      link.style.display = 'none';
      continue;
    }
    g.style.display = '';
    g.setAttribute('transform', `translate(${p.x} ${p.y})`);
    g.style.opacity = p.a;
    const id = owner.get(Number(key)) ?? ghost.get(Number(key));
    const n = id && at.nodes[id];
    if (!n) {
      link.style.display = 'none';
      continue;
    }
    link.style.display = '';
    link.style.opacity = Math.min(p.a, n.a);
    const sx = p.x + DW / 2;
    const sy = p.y + DH;
    const ex = n.x + W / 2;
    const ey = n.y - 2;
    const k = Math.max(30, (ey - sy) * 0.5);
    link.setAttribute(
      'd',
      `M${sx} ${sy}C${sx} ${sy + k} ${ex} ${ey - k} ${ex} ${ey}`,
    );
  }
}
const ease = (t) => 1 - Math.pow(1 - t, 3);
function snapshot(layout) {
  const nodes = {};
  for (const [id, p] of Object.entries(layout.pos)) nodes[id] = {...p};
  const dict = {};
  for (const [key, p] of Object.entries(layout.dict)) dict[key] = {...p};
  return {nodes, dict};
}
function tween(layout) {
  cancelAnimationFrame(anim);
  const target = snapshot(layout);
  const from = shown;
  const duration = reduce.matches
    ? 0
    : Math.min(460, Number($('speed').value) * 0.55);
  const start = performance.now();
  const mix = (a, b, t) => {
    // Something new fades in where it lands; something leaving fades in place.
    const s = a ?? {...b, a: 0};
    return {
      x: s.x + (b.x - s.x) * t,
      y: s.y + (b.y - s.y) * t,
      a: s.a + (b.a - s.a) * t,
    };
  };
  const frame = (now) => {
    const t = duration ? ease(Math.min(1, (now - start) / duration)) : 1;
    const at = {nodes: {}, dict: {}};
    for (const group of ['nodes', 'dict']) {
      for (const [id, p] of Object.entries(target[group])) {
        at[group][id] = mix(from[group]?.[id], p, t);
      }
    }
    shown = at;
    draw(at);
    if (t < 1) anim = requestAnimationFrame(frame);
  };
  anim = requestAnimationFrame(frame);
}
function chip(text, cls = '') {
  const el = document.createElement('span');
  el.className = `chip ${cls}`;
  el.textContent = text;
  return el;
}
const op = (text) => chip(text, 'op');
const show = (v) => (v === null || v === undefined ? 'None' : String(v));
function renderFormula(f) {
  const before = frames[step - 1];
  const parts = [];
  if (f.phase === 'link') {
    f.changed.forEach((name, k) => {
      const [id, field] = name.split('.');
      if (k) parts.push(op('，'));
      parts.push(
        chip(`${id}.${field}`, field),
        op(':'),
        chip(show(before?.nodes[id]?.[field]), 'old'),
        op('→'),
        chip(show(f.nodes[id][field]), 'hot strong'),
      );
    });
  } else if (f.phase === 'cache') {
    const id = new Map(f.cache).get(f.key);
    parts.push(
      id
        ? chip(`cache[${f.key}] = ${id}`, 'dict strong')
        : chip(`del cache[${f.key}]`, 'bad strong'),
    );
    if (f.dropped) {
      const note = id ? '沒有人指向' : '已不在字典裡';
      parts.push(op('→'), chip(`${f.dropped} ${note}`, 'old'));
    }
  } else if (f.phase === 'lookup') {
    parts.push(
      chip(`${f.key} in cache`, 'dict'),
      op('→'),
      chip(f.hit ? 'True' : 'False', f.hit ? 'done strong' : 'bad strong'),
    );
    if (f.locals.node) {
      parts.push(op('，'), chip(`node = ${f.locals.node}`, 'cur'));
    }
  } else if (f.phase === 'create') {
    const n = f.nodes[f.locals.node];
    parts.push(
      chip(`Node(${n.key}, ${n.val})`),
      op('→'),
      chip(f.locals.node, 'cur strong'),
      op('prev = nxt = None'),
    );
  } else if (f.phase === 'capacity') {
    parts.push(
      chip(`len(cache) = ${f.cache.length}`, 'dict'),
      op(f.over ? '>' : '≤'),
      chip(`capacity = ${capacity}`),
      op('→'),
      chip(f.over ? '淘汰' : '保留', f.over ? 'bad strong' : 'done strong'),
    );
  } else if (f.phase === 'evict') {
    parts.push(chip(`lru = left.nxt = ${f.locals.lru}`, 'bad strong'));
  } else if (f.phase === 'remove' || f.phase === 'insert') {
    for (const [name, id] of Object.entries(f.locals)) {
      if (parts.length) parts.push(op('，'));
      parts.push(chip(`${name} = ${id}`, name === 'node' ? 'cur' : 'local'));
    }
  } else if (f.phase === 'return') {
    const value = f.results.at(-1);
    parts.push(op('return'), chip(show(value), 'done strong'));
  } else if (f.phase === 'call') {
    const [type, ...args] = operations[f.operation];
    parts.push(chip(`${type}(${args.join(', ')})`, 'cur strong'));
  } else if (f.phase === 'done') {
    parts.push(op('輸出'), chip(JSON.stringify(f.results), 'done strong'));
  } else {
    parts.push(chip(`cache = {}`, 'dict'), chip(`capacity = ${capacity}`));
  }
  parts.forEach((p, k) => p.style.setProperty('--k', k));
  $('formula').replaceChildren(...parts);
}
function replay(el, cls) {
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
}
function render() {
  const f = frames[step];
  const layout = layouts[step];
  const changed = new Set(f.changed);
  const flags = {};
  for (const [name, id] of Object.entries(f.locals)) {
    (flags[id] ??= []).push(name);
  }
  for (const [id, el] of Object.entries(els.nodes)) {
    const n = f.nodes[id];
    const p = layout.pos[id];
    el.g.classList.toggle('out', !!p && !layout.inChain.has(id));
    el.g.classList.toggle('gone', !!p?.gone);
    el.g.classList.toggle('cur', f.locals.node === id);
    el.g.classList.toggle('lru', f.locals.lru === id);
    el.g.classList.toggle(
      'fresh',
      f.phase === 'create' && f.locals.node === id,
    );
    if (!n) continue;
    el.prev.textContent = n.prev ? '●' : '∅';
    el.nxt.textContent = n.nxt ? '●' : '∅';
    el.prev.classList.toggle('hot', changed.has(`${id}.prev`));
    el.nxt.classList.toggle('hot', changed.has(`${id}.nxt`));
    const names = flags[id] ?? [];
    el.flag.classList.toggle('empty', !names.length);
    el.label.textContent = names.join(' · ');
    const width = Math.max(36, names.join(' · ').length * 7.4 + 18);
    el.pill.setAttribute('x', W / 2 - width / 2);
    el.pill.setAttribute('width', width);
  }
  for (const [name, path] of Object.entries(els.wires)) {
    const [id] = name.split('.');
    const hot = changed.has(name);
    path.classList.toggle('hot', hot);
    path.classList.toggle('stale', !layout.inChain.has(id));
    if (hot) replay(path, 'draw');
  }
  const owner = new Map(f.cache);
  for (const [key, g] of Object.entries(els.dict)) {
    const k = Number(key);
    const hot =
      f.key === k && ((f.phase === 'lookup' && f.hit) || f.phase === 'cache');
    g.classList.toggle('hot', hot);
    g.classList.toggle('gone', !!layout.dict[key]?.gone);
    const link = els.links[key];
    link.classList.toggle('hot', hot && owner.has(k));
    link.classList.toggle('gone', !owner.has(k));
    if (f.phase === 'cache' && f.key === k && owner.has(k)) {
      replay(link, 'draw');
    }
  }
  tween(layout);
  renderFormula(f);
  const current = f.operation >= 0 && f.operation < operations.length;
  const [type, ...args] = current ? operations[f.operation] : [];
  $('operation').textContent = current
    ? `${f.operation + 1}/${operations.length} ${type}(${args.join(',')})`
    : f.phase === 'done'
      ? '完成'
      : '初始化';
  $('size').textContent = `${f.cache.length} / ${capacity}`;
  $('size').classList.toggle('over', f.cache.length > capacity);
  $('ret').textContent = f.phase === 'return' ? show(f.results.at(-1)) : '—';
  $('results').replaceChildren(
    ...(f.results.length
      ? f.results.map((value, k) => {
          const [t, ...a] = operations[k];
          const el = chip(
            `${t}(${a.join(',')}) → ${show(value)}`,
            value === -1 ? 'bad' : value === null ? '' : 'done',
          );
          el.style.setProperty('--k', 0);
          if (k === f.results.length - 1 && f.phase === 'return') {
            el.classList.add('new');
          }
          return el;
        })
      : [chip('尚無', 'empty')]),
  );
  $('phase').textContent = {
    init: 'INITIALIZE',
    link: 'POINTER WRITE',
    call: 'CALL',
    lookup: 'LOOKUP',
    remove: 'REMOVE',
    insert: 'INSERT',
    create: 'NEW NODE',
    cache: 'DICT WRITE',
    capacity: 'CAPACITY',
    evict: 'EVICT',
    return: 'RETURN',
    done: 'COMPLETE',
  }[f.phase];
  // Keep the node being worked on in view on narrow screens.
  const focus = f.locals.node ?? f.locals.lru;
  const p = focus && layout.pos[focus];
  if (p) {
    const scroll = $('scroll');
    scroll.scrollTo({
      left: Math.max(0, p.x + W / 2 - scroll.clientWidth / 2),
      behavior: reduce.matches ? 'auto' : 'smooth',
    });
  }
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent =
    f.phase === 'done' ? `輸出：${JSON.stringify(f.results)}` : '';
  $('step-label').textContent = `STEP ${String(step + 1).padStart(2, '0')}`;
  $('counter').textContent = `${step + 1} / ${frames.length}`;
  $('seek').max = frames.length - 1;
  $('seek').value = step;
  $('prev').disabled = step === 0;
  $('next').disabled = step === frames.length - 1;
  [...$('code').children].forEach((row, i) =>
    row.classList.toggle('active', f.line.includes(i + 1)),
  );
  const active = [...$('code').querySelectorAll('.active')].at(-1);
  if (active) {
    const box = $('code').getBoundingClientRect();
    const r = active.getBoundingClientRect();
    if (r.top < box.top || r.bottom > box.bottom) {
      $('code').scrollTop += r.top - box.top - 60;
    }
  }
  if (step === frames.length - 1) pause();
  else if (!timer) $('play').textContent = '播放動畫';
}
function parse(raw) {
  let ops;
  try {
    ops = JSON.parse(raw.replace(/'/g, '"').replace(/，/g, ','));
  } catch {
    throw new Error('操作請用 [["put", 1, 1], ["get", 1]] 這樣的 JSON 格式。');
  }
  return ops;
}
function load() {
  pause();
  try {
    const rawCap = $('capacity').value.trim();
    if (!/^\d+$/.test(rawCap)) throw new Error('capacity 請輸入正整數。');
    const ops = parse($('operations').value.trim());
    const result = lruTrace(Number(rawCap), ops);
    capacity = Number(rawCap);
    operations = ops;
    frames = result;
    step = 0;
    $('error').textContent = '';
    build();
    render();
  } catch (error) {
    $('error').textContent = error.message;
  }
}
function play() {
  if (timer) return pause();
  if (step === frames.length - 1) {
    step = 0;
    render();
  }
  $('play').textContent = '暫停';
  timer = setInterval(
    () => {
      step++;
      render();
    },
    Number($('speed').value),
  );
}
$('inputs').addEventListener('submit', (event) => {
  event.preventDefault();
  load();
});
$('play').onclick = play;
$('reset').onclick = () => {
  pause();
  step = 0;
  render();
};
$('prev').onclick = () => {
  pause();
  step = Math.max(0, step - 1);
  render();
};
$('next').onclick = () => {
  pause();
  step = Math.min(frames.length - 1, step + 1);
  render();
};
$('seek').oninput = () => {
  pause();
  step = Number($('seek').value);
  render();
};
$('speed').onchange = () => {
  if (timer) {
    pause();
    play();
  }
};
const examples = {
  classic: [
    2,
    '[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["put",4,4],["get",1],["get",3],["get",4]]',
  ],
  middle: [
    3,
    '[["put",1,1],["put",2,2],["put",3,3],["get",2],["put",4,4],["get",1]]',
  ],
  update: [
    2,
    '[["put",1,1],["put",2,2],["put",1,10],["get",1],["put",3,3],["get",2]]',
  ],
  one: [1, '[["put",2,1],["get",2],["put",3,2],["get",2],["get",3]]'],
  miss: [2, '[["get",1],["put",1,1],["get",2],["get",1]]'],
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      [$('capacity').value, $('operations').value] =
        examples[button.dataset.example];
      load();
    }),
);
load();
