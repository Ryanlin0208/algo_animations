const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Brute force: a DFS three-colour cycle check.
function hasCycle(n, pairs) {
  const adj = Array.from({length: n}, () => []);
  for (const [a, b] of pairs) adj[b].push(a);
  const color = Array(n).fill(0);
  const visit = (u) => {
    color[u] = 1;
    for (const v of adj[u]) {
      if (color[v] === 1 || (color[v] === 0 && visit(v))) return true;
    }
    color[u] = 2;
    return false;
  };
  return [...Array(n).keys()].some((u) => color[u] === 0 && visit(u));
}
function check(n, pairs) {
  const {frames, edges} = trace(n, pairs);
  const last = frames.at(-1);
  assert.equal(last.answer, !hasCycle(n, pairs), JSON.stringify([n, pairs]));
  assert.equal(edges.length, pairs.length);
  // Every taken course had all of its prerequisites taken earlier.
  const pos = new Map(last.order.map((c, k) => [c, k]));
  for (const [a, b] of pairs) {
    if (pos.has(a)) assert.ok(pos.has(b) && pos.get(b) < pos.get(a));
  }
  assert.equal(last.taken, last.order.length);
  if (!last.answer) {
    for (const c of last.stuck) assert.ok(!pos.has(c));
  }
  for (const f of frames) {
    assert.ok(f.indeg.every((d) => d >= 0));
    if (f.phase === 'enqueue') assert.equal(f.indeg[f.nxt], 0);
    if (f.phase === 'relax') {
      assert.deepEqual(
        [edges[f.edge].from, edges[f.edge].to],
        [f.course, f.nxt],
      );
    }
  }
  cases++;
}
// All directed graphs on up to 4 nodes (self-loops included).
for (let n = 1; n <= 4; n++) {
  const all = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) all.push([a, b]);
  for (let mask = 0; mask < 1 << all.length; mask++) {
    check(
      n,
      all.filter((_, k) => mask & (1 << k)),
    );
  }
}
const answer = (n, p) => trace(n, p).frames.at(-1).answer;
assert.equal(answer(2, [[1, 0]]), true);
assert.equal(
  answer(2, [
    [1, 0],
    [0, 1],
  ]),
  false,
);
assert.equal(answer(3, []), true);
check(12, [
  [1, 0],
  [2, 1],
  [3, 2],
  [11, 10],
  [10, 11],
]);
for (const [n, p] of [
  [0, []],
  [13, []],
  [2, [[2, 0]]],
  [2, [[1]]],
  [
    2,
    [
      [1, 0],
      [1, 0],
    ],
  ],
]) {
  assert.throws(() => trace(n, p));
}
console.log(
  `PASS: ${cases} graphs match a DFS cycle check; every course is taken after its prerequisites.`,
);
