const $ = id => document.getElementById(id);
const source = `import heapq
from collections import Counter

class Solution:
    def leastInterval(self, tasks: list[str], n: int) -> int:
        heap = [-v for v in Counter(tasks).values()]
        heapq.heapify(heap)
        time = 0

        while heap:
            temp = []
            used = 0

            for _ in range(n + 1):
                if not heap:
                    break

                freq = heapq.heappop(heap)
                used += 1
                freq += 1

                if freq < 0:
                    temp.append(freq)

            for freq in temp:
                heapq.heappush(heap, freq)

            if heap:
                time += n + 1
            else:
                time += used

        return time`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let frames,step=0,timer=null,cooldown;
function pause(){clearInterval(timer);timer=null;$('play').textContent=step===frames?.length-1?'重新播放':'播放動畫';}
function cards(id,values){$(id).replaceChildren();values.forEach(v=>{const el=document.createElement('span');el.className='heap-card';el.textContent=`${v}（剩 ${-v}）`;$(id).append(el);});if(!values.length)$(id).textContent='[]';}
function render(){const f=frames[step];$('phase').textContent=f.phase.toUpperCase();for(const key of ['time','used','freq'])$(key).textContent=f[key]??'—';$('cycle').textContent=cooldown+1;cards('heap',f.heap);cards('temp',f.temp);
 $('round-label').textContent=`第 ${f.round} 輪 · 已執行 ${f.used} 個時槽`;$('slots').replaceChildren();const finished=f.phase==='time'||f.phase==='done';const duration=finished?f.rounds.at(-1)?.duration:cooldown+1;
 if(f.round)for(let i=0;i<(duration??0);i++){const el=document.createElement('span');el.className='slot'+(i<f.used?' work':finished?' idle':'');el.textContent=i<f.used?'工作':finished?'idle':'待定';$('slots').append(el);}
 $('history').replaceChildren();f.rounds.forEach((r,i)=>{const row=document.createElement('div');row.textContent=`第 ${i+1} 輪：${r.used} 工作 + ${r.idle} idle = ${r.duration}`;$('history').append(row);});
 $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=f.phase==='done'?`return ${f.result}`:'';$('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;$('prev').disabled=step===0;$('next').disabled=step===frames.length-1;[...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));const active=$('code').querySelector('.active');if(active){const a=active.getBoundingClientRect(),b=$('code').getBoundingClientRect();if(a.top<b.top||a.bottom>b.bottom)$('code').scrollTop+=a.top-b.top-30;}if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';}
function load(){pause();try{const raw=$('tasks').value.trim();if(!/^[A-Z](?:[\s,，]*[A-Z])*$/.test(raw)||!$('n').value.trim())throw new Error('請輸入 A–Z 任務（可用逗號分隔）與冷卻 n。');const tasks=raw.replace(/[\s,，]/g,'').split(''),n=Number($('n').value),nextFrames=schedulerTrace(tasks,n);cooldown=n;frames=nextFrames;step=0;$('error').textContent='';render();}catch(error){$('error').textContent=error.message;}}
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
const examples={classic:['AAABBB',2],zero:['AAABBB',0],diverse:['AAABBBCC',2],single:['AAAA',3]};document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{const [s,n]=examples[button.dataset.example];$('tasks').value=[...s].join(', ');$('n').value=n;load();});load();
