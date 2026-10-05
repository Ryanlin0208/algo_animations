/* Actual pointer writes are captured separately, including transient asymmetric links. */
(function(root) {
  function trace(capacity, operations) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 6 || !Array.isArray(operations) || !operations.length || operations.length > 20 || operations.some(op => !Array.isArray(op) || !['get','put'].includes(op[0]) || op.length !== (op[0] === 'get' ? 2 : 3) || op.slice(1).some(v => !Number.isInteger(v) || Math.abs(v) > 999)))
      throw new Error('容量須為 1–6；操作為 1–20 筆 ["get", key] 或 ["put", key, value]，整數介於 ±999。');
    const nodes = { L: {key:0,val:0,prev:null,next:null}, R: {key:0,val:0,prev:null,next:null} }, cache = new Map(), frames = [], results = [];
    let serial = 0, operation = -1, locals = {};
    function add(phase,line,title,note,changed) {
      frames.push({phase,line,title,note,changed,operation,locals:{...locals},nodes:Object.fromEntries(Object.entries(nodes).map(([id,n])=>[id,{...n}])),cache:[...cache],results:[...results]});
    }
    add('init',[12,13,17,18],'建立容量、雜湊表與兩個哨兵','L 與 R 不儲存有效快取項目；先建立節點，再連接。');
    nodes.L.next='R'; add('link',[20],'連接 left.next','left.next 指向 right。','L.next');
    nodes.R.prev='L'; add('link',[21],'連接 right.prev','空串列：L ⇄ R。','R.prev');
    function remove(id, callLine) {
      locals={node:id}; add('remove',[callLine],'呼叫 remove(node)','把節點從串列摘下；此函式不刪除 cache 項目。');
      const prev=nodes[id].prev,nxt=nodes[id].next;
      locals.prev=prev; add('remove',[24],'保存前一個節點',`prev = ${prev}`);
      locals.nxt=nxt; add('remove',[25],'保存後一個節點',`nxt = ${nxt}`);
      nodes[prev].next=nxt; add('link',[27],'前節點跨過 node','prev.next = nxt；中途兩向連結可能尚未對稱。',`${prev}.next`);
      nodes[nxt].prev=prev; add('link',[28],'後節點接回 prev','nxt.prev = prev。被摘下節點本身的 prev、next 仍保留舊值。',`${nxt}.prev`);
    }
    function insert(id, callLine) {
      locals={node:id}; add('insert',[callLine],'呼叫 insert(node)','插入 right 前方，成為最近使用的項目。');
      const prev=nodes.R.prev,nxt='R';
      locals.prev=prev; add('insert',[31],'取得原本的 MRU',`prev = ${prev}`);
      locals.nxt=nxt; add('insert',[32],'nxt 指向 right','nxt = R');
      for (const [owner,field,to,line] of [[prev,'next',id,34],[nxt,'prev',id,35],[id,'prev',prev,37],[id,'next',nxt,38]]) {
        nodes[owner][field]=to; add('link',[line],'逐條建立雙向連結',`${owner}.${field} = ${to}`,`${owner}.${field}`);
      }
    }
    operations.forEach((op,index)=>{
      operation=index;locals={}; const [type,key,value]=op;
      add('operation',[type==='get'?40:52],`操作 ${index+1}：${type}(${op.slice(1).join(', ')})`,'先由雜湊表查找 key。');
      if(type==='get') {
        add('lookup',[41],cache.has(key)?'命中快取':'快取未命中',`key ${key} ${cache.has(key)?'存在':'不存在'}於 cache。`);
        if(!cache.has(key)) {results.push(-1);add('return',[42],'回傳 −1','未命中不改變使用順序。');return;}
        const id=cache.get(key); locals={node:id};add('lookup',[44],'取得節點',`cache[${key}] → ${id}`);
        remove(id,47);insert(id,48);results.push(nodes[id].val);add('return',[50],`回傳 ${nodes[id].val}`,'命中項目已移至 MRU。');
      } else {
        add('lookup',[53],cache.has(key)?'key 已存在，先摘下舊節點':'key 不存在，新增項目','依提供的程式，更新 key 時會建立新 Node，而非修改原節點。');
        if(cache.has(key)) remove(cache.get(key),54);
        const id=`N${++serial}`;nodes[id]={key,val:value,prev:null,next:null};locals={node:id};add('create',[56],'建立新的 Node',`${id}：key=${key}, value=${value}`);
        cache.set(key,id);add('cache',[57],'更新雜湊表',`cache[${key}] = ${id}。此刻新節點尚未插入串列。`);
        insert(id,58);
        add('capacity',[60],cache.size>capacity?'容量超限，準備淘汰':'容量未超限',`${cache.size} > ${capacity} 為 ${cache.size>capacity?'True':'False'}。`);
        if(cache.size>capacity) {
          const lru=nodes.L.next;locals={lru};add('evict',[61],'取得最久未使用的節點',`left.next = ${lru}，key=${nodes[lru].key}`);
          remove(lru,63);cache.delete(nodes[lru].key);add('cache',[64],'從 cache 刪除 LRU',`del cache[${nodes[lru].key}]；串列與雜湊表皆移除該項目。`);
        }
        results.push(null);add('return',[52],'put 完成','put 沒有回傳值（None）。');
      }
    });
    locals={};add('done',[],'所有操作完成','輸出依操作順序排列；null 代表 put 回傳 None。');return frames;
  }
  if(typeof module!=='undefined')module.exports=trace;else root.lruTrace=trace;
})(globalThis);
