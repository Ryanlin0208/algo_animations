const $ = id => document.getElementById(id);
const source = `class Solution:
    def decodeString(self, s: str) -> str:
        stack = []
        current_string = ""
        current_number = 0

        for char in s:
            if char.isdigit():
                current_number = current_number * 10 + int(char)
            elif char == '[':
                stack.append((current_string, current_number))
                current_string = ""
                current_number = 0
            elif char == ']':
                previous_string, repeat = stack.pop()
                current_string = (previous_string + current_string * repeat)
            else:
                current_string += char

        return current_string`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let frames, step = 0, timer = null;
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
  const f=frames[step];
  $('phase').textContent={init:'INITIALIZE',visit:'READ CHAR',branch:'BRANCH',number:'NUMBER',push:'PUSH',pop:'POP',expand:'EXPAND',append:'APPEND','reset-string':'RESET STRING','reset-number':'RESET NUMBER',done:'COMPLETE'}[f.phase];
  $('char').textContent=f.char ?? '—';$('number').textContent=f.current_number;$('depth').textContent=f.stack.length;
  [...$('chars').children].forEach((cell,i)=>{cell.classList.toggle('selected',i<f.index||f.phase==='done');cell.classList.toggle('entering',i===f.index);cell.querySelector('.pointer').textContent=i===f.index?'char':'';});
  const activeCell=$('chars').children[f.index];
  if(activeCell){const viewport=$('chars').parentElement, r=activeCell.getBoundingClientRect(),box=viewport.getBoundingClientRect();if(r.left<box.left||r.right>box.right)viewport.scrollLeft+=r.left-box.left-20;}
  $('stack').replaceChildren();
  [...f.stack].reverse().forEach(([text,count],i)=>{const card=document.createElement('div');card.className='stack-card'+(i===0&&f.phase==='push'?' fresh':'');card.textContent=`${i===0?'TOP · ':''}(${JSON.stringify(text)}, ${count})`;$('stack').append(card);});
  if(!f.stack.length){const empty=document.createElement('span');empty.className='stack-empty';empty.textContent='[] 空堆疊';$('stack').append(empty);}
  $('current-string').textContent=JSON.stringify(f.current_string);
  $('expansion').textContent=f.repeat===undefined?'遇到 ] 時顯示展開式':`${JSON.stringify(f.previous_string)} + ${JSON.stringify(f.inner)} × ${f.repeat}${f.phase==='pop'?'（尚未執行）':''}`;
  $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=f.phase==='done'?JSON.stringify(f.current_string):'';
  $('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;
  $('prev').disabled=step===0;$('next').disabled=step===frames.length-1;
  [...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));
  if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';
}
function load() {
  pause();try {
    const input=$('s').value,nextFrames=decodeTrace(input);frames=nextFrames;step=0;$('error').textContent='';$('chars').replaceChildren();
    [...input].forEach((char,i)=>{const cell=document.createElement('div');cell.className='cell';const pointer=document.createElement('div');pointer.className='pointer';const value=document.createElement('div');value.className='value';value.textContent=char;const index=document.createElement('div');index.className='index';index.textContent=i;cell.append(pointer,value,index);$('chars').append(cell);});
    $('chars').parentElement.scrollLeft=0;render();
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
const examples={nested:'3[a2[c]]',groups:'2[abc]3[cd]ef',digits:'12[a]',plain:'abcXYZ'};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{$('s').value=examples[button.dataset.example];load();});
load();
