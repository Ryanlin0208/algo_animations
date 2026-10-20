const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Exact set of unmatched '(' counts over every valid '*' choice (never < 0).
function reachable(s, upto) {
  let set = new Set([0]);
  for (let k = 0; k < upto; k++) {
    const next = new Set();
    for (const b of set) {
      const moves = {'(': [1], ')': [-1], '*': [-1, 0, 1]}[s[k]];
      for (const d of moves) if (b + d >= 0) next.add(b + d);
    }
    set = next;
  }
  return set;
}
function range(lo, hi) {
  return Array.from({length: hi - lo + 1}, (_, k) => lo + k);
}
function check(s) {
  const {frames, cols} = trace(s);
  const last = frames.at(-1);
  assert.equal(last.answer, reachable(s, s.length).has(0), s);
  for (const f of frames) {
    if (f.phase !== 'clamp' && f.phase !== 'init') continue;
    const exact = [...reachable(s, f.col)].sort((a, b) => a - b);
    assert.deepEqual(range(f.lo, f.hi), exact, `${s} @ ${f.col}`);
  }
  if (last.phase === 'fail') {
    assert.equal(reachable(s, last.col).size, 0, 'fail means nothing left');
    assert.equal(cols.length, last.col + 1);
  } else {
    assert.equal(cols.length, s.length + 1);
  }
  // The failing column returns before `lo = max(lo, 0)` runs.
  const failed = last.phase === 'fail' ? last.col : -1;
  for (const [k, c] of cols.entries()) {
    assert.equal(c.lo, k === failed ? c.rawLo : Math.max(c.rawLo, 0));
    assert.ok(c.rawLo >= -1, 'lo dips at most one below the floor');
  }
  cases++;
}
function enumerate(s, n) {
  if (s.length === n) return check(s);
  for (const c of '()*') enumerate(s + c, n);
}
for (let n = 1; n <= 9; n++) enumerate('', n);
const answer = (s) => trace(s).frames.at(-1).answer;
assert.equal(answer('()'), true);
assert.equal(answer('(*)'), true);
assert.equal(answer('(*))'), true);
assert.equal(answer('*('), false);
assert.equal(answer('())*'), false);
assert.equal(answer('((*'), false);
check('(*()*))(**(*)'.padEnd(24, '*'));
for (const s of ['', 'a', '(()x', '('.repeat(25), 42]) {
  assert.throws(() => trace(s));
}
console.log(
  `PASS: ${cases} cases match brute force; every [lo, hi] equals the exact reachable set.`,
);
