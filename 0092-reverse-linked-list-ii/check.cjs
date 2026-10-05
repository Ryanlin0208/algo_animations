const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
for (let n = 1; n <= 12; n++) for (let left = 1; left <= n; left++) for (let right = left; right <= n; right++) {
  const nums = Array.from({length:n}, (_,i) => i % 3 - 1), frames = trace(nums,left,right);
  const ids = Array.from({length:n},(_,i)=>i+1), expected = [...ids.slice(0,left-1),...ids.slice(left-1,right).reverse(),...ids.slice(right)];
  const actual = [], next = frames.at(-1).next;
  for (let id = next[0]; id !== null; id = next[id]) { assert(!actual.includes(id), 'no cycle'); actual.push(id); }
  assert.deepEqual(actual, expected);
  for (let j = 1; j < frames.length; j++) {
    const f = frames[j], before = frames[j-1];
    const changed = f.next.flatMap((to,id) => to !== before.next[id] ? [id] : []);
    assert(changed.length <= 1);
    if (changed.length) assert.equal(changed[0], f.changed);
    if (f.phase === 'reverse') { assert.equal(f.next[f.cur], f.prev); assert.equal(f.tmp, before.next[f.cur]); }
    if (f.phase === 'tail') assert.equal(f.next[left], right === n ? null : right + 1);
  }
  cases++;
}
for (const args of [[[],1,1],[[1],0,1],[[1],1,2],[[1,2],2,1],[[1.5],1,1]]) assert.throws(()=>trace(...args));
console.log(`PASS: ${cases} ranges; node identities, pointer rewrites, reconnect order, no cycles and invalid inputs.`);
