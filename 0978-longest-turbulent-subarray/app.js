const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const source = `class Solution:
    def maxTurbulenceSize(self, arr: list[int]) -> int:
        up = down = 1
        ans = 1
        for i in range(1, len(arr)):
            if arr[i] > arr[i - 1]:
                up, down = down + 1, 1
            elif arr[i] < arr[i - 1]:
                up, down = 1, up + 1
            else:
                up = down = 1
            ans = max(ans, up, down)
        return ans`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
// Stage geometry: every element shares the same column grid.
const COL = 58;
const LEFT = 58;
const H = 220;
const ROW = 36;
const x = (i) => LEFT + i * COL + COL / 2;
let arr;
let frames;
let step = 0;
let timer = null;
let y;
let width;
const segs = [];
const dots = [];
const rows = {};
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
function build() {
  const n = arr.length;
  width = LEFT + n * COL + 8;
  const lo = Math.min(...arr);
  const hi = Math.max(...arr);
  y = (v) => (hi === lo ? H / 2 : 182 - ((v - lo) / (hi - lo)) * 136);
  $('stage').style.width = `${width}px`;
  const chart = $('chart');
  chart.setAttribute('viewBox', `0 0 ${width} ${H}`);
  chart.setAttribute('width', width);
  chart.setAttribute('height', H);
  $('segments').replaceChildren();
  $('points').replaceChildren();
  segs.length = 0;
  dots.length = 0;
  for (let k = 1; k < n; k++) {
    const dir =
      arr[k] > arr[k - 1] ? 'up' : arr[k] < arr[k - 1] ? 'down' : 'eq';
    segs[k] = svg(
      'line',
      {
        class: `seg ${dir}`,
        x1: x(k - 1),
        y1: y(arr[k - 1]),
        x2: x(k),
        y2: y(arr[k]),
        pathLength: 1,
      },
      $('segments'),
    );
  }
  arr.forEach((v, k) => {
    const g = svg('g', {class: 'dot'}, $('points'));
    g.style.transform = `translate(${x(k)}px, ${y(v)}px)`;
    svg('circle', {r: 7}, g);
    const valley =
      (k === 0 || arr[k - 1] > v) && (k === n - 1 || arr[k + 1] > v) && n > 1;
    const label = svg('text', {y: valley ? 24 : -14}, g);
    label.textContent = v;
    dots[k] = g;
  });
  const index = $('index-row');
  index.replaceChildren();
  arr.forEach((_, k) => {
    const cell = document.createElement('span');
    cell.textContent = k;
    cell.style.left = `${x(k) - COL / 2}px`;
    cell.style.width = `${COL}px`;
    index.append(cell);
  });
  document.querySelectorAll('.chain-row').forEach((row) => {
    rows[row.dataset.row] = row;
  });
  const transfer = $('transfer');
  transfer.setAttribute('viewBox', `0 0 ${width} ${ROW * 3}`);
  transfer.setAttribute('width', width);
  transfer.setAttribute('height', ROW * 3);
  transfer.querySelector('path').setAttribute('pathLength', 1);
}
const clip = (s, e) =>
  `inset(0 ${width - (LEFT + (e + 1) * COL) + 4}px 0 ${
    LEFT + s * COL + 4
  }px round 8px)`;
function setBand(name, len, end, text) {
  const row = rows[name];
  row.querySelector('.band').style.clipPath = clip(end - len + 1, end);
  const label = row.querySelector('.band-label');
  label.textContent = text;
  label.style.transform = `translateX(${LEFT + (end - len + 1) * COL + 10}px)`;
}
function setGhost(name, len, end) {
  const ghost = rows[name].querySelector('.ghost');
  ghost.classList.toggle('show', len > 0);
  if (len > 0) {
    ghost.style.left = `${LEFT + (end - len + 1) * COL + 4}px`;
    ghost.style.width = `${len * COL - 8}px`;
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
  const box = $('formula');
  const parts = [];
  if (f.phase === 'init') {
    parts.push(
      chip('up = 1', 'rise'),
      chip('down = 1', 'fall'),
      chip('ans = 1', 'best'),
    );
  } else if (f.phase === 'compare') {
    const sign = {up: '>', down: '<', eq: '='}[f.cmp];
    parts.push(
      chip(`arr[${f.i}] = ${arr[f.i]}`),
      op(sign),
      chip(`arr[${f.i - 1}] = ${arr[f.i - 1]}`),
      op('→'),
      chip(
        {up: '↗ 上升段', down: '↘ 下降段', eq: '＝ 相等'}[f.cmp],
        {up: 'rise', down: 'fall', eq: 'flat'}[f.cmp],
      ),
    );
  } else if (f.phase === 'update') {
    if (f.cmp === 'eq') {
      parts.push(
        chip('up = 1', 'rise'),
        chip('down = 1', 'fall'),
        chip('兩條鏈都斷開', 'flat'),
      );
    } else {
      const rise = f.cmp === 'up';
      parts.push(
        chip(
          rise ? `舊 down 鏈 ${f.prevDown}` : `舊 up 鏈 ${f.prevUp}`,
          rise ? 'fall' : 'rise',
        ),
        op('+'),
        chip(rise ? '↗ 1 段' : '↘ 1 段', rise ? 'rise' : 'fall'),
        op('='),
        chip(
          rise ? `up = ${f.up}` : `down = ${f.down}`,
          `${rise ? 'rise' : 'fall'} strong`,
        ),
        op('，'),
        chip(rise ? 'down = 1' : 'up = 1', rise ? 'fall dim' : 'rise dim'),
      );
    }
  } else if (f.phase === 'ans') {
    const [a, u, d] = f.candidates;
    const win = f.ans > a ? (u >= d ? 1 : 2) : 0;
    parts.push(
      op('max('),
      chip(`ans ${a}`, win === 0 ? 'best strong' : 'best'),
      chip(`up ${u}`, win === 1 ? 'rise strong' : 'rise'),
      chip(`down ${d}`, win === 2 ? 'fall strong' : 'fall'),
      op(')'),
      op('='),
      chip(`${f.ans}`, 'best strong'),
    );
  } else {
    parts.push(op('return'), chip(`ans = ${f.answer}`, 'best strong'));
  }
  parts.forEach((p, k) => p.style.setProperty('--k', k));
  box.replaceChildren(...parts);
}
function replay(el, cls) {
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
}
function render() {
  const f = frames[step];
  const n = arr.length;
  const done = f.phase === 'done';
  const chainEnd = done ? f.best[1] : f.end;
  const chainStart = done ? f.best[0] : f.end - Math.max(f.up, f.down) + 1;
  $('i').textContent = f.phase === 'init' ? '—' : f.i;
  $('cmp').textContent = f.cmp
    ? `${arr[f.i]} ${{up: '>', down: '<', eq: '='}[f.cmp]} ${arr[f.i - 1]}`
    : '—';
  $('up').textContent = f.up;
  $('down').textContent = f.down;
  $('ans').textContent = f.ans;
  $('phase').textContent = {
    init: 'INITIALIZE',
    compare: 'COMPARE',
    update: 'UPDATE',
    ans: 'TAKE MAX',
    done: 'COMPLETE',
  }[f.phase];
  for (let k = 1; k < n; k++) {
    const shown =
      k < f.i || (k === f.i && f.phase !== 'init') || f.phase === 'done';
    segs[k].classList.toggle('shown', shown);
    segs[k].classList.toggle('chain', shown && k > chainStart && k <= chainEnd);
    segs[k].classList.toggle(
      'current',
      k === f.i && f.phase !== 'init' && f.phase !== 'done',
    );
  }
  dots.forEach((g, k) => {
    g.classList.toggle('future', k > f.i);
    g.classList.toggle('chain', k >= chainStart && k <= chainEnd);
    g.classList.toggle('current', k === f.i && f.phase !== 'done');
    g.classList.toggle(
      'best',
      f.phase === 'done' && k >= f.best[0] && k <= f.best[1],
    );
  });
  const badge = $('badge');
  const live = f.cmp && f.phase !== 'done';
  badge.classList.toggle('show', !!live);
  if (live) {
    const mx = (x(f.i - 1) + x(f.i)) / 2;
    const my = (y(arr[f.i - 1]) + y(arr[f.i])) / 2;
    badge.style.transform = `translate(${mx}px, ${my}px)`;
    badge.dataset.dir = f.cmp;
    badge.querySelector('text').textContent = {up: '↗', down: '↘', eq: '='}[
      f.cmp
    ];
  }
  const cut = $('cut');
  const broke = f.phase === 'update' && f.restart && f.i >= 1;
  cut.classList.toggle('show', broke);
  if (broke) {
    const at = f.cmp === 'eq' ? f.i : f.i - 1;
    const cx = f.cmp === 'eq' ? (x(f.i - 1) + x(f.i)) / 2 : x(at);
    const cy = Math.min(H - 14, Math.max(y(arr[f.i - 1]), y(arr[f.i])) + 34);
    cut.style.transform = `translate(${cx}px, ${cy}px)`;
  }
  setBand('up', f.up, f.end, `up ${f.up}`);
  setBand('down', f.down, f.end, `down ${f.down}`);
  setBand('ans', f.best[1] - f.best[0] + 1, f.best[1], `ans ${f.ans}`);
  rows.up.classList.toggle('alive', f.up >= f.down && f.up > 1);
  rows.down.classList.toggle('alive', f.down > f.up);
  rows.ans.classList.toggle('alive', f.phase === 'ans' || f.phase === 'done');
  const moving = f.phase === 'update' && f.cmp !== 'eq';
  setGhost('down', moving && f.cmp === 'up' ? f.prevDown : 0, f.i - 1);
  setGhost('up', moving && f.cmp === 'down' ? f.prevUp : 0, f.i - 1);
  setGhost('ans', 0, 0);
  const transfer = $('transfer');
  transfer.classList.toggle('show', moving);
  if (moving) {
    const from = f.cmp === 'up' ? 1 : 0;
    const to = 1 - from;
    const y1 = from * ROW + ROW / 2 - 2;
    const y2 = to * ROW + ROW / 2 - 2;
    const x1 = LEFT + f.i * COL - 6;
    const x2 = x(f.i) - 6;
    transfer.dataset.dir = f.cmp;
    transfer
      .querySelector('path')
      .setAttribute(
        'd',
        `M${x1} ${y1}C${x1 + 14} ${y1} ${x2 - 16} ${y2} ${x2} ${y2}`,
      );
    const label = transfer.querySelector('text');
    label.setAttribute('x', x2 + 4);
    label.setAttribute('y', y2 + 6);
    label.textContent = '+1';
    replay(transfer, 'draw');
  }
  const best = $('best-zone');
  best.style.clipPath = clip(f.best[0], f.best[1]);
  best.classList.toggle('done', f.phase === 'done');
  renderFormula(f);
  const scroll = $('scroll');
  scroll.scrollTo({
    left: Math.max(0, x(f.i) - scroll.clientWidth / 2),
    behavior: 'smooth',
  });
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent =
    f.phase === 'done'
      ? `最長震盪子陣列 = ${f.answer}：[${arr.slice(f.best[0], f.best[1] + 1).join(', ')}]`
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
    const raw = $('arr').value.trim().replace(/^\[/, '').replace(/\]$/, '');
    if (!/^\d+(?:[\s,，]+\d+)*$/.test(raw)) {
      throw new Error('請使用逗號或空白分隔非負整數。');
    }
    const nextArr = raw.split(/[\s,，]+/).map(Number);
    const nextFrames = turbulentTrace(nextArr);
    arr = nextArr;
    frames = nextFrames;
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
  classic: [9, 4, 2, 10, 7, 8, 8, 1, 9],
  zigzag: [1, 5, 2, 6, 3, 7, 4],
  rising: [4, 8, 12, 16],
  equal: [7, 7, 7],
  single: [100],
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      $('arr').value = examples[button.dataset.example].join(', ');
      load();
    }),
);
load();
