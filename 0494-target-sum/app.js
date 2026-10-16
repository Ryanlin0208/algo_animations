const $ = (id) => document.getElementById(id);
const source = `class Solution:
    def findTargetSumWays(self, nums: list[int], target: int) -> int:
        total = sum(nums)
        if abs(target) > total or (total + target) % 2 == 1:
            return 0

        P = (total + target) // 2
        dp = [0] * (P + 1)
        dp[0] = 1

        for x in nums:
            for s in range(P, x - 1, -1):
                dp[s] += dp[s - x]
        return dp[P]`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span');
  row.className = text.trim() ? 'code-line' : 'code-line blank';
  const number = document.createElement('span');
  number.className = 'line-number';
  number.textContent = i + 1;
  row.append(number, document.createTextNode(text));
  $('code').append(row);
});
let nums;
let target;
let frames;
let step = 0;
let timer = null;
let cols = [];
let peak = 1;
function pause() {
  clearInterval(timer);
  timer = null;
  $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫';
}
function buildRows() {
  $('nums-row').replaceChildren(
    ...nums.map((n, i) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      const value = document.createElement('b');
      value.textContent = n;
      const index = document.createElement('small');
      index.textContent = i;
      chip.append(value, index);
      return chip;
    }),
  );
  const P = frames.find((f) => f.P != null)?.P;
  peak = Math.max(1, ...frames.flatMap((f) => f.dp));
  $('dp-row').replaceChildren();
  cols = [];
  if (P == null) {
    const empty = document.createElement('p');
    empty.className = 'dp-empty';
    empty.textContent = '條件不成立，不需要建立 dp。';
    $('dp-row').append(empty);
    return;
  }
  for (let d = 0; d <= P; d++) {
    const col = document.createElement('div');
    col.className = 'dp-col';
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.append(document.createElement('i'));
    const value = document.createElement('div');
    value.className = 'value';
    const index = document.createElement('div');
    index.className = 'index';
    index.textContent = d;
    col.append(bar, value, index);
    $('dp-row').append(col);
    cols.push(col);
  }
}
function drawArc(f) {
  const svg = $('arc');
  const wrap = $('dp-wrap');
  svg.setAttribute('width', wrap.scrollWidth);
  svg.setAttribute('height', 46);
  const show = f.phase === 'update' && cols.length;
  svg.classList.toggle('live', Boolean(show));
  if (!show) {
    $('arc-path').setAttribute('d', '');
    $('arc-label').textContent = '';
    return;
  }
  const center = (d) => cols[d].offsetLeft + cols[d].offsetWidth / 2;
  const a = center(f.from);
  const b = center(f.s);
  const mid = (a + b) / 2;
  $('arc-path').setAttribute(
    'd',
    a === b
      ? `M${a - 7} 4C${a - 22} 42 ${a + 22} 42 ${a + 7} 4`
      : `M${a} 4Q${mid} 52 ${b} 4`,
  );
  svg.classList.toggle('empty', f.gain === 0);
  const label = $('arc-label');
  label.setAttribute('x', mid);
  label.setAttribute('y', a === b ? 44 : 38);
  label.textContent = `+${f.gain}`;
}
function render() {
  const f = frames[step];
  const inRound = ['pick', 'update'].includes(f.phase);
  $('total').textContent = f.total;
  $('target-stat').textContent = target;
  $('p').textContent = f.P ?? '—';
  $('x').textContent = f.x ?? '—';
  $('s').textContent = f.s ?? '—';
  $('phase').textContent = {
    sum: 'SUM',
    check: f.fail ? 'NO WAY' : 'FEASIBLE',
    target: 'SUBSET TARGET',
    alloc: 'ALLOCATE DP',
    base: 'BASE CASE',
    pick: 'NEXT NUMBER',
    update: '← UPDATE DP',
    done: 'COMPLETE',
  }[f.phase];
  [...$('nums-row').children].forEach((chip, i) => {
    chip.classList.toggle(
      'selected',
      f.phase === 'done' ? f.P != null : inRound && i < f.k,
    );
    chip.classList.toggle('entering', inRound && i === f.k);
  });
  cols.forEach((col, d) => {
    const value = f.dp[d];
    col.querySelector('.value').textContent = value ?? '';
    col.querySelector('.bar i').style.height = value
      ? `${Math.max(6, (value / peak) * 100)}%`
      : '0';
    col.classList.toggle('ready', value != null);
    col.classList.toggle(
      'entering',
      (f.phase === 'update' && d === f.s) || (f.phase === 'base' && d === 0),
    );
    col.classList.toggle('selected', f.phase === 'update' && d > f.s);
    col.classList.toggle('source', f.phase === 'update' && d === f.from);
    col.classList.toggle('answer', f.phase === 'done' && d === f.P);
    col.classList.toggle(
      'idle',
      inRound && f.x != null && d < f.x && f.phase === 'update',
    );
  });
  drawArc(f);
  if (f.s != null && cols[f.s]) {
    const wrap = $('dp-wrap').parentElement;
    const left = cols[f.s].offsetLeft - wrap.clientWidth / 2;
    wrap.scrollTo({left: Math.max(0, left), behavior: 'smooth'});
  }
  $('direction').textContent = inRound
    ? f.x > f.P
      ? `x = ${f.x} > P，這一輪跳過`
      : `s 由 ${f.P} 往左到 ${f.x}`
    : 'dp[s] = 湊出總和 s 的方法數';
  $('expression').textContent = {
    sum: `total = ${f.total}`,
    check: `|${target}| ≤ ${f.total} 且 ${f.total + target} 為偶數？ ${
      f.fail ? '否' : '是'
    }`,
    target: `P = (${f.total} + ${target}) // 2 = ${f.P}`,
    alloc: `dp = [0] * ${f.P == null ? '' : f.P + 1}`,
    base: 'dp[0] = 1',
    pick: `x = ${f.x}`,
    update: `dp[${f.s}] = ${f.before} + dp[${f.from}] (${f.gain}) = ${
      f.dp[f.s]
    }`,
    done: `return ${f.P == null ? 0 : `dp[${f.P}]`}`,
  }[f.phase];
  $('operation-note').textContent =
    f.phase === 'update'
      ? `dp[${f.from}] 是加入 x 之前的舊值，所以 x 只會用一次`
      : '每次只執行高亮的程式碼';
  $('title').textContent = f.title;
  $('note').textContent = f.note;
  $('result').textContent = f.phase === 'done' ? `答案 = ${f.answer}` : '';
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
    const raw = $('nums').value.trim().replace(/^\[/, '').replace(/\]$/, '');
    if (!/^\d+(?:[\s,，]+\d+)*$/.test(raw)) {
      throw new Error('請使用逗號或空白分隔非負整數。');
    }
    const rawTarget = $('target').value.trim();
    if (!/^-?\d+$/.test(rawTarget)) throw new Error('target 需為整數。');
    const nextNums = raw.split(/[\s,，]+/).map(Number);
    const nextTarget = Number(rawTarget);
    const nextFrames = targetSumTrace(nextNums, nextTarget);
    nums = nextNums;
    target = nextTarget;
    frames = nextFrames;
    step = 0;
    $('error').textContent = '';
    buildRows();
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
  classic: [[1, 1, 1, 1, 1], 3],
  mixed: [[2, 3, 1, 4], 2],
  zeros: [[0, 0, 1], 1],
  negative: [[1, 2, 3], -2],
  odd: [[1, 2, 3], 1],
  far: [[1, 2], 5],
};
document.querySelectorAll('[data-example]').forEach(
  (button) =>
    (button.onclick = () => {
      const [n, t] = examples[button.dataset.example];
      $('nums').value = n.join(', ');
      $('target').value = t;
      load();
    }),
);
load();
