const assert=require('node:assert/strict'),trace=require('./algorithm.js');let cases=0;
function check(a,h){const frames=trace(a,h);let expected=1;while(a.reduce((sum,v)=>sum+Math.ceil(v/expected),0)>h)expected++;assert.equal(frames.at(-1).ans,expected);
for(const f of frames){if(f.phase==='sum')assert.equal(f.hours,a.slice(0,f.index+1).reduce((sum,v)=>sum+Math.ceil(v/f.m),0));if(f.phase==='answer')assert(f.hours<=h);if(f.phase==='done')assert(f.l>f.r);}cases++;}
function enumerate(a,n){if(a.length===n){for(let h=n;h<=a.reduce((s,v)=>s+v,0)+1;h++)check(a,h);return;}for(let v=1;v<=4;v++)enumerate([...a,v],n);}
for(let n=1;n<=4;n++)enumerate([],n);check([3,6,7,11],8);check([30,11,23,4,20],5);check([1000000],1);
for(const args of [[[],1],[[0],1],[[1,2],1],[[1],1.5],[[1000001],1]])assert.throws(()=>trace(...args));
console.log(`PASS: ${cases} cases; exhaustive minimum speeds, per-pile hours, feasible answers, termination and invalid inputs.`);
