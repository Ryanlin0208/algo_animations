const assert=require('node:assert/strict'),trace=require('./algorithm.js');let cases=0;
function check(ops){const f=trace(ops),words=new Set(),expected=[];for(const [method,word] of ops){if(method==='insert'){words.add(word);expected.push(null);}else expected.push(method==='search'?words.has(word):[...words].some(w=>w.startsWith(word)));}assert.deepEqual(f.at(-1).results,expected);
 const prefixes=new Set(['']);for(const w of words)for(let i=1;i<=w.length;i++)prefixes.add(w.slice(0,i));assert.equal(f.at(-1).nodes.length,prefixes.size);
 for(const frame of f){assert.equal(frame.path.at(-1),frame.node);for(const n of frame.nodes){assert.equal(n.id,frame.nodes.indexOf(n));for(const [char,id] of Object.entries(n.children)){assert.equal(frame.nodes[id].parent,n.id);assert.equal(frame.nodes[id].prefix,n.prefix+char);}}}
 cases++;}
const choices=[['insert','a'],['insert','ab'],['insert','ac'],['search','a'],['search','ab'],['startsWith','a'],['startsWith','b']];
function enumerate(ops,n){if(ops.length===n)return check(ops);for(const op of choices)enumerate([...ops,op],n);}enumerate([],4);
check([['insert','apple'],['insert','ape'],['search','app'],['startsWith','app'],['insert','app'],['search','app']]);
for(const ops of [[],[['insert','']],[['delete','a']],[['insert','A']],Array(17).fill(['search','a'])])assert.throws(()=>trace(ops));
console.log(`PASS: ${cases} sequences; set-based search/prefix oracle, shared nodes, paths and invalid inputs.`);
