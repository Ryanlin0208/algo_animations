(function(root){
 function trace(temperatures){
  if(!Array.isArray(temperatures)||temperatures.length<1||temperatures.length>30||temperatures.some(t=>!Number.isInteger(t)||t<30||t>100))throw new Error('動畫支援 1–30 天，溫度須為 30–100 的整數。');
  const n=temperatures.length,ans=Array(n).fill(0),stk=[],frames=[];let idx;
  function add(phase,line,title,note,extra={}){frames.push({phase,line,title,note,idx,ans:[...ans],stk:[...stk],...extra});}
  add('init',[3,4,5],'初始化答案與堆疊',`n = ${n}，ans 全為 0，stk 為空。`);
  for(let i=0;i<n;i++){
   add('visit',[7],`來到第 ${i} 天`, `今天溫度 ${temperatures[i]}，先檢查等待中的日子。`,{i});
   while(true){
    const top=stk.at(-1),warmer=top!==undefined&&temperatures[i]>temperatures[top];
    const condition=top===undefined?'stk 為空 → False（短路，不讀取 stk[-1]）':`${temperatures[i]} > ${temperatures[top]} → ${warmer?'True':'False'}`;
    add('compare',[8],warmer?'今天更暖，可以結束等待':top===undefined?'堆疊為空，結束 while':'今天沒有更暖，結束 while',top===undefined?'空堆疊不執行溫度比較。':`比較今天與堆疊頂端索引 ${top}；必須嚴格大於，相等不算。`,{i,condition});
    if(!warmer)break;
    idx=stk.pop();add('pop',[9],`彈出索引 ${idx}`,'idx 已取得，下一步才寫入等待天數。',{i,condition});
    ans[idx]=i-idx;add('write',[10],`第 ${idx} 天等了 ${ans[idx]} 天`,`ans[${idx}] = ${i} − ${idx} = ${ans[idx]}。繼續檢查下一個堆疊頂端。`,{i,condition});
   }
   stk.push(i);add('push',[12],`今天的索引 ${i} 入堆疊`,'今天也需要等待未來更暖的一天。堆疊由底到頂的溫度維持非遞增。',{i});
  }
  add('done',[14],'所有天數處理完成','仍留在堆疊的日子，未來都沒有更暖的溫度，因此答案維持 0。');return frames;
 }
 if(typeof module!=='undefined')module.exports=trace;else root.temperatureTrace=trace;
})(globalThis);
