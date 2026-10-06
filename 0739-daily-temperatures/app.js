const $ = id => document.getElementById(id);
const source = `class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        n = len(temperatures)
        ans = [0] * n
        stk = []

        for i in range(n):
            while stk and temperatures[i] > temperatures[stk[-1]]:
                idx = stk.pop()
                ans[idx] = i - idx

            stk.append(i)

        return ans`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let temperatures, frames, step = 0, timer = null;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
 const f=frames[step];$('phase').textContent={init:'INITIALIZE',visit:'NEXT DAY',compare:'COMPARE',pop:'POP',write:'UPDATE ANSWER',push:'PUSH',done:'COMPLETE'}[f.phase];
 $('i').textContent=f.i??'—';$('temperature').textContent=f.i===undefined?'—':temperatures[f.i];$('idx').textContent=f.idx??'—';
 [...$('chart').children].forEach((day,i)=>{day.classList.toggle('waiting',f.stk.includes(i));day.classList.toggle('current',i===f.i);day.classList.toggle('updated',f.phase==='write'&&f.idx===i);day.querySelector('.answer').textContent=`ans ${f.ans[i]}`;});
 const active=$('chart').children[f.i];if(active){const viewport=$('chart').parentElement,r=active.getBoundingClientRect(),box=viewport.getBoundingClientRect();if(r.left<box.left||r.right>box.right)viewport.scrollLeft+=r.left-box.left-15;}
 $('stack').replaceChildren();[...f.stk].reverse().forEach((idx,i)=>{const card=document.createElement('div');card.className='stack-card'+(i===0&&f.phase==='push'?' fresh':'');card.textContent=`${i===0?'TOP · ':''}索引 ${idx} · ${temperatures[idx]}°`;$('stack').append(card);});
 if(!f.stk.length)$('stack').textContent='[] 空堆疊';
 $('comparison').textContent=f.condition??'等待檢查 while 條件';$('calculation').textContent=f.phase==='pop'?`idx = ${f.idx}（下一步才回填）`:f.phase==='write'?`ans[${f.idx}] = ${f.i} − ${f.idx} = ${f.ans[f.idx]}`:'ans[idx] = i − idx';
 $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=f.phase==='done'?`[${f.ans.join(', ')}]`:'';
 $('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;
 $('prev').disabled=step===0;$('next').disabled=step===frames.length-1;[...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));
 if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';
}
function load() {
 pause();try{
  const raw=$('temperatures').value.trim().replace(/^\[/,'').replace(/\]$/,'');if(!/^\d+(?:[\s,，]+\d+)*$/.test(raw))throw new Error('請以逗號或空白分隔整數溫度。');
  const values=raw.split(/[\s,，]+/).map(Number),nextFrames=temperatureTrace(values);temperatures=values;frames=nextFrames;step=0;$('error').textContent='';$('chart').replaceChildren();
  values.forEach((temp,i)=>{const day=document.createElement('div');day.className='day';const space=document.createElement('div');space.className='bar-space';const bar=document.createElement('div');bar.className='bar';bar.style.height=`${15+(temp-30)}px`;const label=document.createElement('span');label.textContent=temp;bar.append(label);space.append(bar);const index=document.createElement('div');index.className='day-index';index.textContent=`i ${i}`;const answer=document.createElement('div');answer.className='answer';day.append(space,index,answer);$('chart').append(day);});
  $('chart').parentElement.scrollLeft=0;render();
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
const examples={classic:[73,74,75,71,69,72,76,73],equal:[70,70,71],decreasing:[90,80,70,60],cascade:[75,73,71,69,80]};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{$('temperatures').value=examples[button.dataset.example].join(', ');load();});
load();
