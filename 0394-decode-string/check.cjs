const assert=require('node:assert/strict'),trace=require('./algorithm.js');
let cases=0;
function check(s,expected){
 const frames=trace(s);assert.equal(frames.at(-1).current_string,expected);assert.deepEqual(frames.at(-1).stack,[]);
 for(let i=1;i<frames.length;i++){
  const f=frames[i],p=frames[i-1];
  if(f.phase==='push')assert.deepEqual(f.stack,[...p.stack,[p.current_string,p.current_number]]);
  if(f.phase==='pop'){assert.deepEqual([f.previous_string,f.repeat],p.stack.at(-1));assert.equal(f.current_string,p.current_string);assert.equal(f.stack.length,p.stack.length-1);}
  if(f.phase==='expand')assert.equal(f.current_string,f.previous_string+f.inner.repeat(f.repeat));
 }
 cases++;
}
for(const [s,out] of [['3[a2[c]]','accaccacc'],['2[abc]3[cd]ef','abcabccdcdcdef'],['12[a]','a'.repeat(12)],['abcXYZ','abcXYZ'],['2[a]3[b]','aabbb'],['2[3[a]b]','aaabaaab']])check(s,out);
for(const a of ['a','bc'])for(const b of ['x','yz'])for(let m=1;m<=5;m++)for(let n=1;n<=5;n++){
 check(`${m}[${a}${n}[${b}]]z`,(a+b.repeat(n)).repeat(m)+'z');
 check(`${a}${m}[${b}]${n}[${a}]`,a+b.repeat(m)+a.repeat(n));
}
for(const s of ['', '[a]', '2[a', '2[a]]', '2a', '0[a]', '301[a]', '2[]','a b','2[a]3','300[300[a]]'])assert.throws(()=>trace(s));
console.log(`PASS: ${cases} valid cases; nested expansion, multi-digit counts, push/pop snapshots and malformed/oversized input.`);
