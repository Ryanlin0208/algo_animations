const $ = id => document.getElementById(id);
const source = `class Solution:
    def productExceptSelf(self, nums: list[int]) -> list[int]:
        arr = [1] * len(nums)
        prefix = 1
        for i in range(len(nums)):
            arr[i] *= prefix
            prefix *= nums[i]

        postfix = 1
        for i in range(len(nums) - 1, -1, -1):
            arr[i] *= postfix
            postfix *= nums[i] 
            
        return arr`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let nums, frames, step = 0, timer = null;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
  const f = frames[step];
  $('i').textContent = f.i ?? '—'; $('prefix').textContent = f.prefix ?? '—'; $('postfix').textContent = f.postfix ?? '—';
  $('phase').textContent = { init: 'INITIALIZE', prefix: 'PREFIX →', visit: 'NEXT INDEX', write: 'UPDATE ARR', accumulate: 'ACCUMULATE', postfix: '← POSTFIX', done: 'COMPLETE' }[f.phase];
  $('direction').textContent = f.pass === 'left' ? '第一趟：由左往右 →' : f.pass === 'right' ? '第二趟：← 由右往左' : f.phase === 'done' ? '兩趟掃描完成' : '初始化';
  [...$('nums-row').children].forEach((cell, i) => {
    cell.classList.toggle('selected', f.pass === 'left' ? i < f.leftEnd : f.pass === 'right' && i > f.rightStart);
    cell.classList.toggle('entering', i === f.i);
    cell.querySelector('.pointer').textContent = i === f.i ? 'i' : '';
  });
  [...$('arr-row').children].forEach((cell, i) => {
    cell.querySelector('.value').textContent = f.arr[i].toString();
    cell.classList.toggle('entering', i === f.i);
    cell.classList.toggle('selected', f.phase === 'done' || f.pass === 'right' && (i > f.i || i === f.i && ['write', 'accumulate'].includes(f.phase)));
    cell.querySelector('.pointer').textContent = i === f.i ? 'arr[i]' : '';
  });
  $('expression').textContent = f.expression;
  $('operation-note').textContent = f.phase === 'accumulate' ? '已包含 nums[i]，提供給下一個索引使用' : f.phase === 'write' ? '使用不包含 nums[i] 的累積量' : '每次只執行高亮的程式碼';
  $('title').textContent = f.title; $('note').textContent = f.note;
  $('result').textContent = f.phase === 'done' ? `[${f.arr.join(', ')}]` : '';
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
    if (!/^-?\d+(?:[\s,，]+-?\d+)*$/.test(raw)) throw new Error('請使用逗號或空白分隔整數，可包含負數與零。');
    const nextNums = raw.split(/[\s,，]+/).map(Number), nextFrames = productTrace(nextNums);
    nums = nextNums; frames = nextFrames; step = 0; $('error').textContent = '';
    ['nums-row', 'arr-row'].forEach(id => {
      $(id).replaceChildren();
      nums.forEach((num, i) => {
        const cell = document.createElement('div'); cell.className = 'cell';
        const pointer = document.createElement('div'); pointer.className = 'pointer';
        const value = document.createElement('div'); value.className = 'value'; value.textContent = id === 'nums-row' ? num : 1;
        const index = document.createElement('div'); index.className = 'index'; index.textContent = i;
        cell.append(pointer, value, index); $(id).append(cell);
      });
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
const examples = { classic: [1, 2, 3, 4], negative: [-1, 2, -3, 4], zero: [-1, 1, 0, -3, 3], zeros: [0, 2, 0, 4] };
document.querySelectorAll('[data-example]').forEach(button => button.onclick = () => { $('nums').value = examples[button.dataset.example].join(', '); load(); });
load();
