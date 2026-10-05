const $ = id => document.getElementById(id);
const source = `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseBetween(self, head: ListNode | None, left: int, right: int) -> ListNode | None:
        dummy = ListNode(0, head)
        cnt_head = dummy
        for _ in range(left - 1):
            cnt_head = cnt_head.next

        cur = cnt_head.next
        prev = None
        for _ in range(right - left + 1):
            tmp = cur.next
            cur.next = prev
            prev = cur
            cur = tmp

        cnt_head.next.next = cur
        cnt_head.next = prev
        
        return dummy.next`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let nums, left, right, frames, step = 0, timer = null;
const name = id => id === undefined ? '—' : id === null ? 'None' : id === 0 ? 'dummy' : `N${id}`;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function svg(tag, attrs, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  if (text !== undefined) el.textContent = text;
  return el;
}
function render() {
  const f = frames[step];
  $('phase').textContent = { dummy: 'DUMMY', locate: 'FIND PREDECESSOR', init: 'INITIALIZE', loop: 'REVERSE', save: 'SAVE NEXT', reverse: 'REWIRE NEXT', prev: 'MOVE PREV', cur: 'MOVE CUR', tail: 'RECONNECT TAIL', head: 'RECONNECT HEAD', done: 'COMPLETE' }[f.phase];
  $('pointers').replaceChildren();
  for (const key of ['head', 'cnt_head', 'cur', 'prev', 'tmp']) {
    const chip = document.createElement('span'); chip.className = 'pointer-chip'; chip.textContent = `${key}: ${name(f[key])}`; $('pointers').append(chip);
  }
  const graph = $('graph'); graph.replaceChildren();
  graph.setAttribute('viewBox', `0 0 ${(nums.length + 1) * 92 + 20} 205`);
  graph.style.width = `${(nums.length + 1) * 92 + 20}px`;
  const defs = svg('defs', {});
  ['normal', 'changed'].forEach(type => {
    const marker = svg('marker', { id: `arrow-${type}`, markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto' });
    marker.append(svg('path', { d: 'M0,0 L8,4 L0,8 Z', fill: type === 'changed' ? '#ffb16b' : '#9aacc1' })); defs.append(marker);
  }); graph.append(defs);
  const x = i => 48 + i * 92;
  f.next.forEach((to, from) => {
    const changed = f.changed === from;
    let d;
    if (to === null) {
      d = `M${x(from)},118 L${x(from)},163`;
      graph.append(svg('text', { x: x(from), y: 181, class: 'null-text' }, 'None'));
    } else if (to === from + 1) d = `M${x(from)+27},96 L${x(to)-29},96`;
    else {
      const y = to < from ? 145 : 30;
      d = `M${x(from)},${to < from ? 118 : 74} C${x(from)},${y} ${x(to)},${y} ${x(to)},${to < from ? 120 : 72}`;
    }
    graph.append(svg('path', { d, class: `edge${changed ? ' changed' : ''}`, 'marker-end': `url(#arrow-${changed ? 'changed' : 'normal'})` }));
  });
  f.next.forEach((_, i) => {
    graph.append(svg('rect', { x: x(i)-27, y: 74, width: 54, height: 44, rx: 7, class: `graph-node${i >= left && i <= right ? ' in-range' : ''}${f.changed === i ? ' changed' : ''}` }));
    graph.append(svg('text', { x: x(i), y: 101, class: 'node-text' }, i ? nums[i-1] : 0));
    graph.append(svg('text', { x: x(i), y: 65, class: 'node-id' }, name(i)));
  });
  const chain = []; let id = f.next[0]; const seen = new Set();
  while (id !== null && !seen.has(id)) { seen.add(id); chain.push(`${name(id)}(${nums[id-1]})`); id = f.next[id]; }
  $('chain').textContent = [...chain, id === null ? 'None' : '循環'].join(' → ');
  $('expression').textContent = f.expression; $('title').textContent = f.title; $('note').textContent = f.note;
  $('result').textContent = f.phase === 'done' ? `[${[...seen].map(i => nums[i-1]).join(', ')}]` : '';
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
    if (!/^-?\d+(?:[\s,，]+-?\d+)*$/.test(raw)) throw new Error('請使用逗號或空白分隔整數。');
    if (!$('left').value.trim() || !$('right').value.trim()) throw new Error('請填寫 left 與 right。');
    const a = raw.split(/[\s,，]+/).map(Number), l = Number($('left').value), r = Number($('right').value);
    const nextFrames = reverseTrace(a, l, r); nums = a; left = l; right = r; frames = nextFrames; step = 0; $('error').textContent = ''; render();
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
const examples = { middle: [[1,2,3,4,5],2,4], all: [[1,2,3,4,5],1,5], tail: [[1,2,3,4,5],3,5], single: [[5],1,1] };
document.querySelectorAll('[data-example]').forEach(button => button.onclick = () => {
  const [a,l,r] = examples[button.dataset.example]; $('nums').value = a.join(', '); $('left').value = l; $('right').value = r; load();
});
load();
