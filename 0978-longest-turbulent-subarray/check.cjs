const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Brute force: every subarray whose adjacent steps strictly alternate.
function turbulent(a) {
  for (let k = 1; k < a.length; k++) {
    if (a[k] === a[k - 1]) return false;
    if (
      k >= 2 &&
      Math.sign(a[k] - a[k - 1]) === Math.sign(a[k - 1] - a[k - 2])
    ) {
      return false;
    }
  }
  return true;
}
function brute(arr) {
  let best = 1;
  for (let s = 0; s < arr.length; s++) {
    for (let e = s; e < arr.length; e++) {
      if (turbulent(arr.slice(s, e + 1))) best = Math.max(best, e - s + 1);
    }
  }
  return best;
}
function check(arr) {
  const frames = trace(arr);
  const last = frames.at(-1);
  assert.equal(last.answer, brute(arr));
  const [s, e] = last.best;
  assert.equal(e - s + 1, last.answer, 'best window length matches ans');
  assert.ok(turbulent(arr.slice(s, e + 1)), 'best window is turbulent');
  for (const f of frames) {
    for (const [len, dir] of [
      [f.up, 1],
      [f.down, -1],
    ]) {
      const w = arr.slice(f.end - len + 1, f.end + 1);
      assert.equal(w.length, len);
      assert.ok(turbulent(w), 'chain window is turbulent');
      if (len >= 2) assert.equal(Math.sign(w.at(-1) - w.at(-2)), dir);
    }
    assert.ok(f.up === 1 || f.down === 1, 'one chain is always length 1');
    if (f.candidates) assert.equal(f.ans, Math.max(...f.candidates));
  }
  cases++;
}
function enumerate(a, n) {
  if (a.length === n) return check(a);
  for (const v of [0, 1, 2, 3]) enumerate([...a, v], n);
}
for (let n = 1; n <= 8; n++) enumerate([], n);
assert.equal(trace([9, 4, 2, 10, 7, 8, 8, 1, 9]).at(-1).answer, 5);
assert.equal(trace([4, 8, 12, 16]).at(-1).answer, 2);
assert.equal(trace([100]).at(-1).answer, 1);
assert.equal(trace([7, 7, 7]).at(-1).answer, 1);
check(Array.from({length: 20}, (_, i) => (i * 389) % 1000));
for (const a of [[], [1.5], [-1], [1000], Array(21).fill(1)]) {
  assert.throws(() => trace(a));
}
console.log(
  `PASS: ${cases} cases match brute force; up/down windows stay turbulent and end in the right direction.`,
);
