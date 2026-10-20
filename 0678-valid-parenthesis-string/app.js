const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const source = `class Solution:
    def checkValidString(self, s: str) -> bool:
        lo = hi = 0
        for c in s:
            if c == '(':
                lo += 1
                hi += 1
            elif c == ')':
                lo -= 1
                hi -= 1
            else:               # '*'
                lo -= 1
                hi += 1

            if hi < 0:          # 右括號太多，救不回來
                return False
            lo = max(lo, 0)     # 丟掉不合法的可能
        return lo == 0`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
// Stage geometry: column k is the state after s[k - 1]; column 0 is the start.
const COL = 50;
const LEFT = 56;
const CW = 32;
const TOP = 30;
const x = (k) => LEFT + k * COL + COL / 2;
let s;
let frames;
let cols;
let step = 0;
let timer = null;
let cy;
let ch;
let width;
let height;
const view = [];
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
const topY = (v) => cy(v) - ch / 2;
const botY = (v) => cy(v) + ch / 2;
// Edge along one side of the range: across the gap, then across the column.
function edge(k, fromY, toY) {
  const a = x(k - 1) + CW / 2;
  return `${a},${fromY} ${x(k) - CW / 2},${toY} ${x(k) + CW / 2},${toY}`;
}
function ribbon(k, prev, hi, lo) {
  const a = x(k - 1) + CW / 2;
  const b = x(k) - CW / 2;
  return `${a},${topY(prev.hi)} ${b},${topY(hi)} ${b},${botY(lo)} ${a},${botY(prev.lo)}`;
}
function build() {
  const n = s.length;
  const maxV = Math.max(1, ...cols.map((c) => c.rawHi));
  ch = Math.max(18, Math.min(30, Math.round(210 / (maxV + 2))));
  cy = (v) => TOP + (maxV - v) * ch + ch / 2;
  // Extra room on the right for the final verdict label.
  width = LEFT + (n + 1) * COL + 96;
  height = botY(-1) + 30;
  $('stage').style.width = `${width}px`;
  const chart = $('chart');
  chart.setAttribute('viewBox', `0 0 ${width} ${height}`);
  chart.setAttribute('width', width);
  chart.setAttribute('height', height);
  for (const id of ['axis', 'ribbons', 'cells', 'edges', 'clamps']) {
    $(id).replaceChildren();
  }
  view.length = 0;
  const axis = $('axis');
  svg(
    'rect',
    {
      class: 'pit',
      x: LEFT - 4,
      y: botY(0),
      width: width - LEFT,
      height: botY(-1) - botY(0),
    },
    axis,
  );
  for (let v = -1; v <= maxV; v++) {
    const label = svg(
      'text',
      {x: LEFT - 12, y: cy(v) + 4, class: v < 0 ? 'neg' : ''},
      axis,
    );
    label.textContent = v;
  }
  svg(
    'line',
    {class: 'floor', x1: LEFT - 4, x2: width - 8, y1: botY(0), y2: botY(0)},
    axis,
  );
  cols.forEach((c, k) => {
    const v = {cells: [], c};
    const group = svg('g', {class: 'col'}, $('cells'));
    for (let val = c.rawLo; val <= c.rawHi; val++) {
      const cell = svg(
        'rect',
        {
          class: val < 0 ? 'slot below' : 'slot',
          x: x(k) - CW / 2,
          y: topY(val) + 2,
          width: CW,
          height: ch - 4,
          rx: 6,
        },
        group,
      );
      cell.style.setProperty('--d', `${(val - c.rawLo) * 35}ms`);
      v.cells.push({el: cell, val});
    }
    v.group = group;
    if (k === 0) {
      v.hi = svg(
        'polyline',
        {
          class: 'edge hi',
          points: `${x(0) - CW / 2},${topY(0)} ${x(0) + CW / 2},${topY(0)}`,
          pathLength: 1,
        },
        $('edges'),
      );
      v.lo = svg(
        'polyline',
        {
          class: 'edge lo',
          points: `${x(0) - CW / 2},${botY(0)} ${x(0) + CW / 2},${botY(0)}`,
          pathLength: 1,
        },
        $('edges'),
      );
    } else {
      const prev = cols[k - 1];
      v.ribbon = svg(
        'polygon',
        {class: 'ribbon', points: ribbon(k, prev, c.rawHi, c.rawLo)},
        $('ribbons'),
      );
      v.hi = svg(
        'polyline',
        {
          class: 'edge hi',
          points: edge(k, topY(prev.hi), topY(c.rawHi)),
          pathLength: 1,
        },
        $('edges'),
      );
      v.lo = svg(
        'polyline',
        {
          class: 'edge lo',
          points: edge(k, botY(prev.lo), botY(c.rawLo)),
          pathLength: 1,
        },
        $('edges'),
      );
      if (c.lo !== c.rawLo) {
        v.ribbonFixed = svg(
          'polygon',
          {class: 'ribbon fixed', points: ribbon(k, prev, c.rawHi, c.lo)},
          $('ribbons'),
        );
        v.loFixed = svg(
          'polyline',
          {
            class: 'edge lo fixed',
            points: edge(k, botY(prev.lo), botY(c.lo)),
            pathLength: 1,
          },
          $('edges'),
        );
        const ax = x(k) + CW / 2 + 8;
        v.clamp = svg(
          'path',
          {
            class: 'clamp',
            d: `M${ax} ${cy(-1) + 4}V${cy(0)}m-4 6l4-6l4 6`,
            pathLength: 1,
          },
          $('clamps'),
        );
      }
    }
    view.push(v);
  });
  const chars = $('chars');
  chars.replaceChildren();
  const start = document.createElement('span');
  start.className = 'start';
  start.textContent = '起點';
  start.style.left = `${x(0) - COL / 2}px`;
  start.style.width = `${COL}px`;
  chars.append(start);
  [...s].forEach((c, i) => {
    const tile = document.createElement('span');
    tile.className = `char ${{'(': 'open', ')': 'close', '*': 'star'}[c]}`;
    tile.style.left = `${x(i + 1) - 17}px`;
    const glyph = document.createElement('b');
    glyph.textContent = c;
    const index = document.createElement('small');
    index.textContent = i;
    tile.append(glyph, index);
    chars.append(tile);
  });
}
function chip(text, cls = '') {
  const el = document.createElement('span');
  el.className = `chip ${cls}`;
  el.textContent = text;
  return el;
}
const op = (text) => chip(text, 'op');
const minus = (n) => String(n).replace('-', '−');
function renderFormula(f) {
  const parts = [];
  if (f.phase === 'init') {
    parts.push(
      chip('lo = 0', 'lo'),
      chip('hi = 0', 'hi'),
      op('→'),
      chip('可能的數量 {0}', 'best'),
    );
  } else if (f.phase === 'update') {
    const d = {'(': [1, 1], ')': [-1, -1], '*': [-1, 1]}[f.c];
    const sign = (k) => (k > 0 ? '+ 1' : '− 1');
    parts.push(chip(`c = '${f.c}'`, 'char-chip'), op('→'));
    if (f.c === '*') {
      parts.push(
        chip('當 ) → −1', 'lo dim'),
        chip('當空 → 0', 'dim'),
        chip('當 ( → +1', 'hi dim'),
        op('⇒'),
      );
    }
    parts.push(
      chip(`lo ${minus(f.prevLo)} ${sign(d[0])} = ${minus(f.lo)}`, 'lo strong'),
      chip(`hi ${minus(f.prevHi)} ${sign(d[1])} = ${minus(f.hi)}`, 'hi strong'),
    );
  } else if (f.phase === 'check') {
    parts.push(
      op('if'),
      chip(`hi = ${minus(f.hi)}`, 'hi'),
      op(f.fail ? '<' : '≥'),
      chip('0'),
      op('→'),
      chip(
        f.fail ? '沒有任何合法選法' : '還有合法選法，繼續',
        f.fail ? 'bad strong' : 'best',
      ),
    );
  } else if (f.phase === 'clamp') {
    parts.push(
      op('lo = max('),
      chip(minus(f.rawLo), f.clamped ? 'bad' : 'lo'),
      op(','),
      chip('0'),
      op(')'),
      op('='),
      chip(`${f.lo}`, 'lo strong'),
    );
    if (f.clamped) parts.push(op('→'), chip('剪掉 −1 那格', 'bad'));
  } else if (f.phase === 'fail') {
    parts.push(op('return'), chip('False', 'bad strong'));
  } else {
    parts.push(
      op('return'),
      chip(`lo = ${f.lo}`, 'lo'),
      op('== 0'),
      op('→'),
      chip(
        f.answer ? 'True' : 'False',
        f.answer ? 'best strong' : 'bad strong',
      ),
    );
  }
  parts.forEach((p, k) => p.style.setProperty('--k', k));
  $('formula').replaceChildren(...parts);
}
function rangeText(lo, hi) {
  if (hi < lo || hi < 0) return '∅';
  if (hi - lo > 4) return `${minus(lo)} … ${hi}`;
  const values = [];
  for (let v = lo; v <= hi; v++) values.push(minus(v));
  return `{${values.join(', ')}}`;
}
function place(id, k, yy, text) {
  const g = $(id);
  g.style.transform = `translate(${x(k)}px, ${yy}px)`;
  g.querySelector('text').textContent = text;
}
function render() {
  const f = frames[step];
  const C = f.col;
  const done = f.phase === 'done';
  $('i').textContent = f.i < 0 ? '—' : f.i;
  $('c').textContent = f.c ?? '—';
  $('lo').textContent = minus(f.lo);
  $('hi').textContent = minus(f.hi);
  $('set').textContent = rangeText(f.lo, f.hi);
  $('phase').textContent = {
    init: 'INITIALIZE',
    update: 'READ CHAR',
    check: 'CHECK HI',
    fail: 'RETURN FALSE',
    clamp: 'CLAMP LO',
    done: 'COMPLETE',
  }[f.phase];
  view.forEach((v, k) => {
    const shown = k <= C;
    // A column is settled once its clamp line has run.
    const settled = k < C || (k === C && (f.phase === 'clamp' || done));
    const current = k === C && !done;
    const dead =
      k === C && (f.phase === 'fail' || (f.phase === 'check' && f.fail));
    v.group.classList.toggle('shown', shown);
    v.group.classList.toggle('current', current);
    v.group.classList.toggle('dead', dead);
    v.cells.forEach(({el, val}) =>
      el.classList.toggle('dropped', val < 0 && settled),
    );
    const fixed = !!v.loFixed && settled;
    v.hi.classList.toggle('shown', shown);
    v.lo.classList.toggle('shown', shown);
    v.lo.classList.toggle('faded', fixed);
    v.ribbon?.classList.toggle('shown', shown && !fixed);
    v.ribbon?.classList.toggle('current', current);
    v.ribbon?.classList.toggle('dead', dead);
    v.ribbonFixed?.classList.toggle('shown', fixed);
    v.ribbonFixed?.classList.toggle('current', current);
    v.loFixed?.classList.toggle('shown', fixed);
    v.clamp?.classList.toggle('shown', fixed);
    v.clamp?.classList.toggle('now', fixed && k === C && f.phase === 'clamp');
  });
  [...$('chars').querySelectorAll('.char')].forEach((tile, i) => {
    tile.classList.toggle('read', i + 1 < C || (i + 1 === C && done));
    tile.classList.toggle('current', i + 1 === C && !done);
    tile.classList.toggle('future', i + 1 > C);
  });
  const showTags = f.hi >= 0;
  $('hi-tag').classList.toggle('show', showTags);
  $('lo-tag').classList.toggle('show', showTags);
  if (showTags) {
    place('hi-tag', C, topY(f.hi) - 8, `hi ${f.hi}`);
    // Sit below any dropped cell so the clamp arrow stays readable.
    place(
      'lo-tag',
      C,
      botY(Math.min(f.lo, cols[C].rawLo)) + 16,
      `lo ${minus(f.lo)}`,
    );
  }
  const goal = $('goal');
  const end = done || f.phase === 'fail';
  goal.classList.toggle('show', end);
  goal.classList.toggle('ok', end && f.answer);
  goal.classList.toggle('no', end && !f.answer);
  if (end) {
    const rect = goal.querySelector('rect');
    const gy = f.phase === 'fail' ? -1 : 0;
    rect.setAttribute('x', x(C) - CW / 2 - 5);
    rect.setAttribute('y', topY(gy) - 3);
    rect.setAttribute('width', CW + 10);
    rect.setAttribute('height', ch + 6);
    const label = goal.querySelector('text');
    label.setAttribute('x', x(C) + CW / 2 + 10);
    label.setAttribute('y', cy(gy) + 4);
    label.textContent =
      f.phase === 'fail'
        ? '✕ 配不完'
        : f.answer
          ? '✓ 0 在範圍內'
          : '✕ 到不了 0';
  }
  renderFormula(f);
  const scroll = $('scroll');
  scroll.scrollTo({
    left: Math.max(0, x(C) - scroll.clientWidth / 2),
    behavior: 'smooth',
  });
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent =
    f.phase === 'done' || f.phase === 'fail'
      ? `checkValidString("${s}") = ${f.answer ? 'True' : 'False'}`
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
    const raw = $('s')
      .value.trim()
      .replace(/^(["'])(.*)\1$/, '$2')
      .replace(/\s+/g, '');
    const result = parenTrace(raw);
    s = raw;
    frames = result.frames;
    cols = result.cols;
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
  classic: '((*)*))(*)',
  rescue: '(*))',
  close: '())*',
  open: '((*',
  order: '*(',
  stars: '***',
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      $('s').value = examples[button.dataset.example];
      load();
    }),
);
load();
