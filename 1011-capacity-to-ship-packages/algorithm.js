(function(root){function trace(weights,days){
 if(!Array.isArray(weights)||!weights.length||weights.length>20||weights.some(v=>!Number.isInteger(v)||v<1||v>100)||!Number.isInteger(days)||days<1||days>weights.length)throw new Error('支援 1–20 件、每件 1–100，days 須為 1 至件數的整數。');
 let left=Math.max(...weights),right=weights.reduce((a,b)=>a+b,0),ans=right,mid,days_needed,current,simCapacity,loads=[],loaded=0;const frames=[];
 function add(phase,line,title,note,extra={}){frames.push({phase,line,title,note,left,right,ans,mid,days_needed,current,simCapacity,loaded,loads:loads.map(a=>[...a]),...extra});}
 add('init',[3,4],'設定載重搜尋範圍',`最小 ${left}，最大 ${right}。ans 先設為能一天送完的載重。`);
 while(left<=right){add('loop',[5],'範圍非空，繼續搜尋',`${left} ≤ ${right}。`);mid=Math.floor((left+right)/2);add('mid',[6],'測試中間載重',`mid = (${left} + ${right}) // 2 = ${mid}。圖表仍保留上一輪，接著重新模擬。`);
 days_needed=1;add('reset',[8],'從第一天開始','days_needed = 1。');current=0;loads=[[]];loaded=0;simCapacity=mid;add('reset',[9],'船上重量歸零','current = 0，開始本輪裝載。');
 weights.forEach((weight,index)=>{add('visit',[10],`讀取第 ${index+1} 件`, `weight = ${weight}。`,{index});const exceeds=current+weight>mid;add('compare-load',[11],exceeds?'下一件會超重':'下一件裝得下',`${current} + ${weight} > ${mid} 為 ${exceeds?'True':'False'}。`,{index});if(exceeds){days_needed++;add('next-day',[12],'增加運送天數',`days_needed = ${days_needed}；下一步清空 current。`,{index});current=0;loads.push([]);add('empty',[13],'新的一天，清空重量','current = 0，包裹尚未裝入。',{index});}current+=weight;loads.at(-1).push(weight);loaded++;add('load',[15],'裝入目前包裹',`current = ${current}，不改變包裹順序。`,{index});});
 add('feasible',[17],days_needed<=days?'天數足夠，嘗試更小載重':'天數超限，需要更大載重',`${days_needed} ≤ ${days} 為 ${days_needed<=days?'True':'False'}。`);
 if(days_needed<=days){ans=mid;add('answer',[18],'保存可行載重',`ans = ${ans}。`);right=mid-1;add('update',[19],'向較小載重搜尋',`right = ${right}。`);}else{left=mid+1;add('update',[20,21],'提高最低載重',`left = ${left}。`);}}
 add('stop',[5],'搜尋範圍已空',`${left} > ${right}，結束 while。`);add('done',[23],`最小載重為 ${ans}`,'回傳 ans。圖中保留最後一次模擬，其 mid 不一定等於答案。');return frames;}
 if(typeof module!=='undefined')module.exports=trace;else root.shipTrace=trace;})(globalThis);
