const $ = id => document.getElementById(id);
const source = `class Solution:
    def shipWithinDays(self, weights: list[int], days: int) -> int:
        left, right = max(weights), sum(weights)
        ans = right
        while left <= right:
            mid = (left + right) // 2

            days_needed = 1
            current = 0
            for weight in weights:
                if current + weight > mid:
                    days_needed += 1
                    current = 0

                current += weight

            if days_needed <= days:
                ans = mid
                right = mid - 1
            else:
                left = mid + 1

        return ans`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let weights, days, frames, step=0,timer=null;
function pause(){clearInterval(timer);timer=null;$('play').textContent=step===frames?.length-1?'重新播放':'播放動畫';}
function render(){const f=frames[step],min=Math.max(...weights),max=weights.reduce((a,b)=>a+b,0),percent=v=>min===max?50:(v-min)/(max-min)*100;
 $('phase').textContent=f.phase.toUpperCase();for(const k of ['left','right','mid','ans'])$(k).textContent=f[k]??'—';
 $('range-label').textContent=f.left<=f.right?`候選載重 [${f.left}, ${f.right}]`:'候選範圍已空';$('interval').hidden=f.left>f.right;$('interval').style.left=`${percent(f.left)}%`;$('interval').style.width=`${Math.max(0,percent(f.right)-percent(f.left))}%`;$('mid-marker').hidden=f.mid===undefined;$('mid-marker').style.left=`${percent(f.mid??min)}%`;$('min-capacity').textContent=min;$('max-capacity').textContent=max;
 [...$('packages').children].forEach((cell,i)=>{cell.classList.toggle('selected',i<f.loaded);cell.classList.toggle('entering',i===f.index);cell.querySelector('.pointer').textContent=i===f.index?'weight':'';});
 $('boats').replaceChildren();f.loads.forEach((items,i)=>{const row=document.createElement('div');row.className='boat';const label=document.createElement('span');label.textContent=`第 ${i+1} 天`;const load=document.createElement('div');load.className='boat-load';items.forEach(v=>{const item=document.createElement('span');item.className='package';item.textContent=v;item.style.width=`${v/f.simCapacity*100}%`;load.append(item);});const total=document.createElement('span');total.className='boat-total';total.textContent=`${items.reduce((a,b)=>a+b,0)} / ${f.simCapacity}`;row.append(label,load,total);$('boats').append(row);});
 $('load-status').textContent=f.simCapacity===undefined?'尚未模擬':`圖中載重 ${f.simCapacity}`;$('needed').textContent=f.days_needed??'—';$('limit').textContent=days;$('current-load').textContent=`current = ${f.current??'—'}`;$('progress').textContent=`已裝 ${f.loaded} / ${weights.length} 件`;$('operator').textContent=f.loaded!==weights.length?'?':f.days_needed<=days?'≤':'>';
 $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=f.phase==='done'?`return ${f.ans}`:'';$('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;$('prev').disabled=step===0;$('next').disabled=step===frames.length-1;[...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';}
function load(){pause();try{const raw=$('weights').value.trim().replace(/^\[/,'').replace(/\]$/,'');if(!/^\d+(?:[\s,，]+\d+)*$/.test(raw)||!$('days').value.trim())throw new Error('請填寫包裹重量與 days。');const a=raw.split(/[\s,，]+/).map(Number),d=Number($('days').value),nextFrames=shipTrace(a,d);weights=a;days=d;frames=nextFrames;step=0;$('error').textContent='';$('packages').replaceChildren();a.forEach((v,i)=>{const cell=document.createElement('div');cell.className='cell';for(const [cls,text] of [['pointer',''],['value',v],['index',i]]){const el=document.createElement('div');el.className=cls;el.textContent=text;cell.append(el);}$('packages').append(cell);});render();}catch(error){$('error').textContent=error.message;}}
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
const examples={classic:[[1,2,3,4,5,6,7,8,9,10],5],one:[[3,2,2,4,1,4],1],many:[[3,2,2,4,1,4],6],equal:[[2,2,2,2],2]};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{const [a,d]=examples[button.dataset.example];$('weights').value=a.join(', ');$('days').value=d;load();});load();
