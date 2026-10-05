const $ = id => document.getElementById(id);
const source = `class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        prefix_count = {0: 1}

        prefix, ans = 0, 0

        for num in nums:
            prefix += num

            if prefix - k in prefix_count:
                ans += prefix_count[prefix - k]

            prefix_count[prefix] = prefix_count.get(prefix, 0) + 1

        return ans`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let nums, k, frames, step = 0, timer = null;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
  const f = frames[step];
  $('prefix').textContent = f.prefix; $('ans').textContent = f.ans; $('target').textContent = k;
  $('phase').textContent = { seed: 'EMPTY PREFIX', init: 'INITIALIZE', visit: 'NEXT NUMBER', sum: 'PREFIX SUM', lookup: 'LOOKUP', add: 'COUNT MATCHES', update: 'UPDATE MAP', done: 'COMPLETE' }[f.phase];
  [...$('array').children].forEach((cell, i) => {
    cell.classList.toggle('selected', i <= f.accumulated);
    cell.classList.toggle('entering', i === f.index);
    cell.querySelector('.pointer').textContent = i === f.index ? 'num' : '';
  });
  $('needed').textContent = f.needed ?? '—'; $('hits').textContent = f.hits ?? '—';
  $('expression').textContent = f.needed === undefined ? '尚未查詢' : `${f.prefix} − (${k}) = ${f.needed}`;
  $('counts').replaceChildren();
  f.counts.forEach(([value, count]) => {
    const item = document.createElement('span'); item.className = 'count'; item.textContent = `${value} → ${count}`;
    item.classList.toggle('lookup', ['lookup', 'add'].includes(f.phase) && value === f.needed);
    item.classList.toggle('updated', f.phase === 'update' && value === f.prefix);
    $('counts').append(item);
  });
  $('matches').replaceChildren();
  if (f.starts === undefined) $('matches').textContent = f.phase === 'done' ? `總計 ${f.ans} 個子陣列` : '尚未查詢';
  else if (!f.starts.length) $('matches').textContent = '本輪沒有符合的子陣列';
  else f.starts.forEach(start => {
    const item = document.createElement('span'); item.className = 'match';
    item.textContent = `[${start}…${f.index}]`; item.title = nums.slice(start, f.index + 1).join(' + ') + ` = ${k}`;
    $('matches').append(item);
  });
  $('title').textContent = f.title; $('note').textContent = f.note; $('result').textContent = f.phase === 'done' ? `return ${f.ans}` : '';
  $('step-label').textContent = `STEP ${String(step + 1).padStart(2, '0')}`;
  $('counter').textContent = `${step + 1} / ${frames.length}`; $('seek').max = frames.length - 1; $('seek').value = step;
  $('prev').disabled = step === 0; $('next').disabled = step === frames.length - 1;
  [...$('code').children].forEach((row, i) => row.classList.toggle('active', f.line.includes(i + 1)));
  if (step === frames.length - 1) pause(); else if (!timer) $('play').textContent = '播放動畫';
}
function load() {
  pause();
  try {
    const raw = $('nums').value.trim().replace(/^\[/, '').replace(/\]$/, '');
    if (!/^-?\d+(?:[\s,，]+-?\d+)*$/.test(raw)) throw new Error('nums 請輸入以逗號或空白分隔的整數，可包含負數與零。');
    if (!$('k').value.trim()) throw new Error('請填寫目標 k。');
    const nextNums = raw.split(/[\s,，]+/).map(Number), nextK = Number($('k').value), nextFrames = subarrayTrace(nextNums, nextK);
    nums = nextNums; k = nextK; frames = nextFrames; step = 0; $('error').textContent = ''; $('array').replaceChildren();
    nums.forEach((num, i) => {
      const cell = document.createElement('div'); cell.className = 'cell';
      const pointer = document.createElement('div'); pointer.className = 'pointer';
      const value = document.createElement('div'); value.className = 'value'; value.textContent = num;
      if (String(num).length > 4) value.style.fontSize = '10px';
      const index = document.createElement('div'); index.className = 'index'; index.textContent = i;
      cell.append(pointer, value, index); $('array').append(cell);
    });
    render();
  } catch (error) { $('error').textContent = error.message; }
}
function play() {
  if (timer) return pause();
  if (step === frames.length - 1) { step = 0; render(); }
  $('play').textContent = '暫停';
  timer = setInterval(() => { step++; render(); }, Number($('speed').value));
}
$('inputs').addEventListener('submit', event => { event.preventDefault(); load(); });
$('play').onclick = play;
$('reset').onclick = () => { pause(); step = 0; render(); };
$('prev').onclick = () => { pause(); step = Math.max(0, step - 1); render(); };
$('next').onclick = () => { pause(); step = Math.min(frames.length - 1, step + 1); render(); };
$('seek').oninput = () => { pause(); step = Number($('seek').value); render(); };
$('speed').onchange = () => { if (timer) { pause(); play(); } };
const examples = { classic: [[1, 1, 1], 2], negative: [[1, -1, 1, -1], 0], zeros: [[0, 0, 0], 0], none: [[1, 2, 3], 7] };
document.querySelectorAll('[data-example]').forEach(button => button.onclick = () => {
  const [a, target] = examples[button.dataset.example]; $('nums').value = a.join(', '); $('k').value = target; load();
});
load();
