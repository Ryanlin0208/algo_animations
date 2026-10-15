const $ = id => document.getElementById(id);
const source = `import heapq
from collections import Counter

class Solution:
    def reorganizeString(self, s: str) -> str:
        count = Counter(s)
        heap = []

        for char, freq in count.items():
            heapq.heappush(heap, (-freq, char))

        ans = []
        prev_count = 0
        prev_char = ""

        while heap:
            freq, char = heapq.heappop(heap)
            # 使用現在這個 char
            ans.append(char)
            freq += 1

            # 把上一輪扣住的 char 放回去
            if prev_count < 0:
                heapq.heappush(heap, (prev_count, prev_char))

            # 現在這個 char 變成下一輪不能使用的
            prev_count = freq
            prev_char = char

        if len(ans) != len(s):
            return ""

        return "".join(ans)`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let frames,step=0,timer=null,input;
function pause(){clearInterval(timer);timer=null;$('play').textContent=step===frames?.length-1?'重新播放':'播放動畫';}
function render(){const f=frames[step];$('phase').textContent=f.phase.toUpperCase();$('char').textContent=f.char??'—';$('freq').textContent=f.freq??'—';$('length').textContent=`${f.ans.length} / ${input.length}`;
 $('heap').replaceChildren();[...f.heap].sort((a,b)=>a[0]-b[0]||(a[1]<b[1]?-1:1)).forEach(([freq,char],i)=>{const card=document.createElement('div');card.className='heap-card';const letter=document.createElement('strong');letter.textContent=char;const label=document.createElement('span');label.textContent=`${i===0?'先取 · ':''}剩 ${-freq} · ${freq}`;card.append(letter,label);$('heap').append(card);});if(!f.heap.length)$('heap').textContent='[] 空堆積';
 $('counts').textContent=f.counts.map(([c,n])=>`${c}: ${n}`).join(' · ');$('held').textContent=`prev_char = ${JSON.stringify(f.prev_char)}
prev_count = ${f.prev_count}`;$('held').style.whiteSpace='pre-wrap';
 $('answer').replaceChildren();f.ans.forEach(c=>{const el=document.createElement('span');el.className='heap-card';el.textContent=c;$('answer').append(el);});if(!f.ans.length)$('answer').textContent='[]';
 $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=f.phase==='done'?`return ${JSON.stringify(f.result)}`:'';
 $('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;$('prev').disabled=step===0;$('next').disabled=step===frames.length-1;[...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));
 const active=$('code').querySelector('.active');if(active){const a=active.getBoundingClientRect(),b=$('code').getBoundingClientRect();if(a.top<b.top||a.bottom>b.bottom)$('code').scrollTop+=a.top-b.top-30;}
 if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';}
function load(){pause();try{const value=$('s').value,nextFrames=reorganizeTrace(value);input=value;frames=nextFrames;step=0;$('error').textContent='';render();}catch(error){$('error').textContent=error.message;}}
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
const examples={classic:'aaabbc',impossible:'aaab',tie:'ccbbaa',single:'a'};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{$('s').value=examples[button.dataset.example];load();});load();
