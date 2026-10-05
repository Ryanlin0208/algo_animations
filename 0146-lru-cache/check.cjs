const assert=require('node:assert/strict');
const trace=require('./algorithm.js');
let cases=0;
function check(capacity,ops){
 const frames=trace(capacity,ops), reference=new Map(), outputs=[];
 for(const f of frames.filter(f=>f.phase==='return')){
  const [type,key,value]=ops[f.operation];
  if(type==='get'){
   if(!reference.has(key))outputs.push(-1);
   else{const v=reference.get(key);reference.delete(key);reference.set(key,v);outputs.push(v);}
  }else{reference.delete(key);reference.set(key,value);if(reference.size>capacity)reference.delete(reference.keys().next().value);outputs.push(null);}
  assert.deepEqual(f.results,outputs);
  const seen=new Set(), actual=[];let prev='L',id=f.nodes.L.next;
  while(id!=='R'){
   assert(id!==null&&!seen.has(id));seen.add(id);const n=f.nodes[id];assert.equal(n.prev,prev);assert.equal(new Map(f.cache).get(n.key),id);actual.push([n.key,n.val]);prev=id;id=n.next;
  }
  assert.equal(f.nodes.R.prev,prev);assert.deepEqual(actual,[...reference]);assert.equal(f.cache.length,reference.size);
 }
 for(let i=1;i<frames.length;i++){
  const f=frames[i], before=frames[i-1];
  for(const [id,n] of Object.entries(before.nodes))for(const field of ['prev','next'])if(n[field]!==f.nodes[id][field])assert.equal(f.changed,`${id}.${field}`);
 }
 cases++;
}
const choices=[['get',1],['get',2],['put',1,10],['put',1,99],['put',2,20],['put',3,30]];
function enumerate(ops,n){if(ops.length===n){for(const capacity of [1,2,3])check(capacity,ops);return;}for(const op of choices)enumerate([...ops,op],n);}
enumerate([],4);
for(const args of [[0,[['get',1]]],[2,[]],[2,[['put',1]]],[2,[['bad',1]]],[2,[['get',1.2]]]])assert.throws(()=>trace(...args));
console.log(`PASS: ${cases} sequences; reference LRU order, outputs, bidirectional links, capacity, updates and invalid input.`);
