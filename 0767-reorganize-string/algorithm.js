(function(root){function trace(s){
 if(typeof s!=='string'||!/^[a-z]{1,30}$/.test(s))throw new Error('請輸入 1–30 個小寫英文字母。');
 const counts=new Map();for(const c of s)counts.set(c,(counts.get(c)||0)+1);
 const heap=[],frames=[],ans=[];let prev_count=0,prev_char='',freq,char;
 const compare=(a,b)=>a[0]-b[0]||(a[1]<b[1]?-1:a[1]>b[1]?1:0);
 function push(pair){heap.push(pair);let i=heap.length-1;while(i){const p=(i-1)>>1;if(compare(heap[p],heap[i])<=0)break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}}
 function pop(){const first=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&compare(heap[child+1],heap[child])<0)child++;if(compare(heap[i],heap[child])<=0)break;[heap[i],heap[child]]=[heap[child],heap[i]];i=child;}}return first;}
 function add(phase,line,title,note,extra={}){frames.push({phase,line,title,note,counts:[...counts],heap:heap.map(x=>[...x]),ans:[...ans],prev_count,prev_char,freq,char,...extra});}
 add('count',[6,7],'計算字元次數，建立空堆積','Counter 保留各字元第一次出現的順序。');
 for(const [c,n] of counts){push([-n,c]);add('build',[9,10],`加入 ${c}，共 ${n} 次`,`儲存 (${-n}, "${c}")；負數越小，實際頻率越高。`);}
 add('init',[12,13,14],'初始化輸出與暫存字元','ans = []，prev_count = 0，prev_char = ""。');
 while(heap.length){add('loop',[16],'堆積非空，開始下一輪','上一輪使用的字元尚未放回，這次不會再次取到它。');[freq,char]=pop();add('pop',[17],`取出 ${char}`,`freq = ${freq}。同頻率時依字母順序取出。`);ans.push(char);add('append',[19],'字元加入答案',`ans.append("${char}")，此步尚未扣除剩餘次數。`);freq++;add('decrement',[20],'使用一次，負頻率加 1',`freq = ${freq}，此字元剩餘 ${-freq} 次。`);
 add('check',[23],prev_count<0?'上一輪字元還有剩餘':'上一輪字元無剩餘',`prev_count < 0 為 ${prev_count<0?'True':'False'}。`);
 if(prev_count<0){push([prev_count,prev_char]);add('release',[24],`放回上一輪字元 ${prev_char}`,'放回發生在本輪取出之後；暫存變數接著才會被覆寫。');}
 prev_count=freq;add('hold-count',[27],'保存目前字元的剩餘次數',`prev_count = ${freq}；下一步更新 prev_char。`);prev_char=char;add('hold-char',[28],`暫扣 ${char}`,'直到下一輪已取出別的字元後，才可能把它放回。');
 }
 add('stop',[16],'堆積已空','沒有可取出的其他字元；檢查是否已使用全部字元。');
 const ok=ans.length===s.length;add('length',[30],ok?'答案長度符合輸入':'仍有字元無法排入',`${ans.length} != ${s.length} 為 ${!ok?'True':'False'}。`);
 add('done',ok?[33]:[31],ok?'重組完成':'無法避免相鄰重複',ok?'回傳 ans 串接結果。':'暫扣字元仍有剩餘，但沒有其他字元可以隔開，回傳空字串。',{result:ok?ans.join(''):''});return frames;
}if(typeof module!=='undefined')module.exports=trace;else root.reorganizeTrace=trace;})(globalThis);
