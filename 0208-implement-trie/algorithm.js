(function(root){
 function trace(operations){
  if(!Array.isArray(operations)||!operations.length||operations.length>16||operations.some(op=>!Array.isArray(op)||op.length!==2||!['insert','search','startsWith'].includes(op[0])||typeof op[1]!=='string'||!/^[a-z]{1,10}$/.test(op[1])))throw new Error('請輸入 1–16 筆操作：["insert"、"search" 或 "startsWith", "小寫單字"]；每個字串長度 1–10。');
  const nodes=[{id:0,parent:null,char:'',prefix:'',children:{},is_end:false}],frames=[],results=[];
  let node=0,operation=-1,path=[0];
  function add(phase,line,title,note,extra={}){frames.push({phase,line,title,note,node,operation,path:[...path],nodes:nodes.map(n=>({...n,children:{...n.children}})),results:[...results],...extra});}
  add('init',[8],'建立根節點','N0 是空前綴，不代表任何字母。每個節點的 children 起初為空，is_end 為 False。');
  operations.forEach(([method,word],op)=>{
   operation=op;node=0;path=[0];const insert=method==='insert',search=method==='search';
   const lines=insert?[11,12,13,14,15,16]:search?[19,20,21,22,23,24]:[27,28,29,30,31,32];
   add('start',[lines[0]],`${method}("${word}")`,'node 從根節點開始；沿字母邊逐步向下走。');
   for(let index=0;index<word.length;index++){
    const char=word[index],info={char,index};
    add('read',[lines[1]],`讀取字母 ${char}`,`位置 ${index}，目前 node = N${node}。`,info);
    const missing=nodes[node].children[char]===undefined;
    add('check',[lines[2]],missing?'沒有這條字母邊':'沿用已存在的節點',`N${node}.children ${missing?'不含':'包含'} ${char}。`,info);
    if(missing){
     if(!insert){results.push(false);add('return',[lines[3]],'查詢失敗，回傳 False',`找不到字母 ${char}，不建立任何節點。`,{...info,value:false});return;}
     const id=nodes.length;nodes.push({id,parent:node,char,prefix:nodes[node].prefix+char,children:{},is_end:false});nodes[node].children[char]=id;
     add('create',[lines[3]],`建立節點 N${id}`,`新增 ${char} 邊；N${id}.is_end = False。node 尚未移動。`,{...info,created:id});
    }
    node=nodes[node].children[char];path.push(node);add('move',[lines[4]],`node 移到 N${node}`,`目前路徑代表前綴 "${nodes[node].prefix}"。`,info);
   }
   if(insert){nodes[node].is_end=true;results.push(null);add('mark',[16],'標記完整單字',`N${node}.is_end = True；雙圈表示這裡是已插入單字的結尾。`,{value:null});}
   else{const value=search?nodes[node].is_end:true;results.push(value);add('return',[lines[5]],`回傳 ${value?'True':'False'}`,search?'search 必須檢查 is_end；路徑存在不代表完整單字已插入。':'startsWith 只要求路徑存在，不檢查 is_end。',{value});}
  });
  add('done',[],'所有操作完成','共用前綴共用節點；重複插入不會新增相同路徑。');return frames;
 }
 if(typeof module!=='undefined')module.exports=trace;else root.trieTrace=trace;
})(globalThis);
