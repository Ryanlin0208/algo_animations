(function(root){
 function trace(piles,h){
  if(!Array.isArray(piles)||!piles.length||piles.length>20||piles.some(v=>!Number.isInteger(v)||v<1||v>1000000)||!Number.isInteger(h)||h<piles.length||h>1000000000)throw new Error('請輸入 1–20 堆、每堆 1–1,000,000 根香蕉；h 須為堆數至 1,000,000,000 的整數。');
  let l=1,r=Math.max(...piles),ans=r,m,hours,costs=[],round=0;const frames=[];
  function add(phase,line,title,note,extra={}){frames.push({phase,line,title,note,l,r,ans,m,hours,round,costs:[...costs],...extra});}
  add('init',[3,4],'設定速度搜尋範圍',`l = 1，r = ${r}，ans = ${ans}。每小时最多吃最大一堆的量，一定可在 h 小時內完成。`);
  while(l<=r){
   round++;add('loop',[5],'搜尋範圍仍非空',`${l} ≤ ${r}，進入第 ${round} 輪。`);
   m=Math.floor((l+r)/2);add('mid',[6],'選擇中間速度',`m = (${l} + ${r}) // 2 = ${m} 根／小時。`);
   hours=0;costs=[];add('reset',[7],'總時間歸零','用這個速度重新計算每一堆所需時間。');
   piles.forEach((v,index)=>{
    add('pile',[9],`查看第 ${index+1} 堆`, `i = ${v} 根香蕉。`,{index});
    const cost=Math.floor((v+m-1)/m),before=hours;costs.push(cost);hours+=cost;
    add('sum',[10],`這堆需要 ${cost} 小時`,`(${v} + ${m} − 1) // ${m} = ${cost}；hours = ${before} + ${cost} = ${hours}。`,{index});
   });
   const feasible=hours<=h;add('compare',[12],feasible?'時間足夠，可以嘗試更慢':'時間不夠，必須吃更快',`${hours} ≤ ${h} 為 ${feasible?'True':'False'}。`);
   if(feasible){ans=Math.min(ans,m);add('answer',[13],'保存目前最小可行速度',`ans = min(ans, ${m}) = ${ans}。`);r=m-1;add('update',[14],'縮小右邊界',`r = ${m} − 1 = ${r}，接著搜尋更小的速度。`);}
   else{l=m+1;add('update',[15,16],'提高左邊界',`l = ${m} + 1 = ${l}，排除目前速度與更慢的速度。`);}
  }
  add('stop',[5],'搜尋範圍已空',`l = ${l} > r = ${r}，離開 while。`);
  add('done',[18],`最小速度為 ${ans} 根／小時`,'回傳先前保存的 ans；最後一次測試的 m 不一定是答案。');return frames;
 }
 if(typeof module!=='undefined')module.exports=trace;else root.kokoTrace=trace;
})(globalThis);
