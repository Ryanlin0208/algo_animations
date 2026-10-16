const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Brute force: try every +/- sign assignment.
function brute(nums, target) {
  let ways = 0;
  for (let mask = 0; mask < 1 << nums.length; mask++) {
    let sum = 0;
    nums.forEach((n, i) => (sum += mask & (1 << i) ? n : -n));
    if (sum === target) ways++;
  }
  return ways;
}
function check(nums, target) {
  const frames = trace(nums, target);
  assert.equal(frames.at(-1).answer, brute(nums, target));
  let previous;
  for (const f of frames) {
    if (f.phase === 'pick') previous = f.dp;
    if (f.phase !== 'update') continue;
    assert.equal(f.dp[f.s], f.before + f.gain);
    // Reverse scan: dp[s - x] still holds last round's value.
    assert.equal(f.gain, previous[f.from]);
  }
  cases++;
}
function enumerate(a, n) {
  if (a.length === n) {
    const total = a.reduce((x, y) => x + y, 0);
    for (let t = -total - 2; t <= total + 2; t++) check(a, t);
    return;
  }
  for (const v of [0, 1, 2, 3]) enumerate([...a, v], n);
}
for (let n = 1; n <= 6; n++) enumerate([], n);
assert.equal(trace([1, 1, 1, 1, 1], 3).at(-1).answer, 5);
assert.equal(trace([1], 1).at(-1).answer, 1);
assert.equal(trace([0, 0, 1], 1).at(-1).answer, 4);
check([20, 20, 20, 20, 20, 20, 20, 20], 0);
for (const [n, t] of [
  [[], 0],
  [[1.5], 0],
  [[-1], 1],
  [[21], 1],
  [Array(9).fill(1), 1],
  [[1], 0.5],
  [[1], 161],
]) {
  assert.throws(() => trace(n, t));
}
console.log(
  `PASS: ${cases} cases match brute-force sign enumeration; every update adds the old dp[s − x].`,
);
