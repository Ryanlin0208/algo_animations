const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
function check(s) {
  const frames = trace(s);
  const result = frames.at(-1).result;
  const counts = {};
  for (const c of s) counts[c] = (counts[c] || 0) + 1;
  const possible =
    Math.max(...Object.values(counts)) <= Math.ceil(s.length / 2);
  assert.equal(result.length > 0, possible);
  if (possible) {
    assert.equal([...result].sort().join(''), [...s].sort().join(''));
    for (let i = 1; i < result.length; i++) {
      assert.notEqual(result[i], result[i - 1]);
    }
  }
  for (let i = 1; i < frames.length; i++) {
    const f = frames[i];
    const p = frames[i - 1];
    if (f.phase === 'pop') {
      const expected = [...p.heap].sort(
        (a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1),
      )[0];
      assert.deepEqual([f.freq, f.char], expected);
      assert.notEqual(f.char, p.ans.at(-1));
    }
    if (f.phase === 'release') assert(f.prev_count < 0);
  }
  cases++;
}
function enumerate(s, n) {
  if (s.length === n) return check(s);
  for (const c of 'abc') enumerate(s + c, n);
}
for (let n = 1; n <= 7; n++) enumerate('', n);
for (const s of ['', 'A', 'a1', 'a'.repeat(31)]) assert.throws(() => trace(s));
console.log(
  `PASS: ${cases} strings; frequency preservation, feasibility, adjacency and priority order.`,
);
