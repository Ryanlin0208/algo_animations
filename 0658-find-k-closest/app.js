const $ = id => document.getElementById(id);
const source = `class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        left = 0
        right = len(arr) - k

        while left < right:
            mid = (left + right) // 2

            if x - arr[mid] > arr[mid + k] - x:
                left = mid + 1
            else:
                right = mid

        return arr[left:left + k]`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let arr, k, x, frames, step = 0, timer = null;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
  const f = frames[step], start = ['mid', 'compare', 'update'].includes(f.phase) ? f.mid : f.left;
  $('left').textContent = f.left; $('right').textContent = f.right; $('mid').textContent = f.mid ?? '—'; $('target').textContent = x;
  $('phase').textContent = { init: 'INITIALIZE', mid: 'FIND MID', compare: 'COMPARE', update: 'NARROW RANGE', done: 'COMPLETE' }[f.phase];
  [...$('array').querySelectorAll('.cell')].forEach((cell, i) => {
    cell.classList.toggle('selected', i >= start && i < start + k);
    cell.classList.toggle('entering', f.mid !== undefined && i === f.mid + k);
    const labels = []; if (i === f.left) labels.push('L'); if (i === f.right) labels.push('R'); if (i === f.mid) labels.push('mid');
    cell.querySelector('.pointer').textContent = labels.join(' · ');
  });
  const cellWidth = $('array').querySelector('.cell').getBoundingClientRect().width;
  $('window').style.transform = `translateX(${start * (cellWidth + 8)}px)`; $('window').style.width = `${k * (cellWidth + 8) + 2}px`;
  [...$('starts').children].forEach((el, i) => { el.classList.toggle('active', i >= f.left && i <= f.right); el.classList.toggle('middle', f.mid === i && f.phase !== 'update'); });
  $('distance-a').textContent = f.a ?? '—'; $('distance-b').textContent = f.b ?? '—';
  $('operator').textContent = f.a === undefined ? '?' : f.a > f.b ? '>' : f.a === f.b ? '=' : '<';
  $('expression-a').textContent = f.mid === undefined ? '左端比較值' : `${x} − (${arr[f.mid]})`;
  $('expression-b').textContent = f.mid === undefined ? '右側比較值' : `${arr[f.mid + k]} − (${x})`;
  $('title').textContent = f.title; $('note').textContent = f.note; $('result').textContent = f.phase === 'done' ? `[${arr.slice(f.left, f.left + k).join(', ')}]` : '';
  $('step-label').textContent = `STEP ${String(step + 1).padStart(2, '0')}`;
  $('counter').textContent = `${step + 1} / ${frames.length}`; $('seek').value = step; $('seek').max = frames.length - 1;
  $('prev').disabled = step === 0; $('next').disabled = step === frames.length - 1;
  [...$('code').children].forEach((row, i) => row.classList.toggle('active', f.line.includes(i + 1)));
  if (step === frames.length - 1) pause();
  else if (!timer) $('play').textContent = '播放動畫';
}
function load() {
  pause();
  try {
    const raw = $('arr').value.trim().replace(/^\[/, '').replace(/\]$/, '');
    if (!raw || !/^-?\d+(?:[\s,，]+-?\d+)*$/.test(raw)) throw new Error('陣列請使用逗號或空白分隔的整數，例如 1, 2, 3, 4, 5。');
    const nextArr = raw.split(/[\s,，]+/).map(Number), nextK = Number($('k').value), nextX = Number($('x').value);
    if (!$('k').value.trim() || !$('x').value.trim()) throw new Error('請填寫 k 與 x。');
    const nextFrames = closestTrace(nextArr, nextK, nextX);
    arr = nextArr; k = nextK; x = nextX; frames = nextFrames; step = 0;
    $('error').textContent = ''; $('array').querySelectorAll('.cell').forEach(cell => cell.remove());
    arr.forEach((v, i) => {
      const cell = document.createElement('div'); cell.className = 'cell';
      const pointer = document.createElement('div'); pointer.className = 'pointer';
      const value = document.createElement('div'); value.className = 'value'; value.textContent = v;
      if (String(v).length > 4) value.style.fontSize = '12px';
      const index = document.createElement('div'); index.className = 'index'; index.textContent = i;
      cell.append(pointer, value, index); $('array').append(cell);
    });
    $('starts').replaceChildren();
    for (let i = 0; i <= arr.length - k; i++) { const el = document.createElement('span'); el.className = 'start'; el.textContent = i; $('starts').append(el); }
    fitArray();
  } catch (error) { $('error').textContent = error.message; }
}
function fitArray() {
  const available = document.querySelector('.array-scroll').clientWidth - 28;
  const width = Math.max(24, Math.min(54, (available - 8 * (arr.length - 1)) / arr.length));
  $('array').querySelectorAll('.cell').forEach(cell => cell.style.width = `${width}px`);
  render();
}
window.addEventListener('resize', () => { if (frames) fitArray(); });
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
const examples = { tie: [[1, 2, 3, 4, 5], 4, 3], outside: [[1, 2, 3, 4, 5], 3, -2], duplicate: [[1, 2, 2, 2, 3, 4, 5], 3, 2], all: [[1, 2, 3, 4, 5], 5, 3] };
document.querySelectorAll('[data-example]').forEach(button => button.onclick = () => { const [a, count, target] = examples[button.dataset.example]; $('arr').value = a.join(', '); $('k').value = count; $('x').value = target; load(); });
load();
