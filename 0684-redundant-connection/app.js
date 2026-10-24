const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const source = `class Solution:
    def findRedundantConnection(self, edges: list[list[int]]) -> list[int]:
        n = len(edges)
        parent = list(range(n + 1))     # 一開始每個點的上司都是自己

        def find(x):
            if parent[x] != x:
                parent[x] = find(parent[x])    # 路徑壓縮
            return parent[x]

        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:                # 已經在同一組 → 這條邊造成環
                return [a, b]
            parent[ra] = rb             # 合併兩組`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
const R = 17;
const GW = 300;
const GH = 290;
const SP = 50;
const LV = 66;
const PAD = 34;
let edges;
let n;
let frames;
let layouts;
let step = 0;
let timer = null;
let shown = {};
let anim = 0;
const els = {graph: [], edges: [], forest: [], links: [], loops: []};
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
const rootOf = (parent, x) => {
  while (parent[x] !== x) x = parent[x];
  return x;
};
// Spread group colours around the wheel so neighbouring roots differ.
const hue = (root) => (root * 137 + 200) % 360;
function forestLayout(parent) {
  // Leaves take the next column; a parent sits over its children.
  const kids = Array.from({length: n + 1}, () => []);
  for (let x = 1; x <= n; x++) if (parent[x] !== x) kids[parent[x]].push(x);
  const pos = [];
  let col = 0;
  let depth = 0;
  const place = (x, d) => {
    depth = Math.max(depth, d);
    if (!kids[x].length) {
      pos[x] = {x: PAD + col++ * SP, y: PAD + d * LV};
      return;
    }
    kids[x].forEach((c) => place(c, d + 1));
    const xs = kids[x].map((c) => pos[c].x);
    pos[x] = {x: (Math.min(...xs) + Math.max(...xs)) / 2, y: PAD + d * LV};
  };
  for (let x = 1; x <= n; x++) if (parent[x] === x) place(x, 0);
  return {pos, depth};
}
function graphPos(i) {
  const t = -Math.PI / 2 + ((i - 1) * 2 * Math.PI) / n;
  const r = Math.min(110, 40 + n * 9);
  return {x: GW / 2 + r * Math.cos(t), y: GH / 2 + r * Math.sin(t)};
}
function build() {
  layouts = frames.map((f) => forestLayout(f.parent));
  for (const id of ['g-edges', 'g-nodes', 'f-links', 'f-nodes']) {
    $(id).replaceChildren();
  }
  for (const key of Object.keys(els)) els[key] = [];
  shown = {};
  const graph = $('graph');
  graph.setAttribute('viewBox', `0 0 ${GW} ${GH}`);
  edges.forEach(([a, b]) => {
    const p = graphPos(a);
    const q = graphPos(b);
    els.edges.push(
      svg(
        'line',
        {class: 'g-edge', x1: p.x, y1: p.y, x2: q.x, y2: q.y, pathLength: 1},
        $('g-edges'),
      ),
    );
  });
  for (let x = 1; x <= n; x++) {
    const p = graphPos(x);
    const g = svg('g', {class: 'gnode'}, $('g-nodes'));
    g.setAttribute('transform', `translate(${p.x} ${p.y})`);
    svg('circle', {class: 'halo', r: R + 6}, g);
    svg('circle', {class: 'body', r: R}, g);
    svg('text', {class: 'label', y: 5}, g).textContent = x;
    els.graph[x] = g;
    els.links[x] = svg('line', {class: 'f-link', pathLength: 1}, $('f-links'));
    els.loops[x] = svg('path', {class: 'f-loop'}, $('f-links'));
    const f = svg('g', {class: 'fnode'}, $('f-nodes'));
    svg('circle', {class: 'halo', r: R + 6}, f);
    svg('circle', {class: 'body', r: R}, f);
    svg('text', {class: 'label', y: 5}, f).textContent = x;
    els.forest[x] = f;
  }
  const depth = Math.max(...layouts.map((l) => l.depth));
  const width = PAD * 2 + (n - 1) * SP;
  const height = PAD * 2 + depth * LV + 6;
  const forest = $('forest');
  forest.setAttribute('viewBox', `0 ${-14} ${width} ${height + 14}`);
  forest.setAttribute('width', width);
  forest.setAttribute('height', height + 14);
}
function draw(at) {
  const parent = frames[step].parent;
  for (let x = 1; x <= n; x++) {
    const p = at[x];
    els.forest[x].setAttribute('transform', `translate(${p.x} ${p.y})`);
    const link = els.links[x];
    const loop = els.loops[x];
    if (parent[x] === x) {
      link.style.display = 'none';
      loop.style.display = '';
      loop.setAttribute(
        'd',
        `M${p.x - 7} ${p.y - R}C${p.x - 16} ${p.y - R - 22} ${p.x + 16} ${
          p.y - R - 22
        } ${p.x + 7} ${p.y - R - 1}`,
      );
      continue;
    }
    loop.style.display = 'none';
    link.style.display = '';
    const q = at[parent[x]];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    link.setAttribute('x1', p.x + (dx / len) * R);
    link.setAttribute('y1', p.y + (dy / len) * R);
    link.setAttribute('x2', q.x - (dx / len) * (R + 3));
    link.setAttribute('y2', q.y - (dy / len) * (R + 3));
  }
}
const ease = (t) => 1 - Math.pow(1 - t, 3);
function tween(pos) {
  cancelAnimationFrame(anim);
  const from = shown;
  const duration = reduce.matches
    ? 0
    : Math.min(460, Number($('speed').value) * 0.55);
  const start = performance.now();
  const frame = (now) => {
    const t = duration ? ease(Math.min(1, (now - start) / duration)) : 1;
    const at = [];
    for (let x = 1; x <= n; x++) {
      const a = from[x] ?? pos[x];
      at[x] = {x: a.x + (pos[x].x - a.x) * t, y: a.y + (pos[x].y - a.y) * t};
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
function renderFormula(f) {
  const before = frames[step - 1];
  const top = f.stack.at(-1);
  const parts = [];
  if (f.phase === 'init') {
    parts.push(chip(`parent = [${f.parent.join(', ')}]`));
  } else if (f.phase === 'edge') {
    parts.push(
      chip(`[a, b] = [${f.vars.a}, ${f.vars.b}]`, 'cur strong'),
      op('→'),
      chip(`find(${f.vars.a})`),
      op('、'),
      chip(`find(${f.vars.b})`),
    );
  } else if (f.phase === 'descend') {
    parts.push(
      chip(`parent[${top.x}] = ${f.parent[top.x]}`, 'cur'),
      op(`≠ ${top.x}`),
      op('→'),
      chip(`find(${f.parent[top.x]})`, 'cur strong'),
    );
  } else if (f.phase === 'root') {
    parts.push(
      chip(`parent[${f.root}] == ${f.root}`, 'root'),
      op('→'),
      chip(`return ${f.root}`, 'root strong'),
    );
  } else if (f.phase === 'compress') {
    parts.push(
      chip(`parent[${f.node}]`, 'cur'),
      op(':'),
      chip(String(f.from), 'old'),
      op('→'),
      chip(String(f.root), 'hot strong'),
    );
  } else if (f.phase === 'found') {
    const key = 'rb' in f.vars ? 'rb' : 'ra';
    parts.push(chip(`${key} = ${f.vars[key]}`, 'root strong'));
  } else if (f.phase === 'compare' || f.phase === 'cycle') {
    const same = f.phase === 'cycle';
    parts.push(
      chip(`ra = ${f.vars.ra}`, 'root'),
      op(same ? '==' : '≠'),
      chip(`rb = ${f.vars.rb}`, 'root'),
      op('→'),
      chip(
        same ? `return [${f.answer.join(', ')}]` : '合併',
        same ? 'bad strong' : 'done strong',
      ),
    );
  } else if (f.phase === 'union') {
    parts.push(
      chip(`parent[${f.merged}]`, 'cur'),
      op(':'),
      chip(String(before.parent[f.merged]), 'old'),
      op('→'),
      chip(String(f.into), 'hot strong'),
    );
  } else {
    parts.push(op('return'), chip('None', 'strong'));
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
  const before = frames[step - 1];
  const changed = new Set(f.changed);
  const seen = new Set(f.added.flatMap((k) => edges[k]));
  const onStack = new Set(f.stack.map((s) => s.x));
  const top = f.stack.at(-1)?.x;
  const cycle = f.phase === 'cycle';
  const current = f.edge >= 0 && f.edge < n ? edges[f.edge] : [];
  els.edges.forEach((line, k) => {
    const shownEdge = f.added.includes(k);
    line.classList.toggle('shown', shownEdge);
    line.classList.toggle('cur', k === f.edge && !cycle);
    line.classList.toggle('bad', k === f.edge && cycle);
    if (k === f.edge && f.phase === 'edge') replay(line, 'draw');
  });
  for (let x = 1; x <= n; x++) {
    const root = rootOf(f.parent, x);
    for (const g of [els.graph[x], els.forest[x]]) {
      g.style.setProperty('--hue', hue(root));
      g.classList.toggle('ghost', !seen.has(x));
      g.classList.toggle('end', current.includes(x));
      g.classList.toggle('bad', cycle && current.includes(x));
    }
    const fx = els.forest[x];
    fx.classList.toggle('path', onStack.has(x) && x !== top);
    fx.classList.toggle('cur', x === top && f.phase !== 'root');
    fx.classList.toggle(
      'root',
      (f.phase === 'root' || f.phase === 'found') && x === (f.root ?? -1),
    );
    fx.classList.toggle(
      'boss',
      x === f.vars.ra || x === f.vars.rb || x === f.into,
    );
    const link = els.links[x];
    link.classList.toggle('hot', changed.has(x));
    link.classList.toggle('ghost', !seen.has(x));
    if (changed.has(x)) replay(link, 'draw');
    els.loops[x].classList.toggle('ghost', !seen.has(x));
  }
  tween(layouts[step].pos);
  const cells = f.parent.map((v, i) => {
    const cell = document.createElement('span');
    cell.className = 'cell-p';
    cell.innerHTML = `<b>${i ? v : '—'}</b><small>${i}</small>`;
    if (!i) cell.classList.add('unused');
    else {
      cell.style.setProperty('--hue', hue(rootOf(f.parent, i)));
      cell.classList.toggle('self', v === i);
      cell.classList.toggle('on', onStack.has(i));
    }
    if (before && before.parent[i] !== v) {
      cell.classList.add('changed');
      cell.classList.add('bump');
    }
    return cell;
  });
  $('parent').replaceChildren(...cells);
  const calls = f.stack.map((s, k) => {
    const el = chip(
      s.ret === undefined ? `find(${s.x})` : `find(${s.x}) → ${s.ret}`,
      k === f.stack.length - 1 ? 'cur strong' : 'cur',
    );
    el.style.setProperty('--k', 0);
    return el;
  });
  if (!calls.length) calls.push(chip('沒有進行中的 find', 'empty'));
  $('stack').replaceChildren(...calls);
  $('edge-list').replaceChildren(
    ...edges.map(([a, b], k) => {
      const cls =
        k === f.edge
          ? cycle
            ? 'bad strong'
            : 'cur strong'
          : k < f.edge
            ? 'done'
            : 'todo';
      const el = chip(`[${a},${b}]`, cls);
      el.style.setProperty('--k', 0);
      return el;
    }),
  );
  renderFormula(f);
  $('edge-no').textContent =
    f.edge < 0 ? '—' : f.edge >= n ? '完成' : `${f.edge + 1} / ${n}`;
  $('ab').textContent = 'a' in f.vars ? `[${f.vars.a}, ${f.vars.b}]` : '—';
  $('ra').textContent = f.vars.ra ?? '—';
  $('rb').textContent = f.vars.rb ?? '—';
  $('phase').textContent = {
    init: 'INITIALIZE',
    edge: 'ADD EDGE',
    descend: 'FIND',
    root: 'ROOT',
    compress: 'COMPRESS',
    found: 'FIND DONE',
    compare: 'COMPARE',
    union: 'UNION',
    cycle: 'CYCLE',
    none: 'COMPLETE',
  }[f.phase];
  const focus = top ?? f.merged;
  if (focus) {
    const scroll = $('forest-scroll');
    scroll.scrollTo({
      left: Math.max(0, layouts[step].pos[focus].x - scroll.clientWidth / 2),
      behavior: reduce.matches ? 'auto' : 'smooth',
    });
  }
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent =
    f.phase === 'cycle'
      ? `findRedundantConnection(…) = [${f.answer.join(', ')}]`
      : f.phase === 'none'
        ? 'findRedundantConnection(…) = None'
        : '';
  $('step-label').textContent = `STEP ${String(step + 1).padStart(2, '0')}`;
  $('counter').textContent = `${step + 1} / ${frames.length}`;
  $('seek').max = frames.length - 1;
  $('seek').value = step;
  $('prev').disabled = step === 0;
  $('next').disabled = step === frames.length - 1;
  [...$('code').children].forEach((row, i) =>
    row.classList.toggle('active', f.line.includes(i + 1)),
  );
  if (step === frames.length - 1) pause();
  else if (!timer) $('play').textContent = '播放動畫';
}
function load() {
  pause();
  try {
    const raw = $('edges').value.trim();
    if (!/^[\d\s,[\]，]*$/.test(raw)) {
      throw new Error('edges 請用 [[a, b], …] 的格式。');
    }
    const nums = (raw.match(/\d+/g) ?? []).map(Number);
    if (nums.length % 2) throw new Error('每條邊需要兩個數字 [a, b]。');
    const list = [];
    for (let k = 0; k < nums.length; k += 2) list.push([nums[k], nums[k + 1]]);
    frames = unionTrace(list);
    edges = list;
    n = list.length;
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
  classic: '[[1,2],[1,3],[2,3]]',
  square: '[[1,2],[2,3],[3,4],[1,4],[1,5]]',
  chain: '[[1,2],[2,3],[3,4],[4,5],[5,1]]',
  last: '[[1,2],[2,3],[4,3],[4,5],[5,6],[1,6]]',
  star: '[[1,2],[1,3],[1,4],[1,5],[3,5]]',
  merge: '[[1,2],[3,4],[2,4],[1,3]]',
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      $('edges').value = examples[button.dataset.example];
      load();
    }),
);
load();
