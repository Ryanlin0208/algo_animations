const $ = id => document.getElementById(id);
const source = `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end

    def startsWith(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let operations,frames,step=0,timer=null,positions,width,height;
function pause(){clearInterval(timer);timer=null;$('play').textContent=step===frames?.length-1?'重新播放':'播放動畫';}
function svg(tag,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function layout(nodes){positions={};let leaves=0,maxDepth=0;function place(id,depth){maxDepth=Math.max(maxDepth,depth);const children=Object.values(nodes[id].children);const xs=children.map(child=>place(child,depth+1));const x=xs.length?(xs[0]+xs.at(-1))/2:55+leaves++*85;positions[id]={x,y:50+depth*84};return x;}place(0,0);width=Math.max(440,leaves*85+25);height=maxDepth*84+100;}
function render(){const f=frames[step],op=operations[f.operation];$('phase').textContent=f.phase.toUpperCase();$('node').textContent=`N${f.node}`;$('char').textContent=f.char??'—';$('size').textContent=f.nodes.length;$('operation').textContent=op?`${f.operation+1}/${operations.length} · ${op[0]}("${op[1]}")`:'Trie()';
 $('word').replaceChildren();if(op)[...op[1]].forEach((c,i)=>{const el=document.createElement('span');el.className='letter'+(i===f.index?' active':i<f.path.length-1?' read':'');el.textContent=c;$('word').append(el);});
 const graph=$('graph');graph.replaceChildren();graph.setAttribute('viewBox',`0 0 ${width} ${height}`);graph.style.width=`${width}px`;graph.style.height=`${height}px`;
 graph.append(svg('title',{},'Trie：圓圈是節點，雙圈為單字結尾，橘色為目前 node'));
 f.nodes.forEach(n=>{if(n.parent===null)return;const a=positions[n.parent],b=positions[n.id];graph.append(svg('line',{x1:a.x,y1:a.y+24,x2:b.x,y2:b.y-24,class:'edge'+(f.path.includes(n.id)?' path':'')}));graph.append(svg('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2+4,class:'edge-label'},n.char));});
 f.nodes.forEach(n=>{const pos=positions[n.id],g=svg('g',{class:f.created===n.id?'new-node':''});g.append(svg('title',{},`N${n.id}，前綴 ${n.prefix||'空'}，is_end = ${n.is_end}`));g.append(svg('circle',{cx:pos.x,cy:pos.y,r:24,class:'trie-node'+(f.path.includes(n.id)?' path':'')+(f.node===n.id?' current':'')}));if(n.is_end)g.append(svg('circle',{cx:pos.x,cy:pos.y,r:19,class:'terminal'}));g.append(svg('text',{x:pos.x,y:pos.y,class:'node-label'},n.id===0?'ROOT':`N${n.id}`));graph.append(g);});
 const n=f.nodes[f.node];$('node-detail').textContent=`N${n.id} · prefix = "${n.prefix}" · is_end = ${n.is_end?'True':'False'} · children = {${Object.entries(n.children).map(([c,id])=>`${c}: N${id}`).join(', ')}}`;
 const box=graph.parentElement,pos=positions[f.created??f.node];if(pos.y<box.scrollTop+25||pos.y>box.scrollTop+box.clientHeight-30)box.scrollTop=Math.max(0,pos.y-box.clientHeight/2);if(pos.x<box.scrollLeft+25||pos.x>box.scrollLeft+box.clientWidth-30)box.scrollLeft=Math.max(0,pos.x-box.clientWidth/2);
 $('title').textContent=f.title;$('note').textContent=f.note;$('result').textContent=`輸出：${JSON.stringify(f.results)}`;$('step-label').textContent=`STEP ${String(step+1).padStart(2,'0')}`;$('counter').textContent=`${step+1} / ${frames.length}`;$('seek').max=frames.length-1;$('seek').value=step;$('prev').disabled=step===0;$('next').disabled=step===frames.length-1;[...$('code').children].forEach((row,i)=>row.classList.toggle('active',f.line.includes(i+1)));
 const active=$('code').querySelector('.active');if(active){const a=active.getBoundingClientRect(),b=$('code').getBoundingClientRect();if(a.top<b.top||a.bottom>b.bottom)$('code').scrollTop+=a.top-b.top-30;}
 if(step===frames.length-1)pause();else if(!timer)$('play').textContent='播放動畫';}
function load(){pause();try{let ops;try{ops=JSON.parse($('operations').value);}catch{throw new Error('請輸入 JSON，例如 [["insert","apple"],["search","app"]]。');}const nextFrames=trieTrace(ops);operations=ops;frames=nextFrames;step=0;layout(frames.at(-1).nodes);$('error').textContent='';render();}catch(error){$('error').textContent=error.message;}}
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
const examples={branch:[['insert','apple'],['insert','ape'],['search','app'],['startsWith','app'],['insert','app'],['search','app'],['search','bat']],classic:[['insert','apple'],['search','apple'],['search','app'],['startsWith','app'],['insert','app'],['search','app']],duplicate:[['insert','cat'],['insert','cat'],['insert','car'],['search','cat'],['startsWith','ca']],missing:[['search','a'],['startsWith','a'],['insert','a'],['search','a']]};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{$('operations').value=JSON.stringify(examples[button.dataset.example]);load();});load();
