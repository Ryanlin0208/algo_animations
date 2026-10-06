const assert=require('node:assert/strict'),trace=require('./algorithm.js');let count=0;
// Independent partition enumeration: find minimum largest group sum for <= days groups.
function check(a,d){let expected=Infinity;for(let mask=0;mask<(1<<(a.length-1));mask++){let groups=1,sum=0,max=0;for(let i=0;i<a.length;i++){sum+=a[i];if(i===a.length-1||(mask&(1<<i))){max=Math.max(max,sum);sum=0;if(i<a.length-1)groups++;}}if(groups<=d)expected=Math.min(expected,max);}
const frames=trace(a,d);assert.equal(frames.at(-1).ans,expected);for(const f of frames.filter(f=>f.phase==='load')){assert.deepEqual(f.loads.flat(),a.slice(0,f.loaded));assert(f.loads.every(g=>g.reduce((x,y)=>x+y,0)<=f.mid));assert.equal(f.current,f.loads.at(-1).reduce((x,y)=>x+y,0));assert.equal(f.days_needed,f.loads.length);}count++;}
function enumerate(a,n){if(a.length===n){for(let d=1;d<=n;d++)check(a,d);return;}for(const v of [1,2,3])enumerate([...a,v],n);}
for(let n=1;n<=5;n++)enumerate([],n);for(const args of [[[],1],[[0],1],[[1],0],[[1],2]])assert.throws(()=>trace(...args));console.log(`PASS: ${count} cases against all contiguous partitions; loading order, capacity and day totals.`);
