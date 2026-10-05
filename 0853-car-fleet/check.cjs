const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
const cases = [[12,[10,8,0,5,3],[2,4,1,1,3],3], [10,[8,4],[1,3],1], [12,[9,6,3],[1,1,1],3], [10,[6,4,2],[1,2,4],1], [10,[0],[1],1], [100,[0,2,4],[4,2,1],1]];
for (const [target, p, s, expected] of cases) {
  const frames = trace(target, p, s);
  assert.equal(frames.at(-1).fleets, expected);
  assert.equal(new Set(Object.values(frames.at(-1).groups)).size, expected);
  for (let i = 1; i < frames.length; i++) {
    assert(frames[i].previous >= frames[i-1].previous);
    if (frames[i].phase === 'merge') {
      assert.equal(frames[i].fleets, frames[i-1].fleets);
      assert.equal(frames[i].previous, frames[i-1].previous);
    }
  }
}
assert.deepEqual(trace(12,[10,8,0,5,3],[2,4,1,1,3]).at(-1).groups, {1:1,2:1,3:3,4:2,5:2});
for (const args of [[10,[],[]],[10,[1,1],[2,3]],[10,[10],[1]],[10,[1],[0]],[10,[1,2],[1]],[0,[0],[1]],[10,[1.5],[1]]]) assert.throws(() => trace(...args));
console.log('PASS: fleet counts, membership, equal arrival, chain merges, single car, trace invariants and invalid inputs.');
