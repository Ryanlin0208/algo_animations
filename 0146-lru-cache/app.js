const $ = id => document.getElementById(id);
const source = `class Node:
    def __init__(self, key, val):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

        # left = LRU
        # right = MRU
        self.left = Node(0, 0)
        self.right = Node(0, 0)

        self.left.next = self.right
        self.right.prev = self.left

    def remove(self, node):
        prev = node.prev
        nxt = node.next

        prev.next = nxt
        nxt.prev = prev

    def insert(self, node):
        prev = self.right.prev
        nxt = self.right

        prev.next = node
        nxt.prev = node

        node.prev = prev
        node.next = nxt

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1

        node = self.cache[key]

        # 变成最近使用
        self.remove(node)
        self.insert(node)

        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.remove(self.cache[key])

        node = Node(key, value)
        self.cache[key] = node
        self.insert(node)

        if len(self.cache) > self.capacity:
            lru = self.left.next

            self.remove(lru)
            del self.cache[lru.key]`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let capacity, operations, frames, step = 0, timer = null;
const name = id => id ?? 'None';
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
  const f = frames[step]; $('phase').textContent = f.phase.toUpperCase();
  $('size').textContent = `${f.cache.length} / ${capacity}`;
  $('operation').textContent = f.operation < 0 ? '初始化' : `${f.operation+1}/${operations.length} ${operations[f.operation][0]}(${operations[f.operation].slice(1).join(',')})`;
  $('chain').replaceChildren();const seen = new Set();let id='L';
  while (id !== null && !seen.has(id)) {
    seen.add(id);const node=f.nodes[id], chip=document.createElement('span');chip.className='chip';chip.textContent=['L','R'].includes(id)?id:`${id} · ${node.key}:${node.val}`;
    $('chain').append(chip);id=node.next;if(id!==null)$('chain').append(document.createTextNode(' → '));
  }
  if(id===null && !seen.has('R'))$('chain').append(document.createTextNode(' → None（尚未接到 R）'));
  if(id!==null)$('chain').append(document.createTextNode('循環'));
  $('cache').replaceChildren();
  f.cache.forEach(([key,id])=>{const chip=document.createElement('span');chip.className='chip';chip.textContent=`${key} → ${id} (${f.nodes[id].val})`;$('cache').append(chip);});
  if(!f.cache.length)$('cache').textContent='{}';
  $('locals').textContent=Object.entries(f.locals).map(([key,id])=>`${key} = ${name(id)}`).join(' · ') || '區域指標：—';
  $('nodes').replaceChildren();
  Object.entries(f.nodes).forEach(([id,n])=>{
    const row=document.createElement('tr');row.classList.toggle('inactive',!seen.has(id));
    [id, ['L','R'].includes(id)?'哨兵':`${n.key} : ${n.val}`,name(n.prev),name(n.next)].forEach((value,i)=>{
      const cell=document.createElement('td');cell.textContent=value;cell.classList.toggle('changed',f.changed===`${id}.${i===2?'prev':i===3?'next':''}`);row.append(cell);
    });$('nodes').append(row);
  });
  $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=`輸出：${JSON.stringify(f.results)}`;
  $('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;
  $('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;
  $('prev').disabled=step===0;$('next').disabled=step===frames.length-1;
  [...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));
  const active=$('code').querySelector('.active');
  if(active){const box=$('code').getBoundingClientRect(),r=active.getBoundingClientRect();if(r.top<box.top||r.bottom>box.bottom)$('code').scrollTop+=r.top-box.top-40;}
  if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';
}
function load() {
  pause();try {
    if(!$('capacity').value.trim())throw new Error('請填寫 capacity。');
    let ops;try{ops=JSON.parse($('operations').value);}catch{throw new Error('操作必須是 JSON，例如 [["put",1,10],["get",1]]。');}
    const c=Number($('capacity').value),nextFrames=lruTrace(c,ops);capacity=c;operations=ops;frames=nextFrames;step=0;$('error').textContent='';render();
  }catch(error){$('error').textContent=error.message;}
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
const examples={classic:[2,[['put',1,1],['put',2,2],['get',1],['put',3,3],['get',2],['put',4,4],['get',1],['get',3],['get',4]]],update:[2,[['put',1,10],['put',2,20],['put',1,99],['get',1]]],one:[1,[['put',1,10],['put',2,20],['get',1],['get',2]]],miss:[2,[['get',7],['put',1,10],['get',2],['get',1]]]};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{const [c,ops]=examples[button.dataset.example];$('capacity').value=c;$('operations').value=JSON.stringify(ops);load();});
load();
