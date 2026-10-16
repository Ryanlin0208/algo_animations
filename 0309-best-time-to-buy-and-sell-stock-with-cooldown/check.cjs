const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Brute force over every action sequence: hold, buy, sell, forced cooldown.
function brute(prices) {
  function go(i, holding, cooling) {
    if (i >= prices.length) return 0;
    let best = go(i + 1, holding, false);
    if (holding) best = Math.max(best, prices[i] + go(i + 2, false, false));
    else if (!cooling) best = Math.max(best, -prices[i] + go(i + 1, true));
    return best;
  }
  return go(0, false, false);
}
function check(prices) {
  const frames = trace(prices);
  const last = frames.at(-1);
  assert.equal(last.answer, brute(prices));
  assert.equal(last.sell.length, prices.length);
  for (let i = 0; i < prices.length; i++) {
    assert.ok(last.buy[i] <= last.rest[i], 'buy never beats rest');
    assert.ok(last.rest[i] <= last.sell[i], 'sell covers rest');
  }
  for (const f of frames.filter((f) => f.candidates)) {
    const max = Math.max(...f.candidates.map((c) => c.value));
    assert.equal(f[f.target][f.i], max);
    assert.equal(f.candidates[f.winner].value, max);
    if (f.target === 'rest') assert.notEqual(f.winner, 1);
  }
  cases++;
}
function enumerate(a, n) {
  if (a.length === n) return check(a);
  for (const v of [0, 1, 2, 3, 4]) enumerate([...a, v], n);
}
for (let n = 1; n <= 7; n++) enumerate([], n);
assert.equal(trace([1, 2, 3, 0, 2]).at(-1).answer, 3);
assert.equal(trace([1]).at(-1).answer, 0);
assert.equal(trace([1, 2, 4, 1, 5]).at(-1).answer, 5);
check(Array.from({length: 15}, (_, i) => (i * 389) % 1001));
for (const p of [[], [1.5], [-1], [1001], Array(16).fill(1)]) {
  assert.throws(() => trace(p));
}
console.log(
  `PASS: ${cases} cases match brute force; max() candidates and buy ≤ rest ≤ sell invariants hold.`,
);
