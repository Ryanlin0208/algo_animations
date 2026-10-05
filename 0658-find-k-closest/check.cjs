const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Exhaustively check small sorted arrays, including duplicates and outside targets.
function check(arr, length) {
  if (arr.length < length) {
    for (let v = arr.length ? arr.at(-1) : -2; v <= 2; v++) check([...arr, v], length);
    return;
  }
  for (let k = 1; k <= length; k++) for (let x = -4; x <= 4; x++) {
    const frames = trace(arr, k, x), last = frames.at(-1);
    const expected = [...arr].sort((a, b) => Math.abs(a - x) - Math.abs(b - x) || a - b).slice(0, k).sort((a, b) => a - b);
    assert.deepEqual(arr.slice(last.left, last.left + k), expected);
    for (const f of frames) { assert(f.left <= f.right); if (f.mid !== undefined) assert(f.mid + k < arr.length); }
    cases++;
  }
}
for (let n = 1; n <= 7; n++) check([], n);
for (const [a, k, x] of [[[], 1, 0], [[2, 1], 1, 0], [[1], 0, 0], [[1], 2, 0], [[1.2], 1, 0], [[1], 1, NaN]]) assert.throws(() => trace(a, k, x));
console.log(`PASS: ${cases} cases, including ties, duplicates, k=n and outside targets; invalid inputs rejected.`);
