const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
function check(nums) {
  for (let k = -3; k <= 3; k++) {
    const expected = [];
    for (let start = 0; start < nums.length; start++) {
      let sum = 0;
      for (let end = start; end < nums.length; end++) {
        sum += nums[end]; if (sum === k) expected.push(`${start}:${end}`);
      }
    }
    const frames = trace(nums, k);
    assert.equal(frames.at(-1).ans, expected.length);
    const matches = frames.filter(f => f.phase === 'lookup').flatMap(f => f.starts.map(s => `${s}:${f.index}`));
    assert.deepEqual(matches.sort(), expected.sort());
    for (const f of frames.filter(f => f.phase === 'lookup')) {
      assert.equal(f.hits, f.starts.length);
      assert.equal(f.counts.reduce((sum, [, count]) => sum + count, 0), f.index + 1);
    }
    cases++;
  }
}
function enumerate(nums, n) {
  if (nums.length === n) return check(nums);
  for (const x of [-1, 0, 1]) enumerate([...nums, x], n);
}
for (let n = 1; n <= 6; n++) enumerate([], n);
assert.equal(trace([0,0,0], 0).at(-1).ans, 6);
assert.equal(trace([1,1,1], 2).at(-1).ans, 2);
for (const [nums,k] of [[[],0], [[1.5],0], [[1],NaN], [Array(31).fill(0),0]]) assert.throws(() => trace(nums,k));
console.log(`PASS: ${cases} exhaustive cases, matching ranges, lookup-before-update, zeros, negatives and invalid inputs.`);
