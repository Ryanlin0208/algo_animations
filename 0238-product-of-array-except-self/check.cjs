const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
const product = a => a.reduce((p, n) => p * BigInt(n), 1n);
function check(nums) {
  const frames = trace(nums);
  assert.deepEqual(frames.at(-1).arr, nums.map((_, i) => product(nums.filter((_, j) => j !== i))));
  for (const f of frames.filter(f => f.phase === 'write')) {
    if (f.pass === 'left') {
      assert.equal(f.prefix, product(nums.slice(0, f.i)));
      assert.equal(f.arr[f.i], f.prefix);
    } else {
      assert.equal(f.postfix, product(nums.slice(f.i + 1)));
      assert.equal(f.arr[f.i], product(nums.filter((_, j) => j !== f.i)));
    }
  }
  cases++;
}
function enumerate(a, n) {
  if (a.length === n) return check(a);
  for (const v of [-2,-1,0,1,2]) enumerate([...a,v],n);
}
for (let n = 2; n <= 5; n++) enumerate([],n);
check(Array(20).fill(30));
for (const nums of [[],[1],[1,1.5],[1,31],Array(21).fill(1)]) assert.throws(() => trace(nums));
console.log(`PASS: ${cases} cases; zeros, negatives, exact large products and both pass invariants.`);
