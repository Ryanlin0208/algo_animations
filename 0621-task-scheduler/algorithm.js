(function(root){function trace(tasks,n){
 if(!Array.isArray(tasks)||!tasks.length||tasks.length>30||tasks.some(c=>typeof c!=='string'||!/^[A-Z]$/.test(c))||!Number.isInteger(n)||n<0||n>10)throw new Error('支援 1–30 個 A–Z 任務，冷卻 n 須為 0–10 的整數。');
 const count=new Map();for(const c of tasks)count.set(c,(count.get(c)||0)+1);
 const heap=[...count.values()].map(v=>-v),frames=[],rounds=[];let time=0,temp=[],used=0,freq,round=0;
 function add(phase,line,title,note,extra={}){frames.push({phase,line,title,note,heap:[...heap],temp:[...temp],used,freq,round,time,rounds:rounds.map(r=>({...r})),...extra});}
 add('count',[6],'計算各任務的負頻率','原始程式只儲存頻率，不儲存任務名稱。');heap.sort((a,b)=>a-b);add('heapify',[7,8],'建立最小堆積並初始化時間','負值越小，代表剩餘次數越多。圖中依取出優先序排列。');
 while(heap.length){round++;add('loop',[10],`開始第 ${round} 輪`,'每輪最多處理 n + 1 種任務。');temp=[];add('reset',[11],'清空本輪暫存','上一輪剩餘任務已放回 heap。');used=0;add('reset',[12],'本輪使用時槽歸零','used = 0。');
 for(let slot=0;slot<n+1;slot++){
  add('slot',[14],`本輪時槽 ${slot+1} / ${n+1}`,'準備檢查是否還有任務可取。',{slot});add('check',[15],heap.length?'heap 非空':'heap 已空',heap.length?'繼續取出頻率最高的任務。':'同輪已執行任務扣在 temp 中，不能再取。',{slot});
  if(!heap.length){add('break',[16],'提前結束本輪 for','是否補 idle，要等 temp 放回後再判斷。',{slot});break;}
  freq=heap.shift();add('pop',[18],'取出最高剩餘頻率',`freq = ${freq}。`,{slot});used++;add('used',[19],'記錄一個工作時槽',`used = ${used}；time 尚未更新。`,{slot});freq++;add('decrement',[20],'剩餘次數減一',`freq = ${freq}。`,{slot});add('remaining',[22],freq<0?'這種任務還沒完成':'這種任務已完成',`freq < 0 為 ${freq<0?'True':'False'}。`,{slot});if(freq<0){temp.push(freq);add('hold',[23],'暫存剩餘頻率','本輪不再使用這種任務，下一輪才可重新取出。',{slot});}
 }
 for(const v of temp){freq=v;add('restore-loop',[25],'讀取暫存頻率',`freq = ${freq}。temp 本身不會被 pop。`);heap.push(freq);heap.sort((a,b)=>a-b);add('restore',[26],'放回 heap','此值已重新加入 heap；temp 仍保留原值直到下一輪清空。');}
 add('decide',[28],heap.length?'還有任務，計入完整一輪':'全部完成，只計實際工作時間',heap.length?`本輪計入 ${n+1} 個時槽，包含 ${n+1-used} 個 idle。`:'最後一輪不需要尾端冷卻。');
 const duration=heap.length?n+1:used,idle=duration-used;time+=duration;rounds.push({used,idle,duration});add('time',heap.length?[29]:[30,31],`time 更新為 ${time}`,`本輪工作 ${used}，idle ${idle}，增加 ${duration}。`);
 }
 add('done',[33],`最短時間為 ${time}`,'回傳 time；工作時槽代表一次任務執行，不指定字母排程。',{result:time});return frames;
}if(typeof module!=='undefined')module.exports=trace;else root.schedulerTrace=trace;})(globalThis);
