const $ = id => document.getElementById(id);
const source = `class Solution:
    def minEatingSpeed(self, piles: List[int], h: int) -> int:
        l, r = 1, max(piles)
        ans = r
        while l <= r:
            m = (l + r) // 2
            hours = 0

            for i in piles:
                hours += (i + m - 1) // m

            if hours <= h:
                ans = min(ans, m)
                r = m - 1
            else:
                l = m + 1
        
        return ans`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let piles, h, frames, step = 0, timer = null;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
 const f=frames[step],max=Math.max(...piles),percent=v=>max===1?50:(v-1)/(max-1)*100;
 $('phase').textContent={init:'INITIALIZE',loop:'WHILE',mid:'MID SPEED',reset:'RESET HOURS',pile:'NEXT PILE',sum:'ADD HOURS',compare:'FEASIBILITY',answer:'SAVE ANSWER',update:'NARROW RANGE',stop:'STOP',done:'COMPLETE'}[f.phase];
 for(const key of ['l','r','m','ans'])$(key).textContent=f[key]??'—';
 $('range-label').textContent=f.l<=f.r?`候選速度 [${f.l}, ${f.r}]`:`候選範圍已空：${f.l} > ${f.r}`;
 $('interval').hidden=f.l>f.r;$('interval').style.left=`${percent(f.l)}%`;$('interval').style.width=`${max===1?0:Math.max(0,percent(f.r)-percent(f.l))}%`;
 $('mid-marker').hidden=f.m===undefined;$('mid-marker').style.left=`${percent(f.m??1)}%`;$('max-speed').textContent=`${max} 根／小時`;
 [...$('chart').children].forEach((day,i)=>{day.classList.toggle('waiting',f.costs[i]!==undefined);day.classList.toggle('current',i===f.index);day.querySelector('.answer').textContent=f.costs[i]===undefined?'— 小時':`${f.costs[i]} 小時`;});
 $('hours').textContent=f.hours??'—';$('limit').textContent=h;
 const stale=['loop','mid'].includes(f.phase);$('progress').textContent=stale?'上一輪計算，下一步會歸零':`已計算 ${f.costs.length} / ${piles.length} 堆`;
 $('operator').textContent=f.hours===undefined||f.costs.length<piles.length||stale?'?':f.hours<=h?'≤':'>';
 $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=f.phase==='done'?`return ${f.ans}`:'';
 $('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;
 $('prev').disabled=step===0;$('next').disabled=step===frames.length-1;[...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));
 if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';
}
function load(){pause();try{
 const raw=$('piles').value.trim().replace(/^\[/,'').replace(/\]$/,'');if(!/^\d+(?:[\s,，]+\d+)*$/.test(raw)||!$('h').value.trim())throw new Error('請填寫以逗號或空白分隔的香蕉數量，以及時限 h。');
 const values=raw.split(/[\s,，]+/).map(Number),limit=Number($('h').value),nextFrames=kokoTrace(values,limit);piles=values;h=limit;frames=nextFrames;step=0;$('error').textContent='';$('chart').replaceChildren();
 values.forEach((v,i)=>{const day=document.createElement('div');day.className='day';const space=document.createElement('div');space.className='bar-space';const bar=document.createElement('div');bar.className='bar';bar.style.height=`${15+v/Math.max(...values)*70}px`;const label=document.createElement('span');label.textContent=v;bar.append(label);space.append(bar);const index=document.createElement('div');index.className='day-index';index.textContent=`堆 ${i+1}`;const answer=document.createElement('div');answer.className='answer';day.append(space,index,answer);$('chart').append(day);});render();
 }catch(error){$('error').textContent=error.message;}}
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
const examples={classic:[[3,6,7,11],8],tight:[[30,11,23,4,20],5],loose:[[3,6,7,11],27],single:[[9],4]};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{const [a,h]=examples[button.dataset.example];$('piles').value=a.join(', ');$('h').value=h;load();});
load();
