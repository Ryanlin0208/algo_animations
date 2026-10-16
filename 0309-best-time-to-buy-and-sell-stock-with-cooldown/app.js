const $ = (id) => document.getElementById(id);
const source = `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        buy, sell, rest = [-prices[0]], [0], [0]

        for i in range(1, len(prices)):
            buy.append(max(buy[i - 1], rest[i - 1] - prices[i]))
            sell.append(max(sell[i - 1], buy[i - 1] + prices[i]))
            rest.append(max(rest[i - 1], buy[i - 1], sell[i - 1]))

        return sell[-1]`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
const STATES = ['buy', 'sell', 'rest'];
const fmt = (n) => (n == null ? '' : n < 0 ? `−${-n}` : `${n}`);
let prices;
let frames;
let step = 0;
let timer = null;
const cells = {};
function pause() {
  clearInterval(timer);
  timer = null;
  $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫';
}
function makeCell(className, text = '') {
  const cell = document.createElement('div');
  cell.className = className;
  cell.textContent = text;
  $('grid').append(cell);
  return cell;
}
function buildGrid() {
  const grid = $('grid');
  grid.replaceChildren();
  grid.style.setProperty('--days', prices.length);
  const top = Math.max(1, ...prices);
  makeCell('dp-label', '');
  cells.bar = prices.map((p) => {
    const cell = makeCell('dp-bar');
    const bar = document.createElement('i');
    bar.style.height = `${Math.max(3, (p / top) * 100)}%`;
    cell.append(bar);
    return cell;
  });
  makeCell('dp-label', 'prices');
  cells.price = prices.map((p) => makeCell('dp-price', p));
  STATES.forEach((state) => {
    makeCell(`dp-label ${state}`, state);
    cells[state] = prices.map(() => makeCell('dp-cell'));
  });
  makeCell('dp-label', 'i');
  cells.index = prices.map((_, i) => makeCell('dp-index', i));
}
function render() {
  const f = frames[step];
  const sources = new Map();
  if (f.candidates) {
    f.candidates.forEach((c, k) =>
      sources.set(c.from, k === f.winner ? 'winner' : 'source'),
    );
  }
  $('i').textContent = f.i;
  $('price').textContent = prices[f.i];
  $('target').textContent = f.target
    ? `${f.target}[${f.i}]`
    : f.phase === 'done'
      ? 'sell[-1]'
      : '—';
  $('phase').textContent = {
    init: 'INITIALIZE',
    visit: 'NEXT DAY',
    buy: 'UPDATE BUY',
    sell: 'UPDATE SELL',
    rest: 'UPDATE REST',
    done: 'COMPLETE',
  }[f.phase];
  prices.forEach((_, d) => {
    cells.bar[d].classList.toggle('current', d === f.i);
    cells.bar[d].classList.toggle('past', d < f.i);
    cells.price[d].classList.toggle('current', d === f.i);
    cells.index[d].classList.toggle('current', d === f.i);
    STATES.forEach((state) => {
      const cell = cells[state][d];
      const value = f[state][d];
      cell.textContent = fmt(value);
      cell.classList.toggle('filled', value != null);
      cell.classList.toggle(
        'entering',
        (f.target === state && d === f.i) || (f.phase === 'init' && d === 0),
      );
      const role =
        f.phase === 'visit' && d === f.i - 1
          ? 'source'
          : d === f.i - 1
            ? sources.get(state)
            : null;
      cell.classList.toggle('source', role === 'source');
      cell.classList.toggle(
        'winner',
        role === 'winner' ||
          (f.phase === 'done' && state === 'sell' && d === f.i),
      );
    });
  });
  const wrap = $('grid').parentElement;
  const left = cells.bar[f.i].offsetLeft - wrap.clientWidth / 2 + 29;
  wrap.scrollTo({left: Math.max(0, left), behavior: 'smooth'});
  STATES.forEach((state) => {
    const node = document.querySelector(`[data-node="${state}"]`);
    const today = f[state][f.i];
    node.querySelector('.node-value').textContent =
      today == null ? '?' : fmt(today);
    node.classList.toggle('target', f.target === state);
    node.classList.toggle(
      'source',
      sources.has(state) || (f.phase === 'done' && state === 'sell'),
    );
  });
  document.querySelectorAll('[data-edge]').forEach((el) => {
    const k = f.candidates?.findIndex((c) => c.edge === el.dataset.edge);
    el.classList.toggle('candidate', k != null && k >= 0);
    el.classList.toggle('winner', k != null && k === f.winner);
  });
  const box = $('candidates');
  box.replaceChildren();
  if (f.candidates) {
    f.candidates.forEach((c, k) => {
      const row = document.createElement('div');
      row.className = k === f.winner ? 'candidate winner' : 'candidate';
      const label = document.createElement('small');
      label.textContent = c.label;
      const value = document.createElement('strong');
      value.textContent =
        c.expr === fmt(c.value) ? c.expr : `${c.expr} = ${fmt(c.value)}`;
      const meaning = document.createElement('span');
      meaning.textContent = c.meaning;
      row.append(label, value, meaning);
      box.append(row);
    });
    const out = document.createElement('div');
    out.className = 'candidate-result';
    out.textContent = `max → ${f.target}[${f.i}] = ${fmt(f[f.target][f.i])}`;
    box.append(out);
  } else {
    const msg = document.createElement('div');
    msg.className = 'candidate-result';
    msg.textContent =
      f.phase === 'init'
        ? `buy[0] = ${fmt(f.buy[0])}, sell[0] = 0, rest[0] = 0`
        : f.phase === 'done'
          ? `return sell[-1] = ${fmt(f.answer)}`
          : `昨天：buy ${fmt(f.buy[f.i - 1])} · sell ${fmt(
              f.sell[f.i - 1],
            )} · rest ${fmt(f.rest[f.i - 1])}`;
    box.append(msg);
  }
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent = f.phase === 'done' ? `最大利潤 = ${f.answer}` : '';
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
    const raw = $('prices').value.trim().replace(/^\[/, '').replace(/\]$/, '');
    if (!/^\d+(?:[\s,，]+\d+)*$/.test(raw)) {
      throw new Error('請使用逗號或空白分隔非負整數。');
    }
    const nextPrices = raw.split(/[\s,，]+/).map(Number);
    const nextFrames = cooldownTrace(nextPrices);
    prices = nextPrices;
    frames = nextFrames;
    step = 0;
    $('error').textContent = '';
    buildGrid();
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
  classic: [1, 2, 3, 0, 2],
  cooldown: [1, 2, 4, 1, 5],
  rising: [1, 2, 3, 4, 5],
  falling: [5, 4, 3, 2, 1],
  single: [7],
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      $('prices').value = examples[button.dataset.example].join(', ');
      load();
    }),
);
load();
