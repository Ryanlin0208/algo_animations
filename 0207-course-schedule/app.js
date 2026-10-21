const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const source = `from collections import defaultdict, deque

class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        graph = defaultdict(list)         # graph[b] = 修完 b 之後可以解鎖的課
        indeg = [0] * numCourses          # indeg[a] = a 還有幾堂先修課沒修

        for a, b in prerequisites:
            graph[b].append(a)            # b → a
            indeg[a] += 1

        q = deque(i for i in range(numCourses) if indeg[i] == 0)
        taken = 0

        while q:
            course = q.popleft()
            taken += 1                    # 修掉這堂課
            for nxt in graph[course]:
                indeg[nxt] -= 1           # nxt 少了一堂先修課要等
                if indeg[nxt] == 0:       # 先修課全修完了
                    q.append(nxt)

        return taken == numCourses`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
// Graph geometry: courses are layered left → right by prerequisite depth.
const R = 22;
const COLW = 118;
const ROWH = 82;
const PAD = 46;
let n;
let frames;
let edges;
let step = 0;
let timer = null;
let pos = [];
const nodeEls = [];
const edgeEls = [];
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
function layout() {
  // Taken courses sit one column past their deepest prerequisite;
  // Kahn order guarantees parents are placed first.
  const last = frames.at(-1);
  const level = Array(n).fill(-1);
  for (const c of last.order) {
    level[c] = Math.max(
      0,
      ...edges.filter((e) => e.to === c).map((e) => level[e.from] + 1),
    );
  }
  const cols = [];
  last.order.forEach((c) => (cols[level[c]] ??= []).push(c));
  cols.forEach((col) => col.sort((a, b) => a - b));
  const stuck = last.stuck ?? [];
  // Courses that never free up sit on a ring so the cycle reads as a loop.
  const ring = stuck.length > 1 ? Math.max(58, stuck.length * 19) : 0;
  const tallest = Math.max(1, ...cols.map((c) => c.length));
  const height = Math.max(
    tallest * ROWH,
    ring * 2 + ROWH,
    stuck.length === 1 ? 2 * ROWH : 0,
  );
  const mid = PAD + height / 2;
  pos = [];
  cols.forEach((col, k) =>
    col.forEach((c, r) => {
      pos[c] = {
        x: PAD + 20 + k * COLW,
        y: mid + (r - (col.length - 1) / 2) * ROWH,
      };
    }),
  );
  const ringX = PAD + 20 + cols.length * COLW + (ring ? ring - 20 : 0);
  stuck.forEach((c, k) => {
    const t = -Math.PI / 2 + (k * 2 * Math.PI) / stuck.length;
    pos[c] = {x: ringX + ring * Math.cos(t), y: mid + 12 + ring * Math.sin(t)};
  });
  const width = Math.max(...pos.map((p) => p.x)) + PAD + 20;
  return {width, height: height + PAD * 2};
}
function edgePath(e, k) {
  const a = pos[e.from];
  const b = pos[e.to];
  if (e.from === e.to) {
    return `M${a.x - 12} ${a.y - R + 3}C${a.x - 34} ${a.y - 78} ${a.x + 34} ${
      a.y - 78
    } ${a.x + 12} ${a.y - R + 3}`;
  }
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // Bend every edge a little to the same side so a ↔ b pairs separate.
  const twin = edges.some(
    (o, j) => j !== k && o.from === e.to && o.to === e.from,
  );
  const bend = twin ? 26 : 10;
  const x1 = a.x + ux * (R + 2);
  const y1 = a.y + uy * (R + 2);
  const x2 = b.x - ux * (R + 6);
  const y2 = b.y - uy * (R + 6);
  const cx = (x1 + x2) / 2 - uy * bend;
  const cy = (y1 + y2) / 2 + ux * bend;
  return `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`;
}
function build() {
  const {width, height} = layout();
  const graph = $('graph');
  graph.setAttribute('viewBox', `0 0 ${width} ${height}`);
  graph.setAttribute('width', width);
  graph.setAttribute('height', height);
  $('edges').replaceChildren();
  $('nodes').replaceChildren();
  edgeEls.length = 0;
  nodeEls.length = 0;
  edges.forEach((e, k) => {
    const g = svg('g', {class: 'edge'}, $('edges'));
    const d = edgePath(e, k);
    const line = svg('path', {class: 'wire', d, pathLength: 1}, g);
    const comet = svg('path', {class: 'comet', d, pathLength: 1}, g);
    edgeEls.push({g, line, comet});
  });
  for (let c = 0; c < n; c++) {
    const g = svg('g', {class: 'node'}, $('nodes'));
    g.style.transform = `translate(${pos[c].x}px, ${pos[c].y}px)`;
    svg('circle', {class: 'halo', r: R + 7}, g);
    svg('circle', {class: 'body', r: R}, g);
    const label = svg('text', {class: 'label', y: 5}, g);
    label.textContent = c;
    const badge = svg('g', {class: 'badge'}, g);
    badge.style.transform = `translate(${R - 2}px, ${-R + 2}px)`;
    svg('circle', {r: 10}, badge);
    const deg = svg('text', {y: 4}, badge);
    nodeEls.push({g, badge, deg});
  }
  const row = $('indeg');
  row.replaceChildren();
  for (let c = 0; c < n; c++) {
    const cell = document.createElement('span');
    cell.className = 'deg';
    cell.innerHTML = `<b></b><small>${c}</small>`;
    row.append(cell);
  }
}
function chip(text, cls = '') {
  const el = document.createElement('span');
  el.className = `chip ${cls}`;
  el.textContent = text;
  return el;
}
const op = (text) => chip(text, 'op');
function renderFormula(f) {
  const parts = [];
  if (f.phase === 'init') {
    parts.push(chip('graph = {}'), chip(`indeg = [0] × ${n}`, 'deg-chip'));
  } else if (f.phase === 'edge') {
    parts.push(
      chip(`[a, b] = [${f.a}, ${f.b}]`),
      op('→'),
      chip(`graph[${f.b}].append(${f.a})`, 'path'),
      chip(`indeg[${f.a}] = ${f.indeg[f.a]}`, 'deg-chip strong'),
    );
  } else if (f.phase === 'seed') {
    parts.push(
      op('q ='),
      chip(f.q.length ? `[${f.q.join(', ')}]` : '[ ]', 'ready strong'),
      op('，'),
      chip('taken = 0', 'done'),
    );
  } else if (f.phase === 'pop') {
    parts.push(
      chip(`course = ${f.course}`, 'cur strong'),
      op('→'),
      chip(`taken = ${f.taken}`, 'done strong'),
    );
  } else if (f.phase === 'relax') {
    parts.push(
      chip(`${f.course} → ${f.nxt}`, 'path'),
      op('⇒'),
      chip(`indeg[${f.nxt}] = ${f.indeg[f.nxt]}`, 'deg-chip strong'),
      op(f.ready ? '== 0 ✓' : '≠ 0'),
    );
  } else if (f.phase === 'enqueue') {
    parts.push(
      chip(`q.append(${f.nxt})`, 'ready strong'),
      op('→'),
      chip(`q = [${f.q.join(', ')}]`, 'ready'),
    );
  } else {
    parts.push(
      op('return'),
      chip(`taken ${f.taken}`, 'done'),
      op('=='),
      chip(`numCourses ${n}`),
      op('→'),
      chip(
        f.answer ? 'True' : 'False',
        f.answer ? 'done strong' : 'bad strong',
      ),
    );
  }
  parts.forEach((p, k) => p.style.setProperty('--k', k));
  $('formula').replaceChildren(...parts);
}
function replay(el, cls) {
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
}
function chipRow(id, items, fresh, cls) {
  const row = $(id);
  const els = items.map((c) => {
    const el = chip(c, `${cls}${fresh.includes(c) ? ' new' : ''}`);
    el.style.setProperty('--k', 0);
    return el;
  });
  if (!els.length) els.push(chip('空', 'empty'));
  row.replaceChildren(...els);
}
function render() {
  const f = frames[step];
  const prev = frames[step - 1];
  const done = f.phase === 'done';
  const stuck = new Set(done ? f.stuck : []);
  // An edge is spent once its relax step has run.
  const spent = new Set();
  for (let k = 0; k <= step; k++) {
    if (frames[k].phase === 'relax') spent.add(frames[k].edge);
  }
  const hotEdge =
    f.phase === 'relax' || f.phase === 'enqueue'
      ? f.edge
      : f.phase === 'edge'
        ? f.edge
        : -1;
  edgeEls.forEach(({g, comet}, k) => {
    const e = edges[k];
    g.classList.toggle('shown', k < f.edges);
    g.classList.toggle('spent', spent.has(k) && k !== hotEdge);
    g.classList.toggle('hot', k === hotEdge);
    g.classList.toggle('bad', stuck.has(e.from) && stuck.has(e.to));
    if (k === hotEdge && f.phase === 'relax') replay(comet, 'run');
  });
  const queued = new Set(f.q);
  const taken = new Set(f.order);
  nodeEls.forEach(({g, badge, deg}, c) => {
    g.classList.toggle('taken', taken.has(c) && c !== f.course);
    g.classList.toggle('current', c === f.course && !done);
    g.classList.toggle('queued', queued.has(c));
    g.classList.toggle(
      'target',
      (f.phase === 'relax' || f.phase === 'enqueue') && c === f.nxt,
    );
    g.classList.toggle('fresh', f.phase === 'edge' && c === f.a);
    g.classList.toggle('stuck', stuck.has(c));
    g.classList.toggle('locked', f.indeg[c] > 0);
    deg.textContent = f.indeg[c];
    badge.classList.toggle('zero', f.indeg[c] === 0);
    if (prev && prev.indeg[c] !== f.indeg[c]) replay(badge, 'bump');
  });
  [...$('indeg').children].forEach((cell, c) => {
    cell.querySelector('b').textContent = f.indeg[c];
    cell.classList.toggle('zero', f.indeg[c] === 0);
    cell.classList.toggle('stuck', stuck.has(c));
    const changed = prev && prev.indeg[c] !== f.indeg[c];
    cell.classList.toggle('changed', !!changed);
    if (changed) replay(cell, 'bump');
  });
  const fresh =
    f.phase === 'seed' ? f.enqueued : f.phase === 'enqueue' ? [f.nxt] : [];
  chipRow('queue', f.q, fresh, 'ready');
  chipRow('order', f.order, f.phase === 'pop' ? [f.course] : [], 'done');
  $('course').textContent = f.course ?? '—';
  $('nxt').textContent = f.nxt ?? '—';
  $('qlen').textContent = f.q.length;
  $('taken').textContent = `${f.taken} / ${n}`;
  $('phase').textContent = {
    init: 'INITIALIZE',
    edge: 'BUILD GRAPH',
    seed: 'SEED QUEUE',
    pop: 'TAKE COURSE',
    relax: 'DECREMENT',
    enqueue: 'ENQUEUE',
    done: 'COMPLETE',
  }[f.phase];
  renderFormula(f);
  // Keep the course being worked on in view on narrow screens.
  const focus = f.nxt ?? f.course ?? (f.phase === 'edge' ? f.a : null);
  if (focus != null) {
    const scroll = $('scroll');
    scroll.scrollTo({
      left: Math.max(0, pos[focus].x - scroll.clientWidth / 2),
      behavior: 'smooth',
    });
  }
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent = done
    ? `canFinish(${n}, …) = ${f.answer ? 'True' : 'False'}`
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
    const rawN = $('n').value.trim();
    if (!/^\d+$/.test(rawN)) throw new Error('numCourses 請輸入正整數。');
    const raw = $('pairs').value.trim();
    if (!/^[\d\s,[\]，]*$/.test(raw)) {
      throw new Error('prerequisites 請用 [[a, b], …] 的格式。');
    }
    const nums = (raw.match(/\d+/g) ?? []).map(Number);
    if (nums.length % 2) throw new Error('每組先修關係需要兩個數字 [a, b]。');
    const pairs = [];
    for (let k = 0; k < nums.length; k += 2) pairs.push([nums[k], nums[k + 1]]);
    const result = courseTrace(Number(rawN), pairs);
    n = Number(rawN);
    frames = result.frames;
    edges = result.edges;
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
  classic: [6, '[[1,0],[2,0],[3,1],[3,2],[4,2],[5,3],[5,4]]'],
  cycle: [5, '[[1,0],[2,1],[3,2],[1,3],[4,3]]'],
  pair: [2, '[[1,0],[0,1]]'],
  free: [3, '[]'],
  islands: [5, '[[1,0],[3,2],[4,3]]'],
  self: [3, '[[1,0],[1,1],[2,1]]'],
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      [$('n').value, $('pairs').value] = examples[button.dataset.example];
      load();
    }),
);
load();
