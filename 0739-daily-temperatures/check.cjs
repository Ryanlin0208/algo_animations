const assert=require('node:assert/strict'),trace=require('./algorithm.js');let cases=0;
function check(a){const f=trace(a),expected=a.map((v,i)=>{for(let j=i+1;j<a.length;j++)if(a[j]>v)return j-i;return 0;});assert.deepEqual(f.at(-1).ans,expected);
 for(let j=1;j<f.length;j++){const x=f[j],p=f[j-1];if(x.phase==='pop'){assert.equal(x.idx,p.stk.at(-1));assert.deepEqual(x.ans,p.ans);assert(a[x.i]>a[x.idx]);}if(x.phase==='push'){for(let k=1;k<x.stk.length;k++)assert(a[x.stk[k-1]]>=a[x.stk[k]]);}if(x.phase==='write')assert.equal(x.ans[x.idx],x.i-x.idx);}cases++;}
function enumerate(a,n){if(a.length===n)return check(a);for(const t of [30,31,32])enumerate([...a,t],n);}
for(let n=1;n<=7;n++)enumerate([],n);check([73,74,75,71,69,72,76,73]);check([100]);
for(const a of [[],[29],[101],[30.5],Array(31).fill(30)])assert.throws(()=>trace(a));
console.log(`PASS: ${cases} cases; brute-force answers, equal temperatures, monotonic stack, pop/write order and invalid inputs.`);
