const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Brute force: the first edge whose endpoints are already connected.
function firstCycleEdge(edges) {
  const adj = new Map();
  const linked = (a, b) => {
    const seen = new Set([a]);
    const todo = [a];
    while (todo.length) {
      const u = todo.pop();
      if (u === b) return true;
      for (const v of adj.get(u) ?? []) {
        if (!seen.has(v)) {
          seen.add(v);
          todo.push(v);
        }
      }
    }
    return false;
  };
  for (const [a, b] of edges) {
    if (linked(a, b)) return [a, b];
    for (const [u, v] of [
      [a, b],
      [b, a],
    ]) {
      adj.set(u, [...(adj.get(u) ?? []), v]);
    }
  }
  return null;
}
function components(n, edges) {
  const label = Array(n + 1).fill(0);
  for (let s = 1; s <= n; s++) {
    if (label[s]) continue;
    label[s] = s;
    const todo = [s];
    while (todo.length) {
      const u = todo.pop();
      for (const [a, b] of edges) {
        const v = a === u ? b : b === u ? a : 0;
        if (v && !label[v]) {
          label[v] = s;
          todo.push(v);
        }
      }
    }
  }
  return label;
}
const rootOf = (p, x) => (p[x] === x ? x : rootOf(p, p[x]));
function check(edges) {
  const frames = trace(edges);
  const last = frames.at(-1);
  assert.deepEqual(last.answer, firstCycleEdge(edges), JSON.stringify(edges));
  for (const f of frames) {
    // parent stays a forest: following parents always reaches a root.
    f.parent.forEach((_, x) => assert.ok(rootOf(f.parent, x) >= 0));
    if (f.phase === 'compress') {
      assert.equal(f.parent[f.node], f.root);
    }
    if (f.phase === 'union' || f.phase === 'cycle') {
      // Components match the edges added so far.
      const upTo = edges.slice(0, f.edge + (f.phase === 'union' ? 1 : 0));
      const label = components(edges.length, upTo);
      for (let x = 1; x <= edges.length; x++) {
        for (let y = x + 1; y <= edges.length; y++) {
          const same = rootOf(f.parent, x) === rootOf(f.parent, y);
          assert.equal(same, label[x] === label[y]);
        }
      }
    }
  }
  cases++;
}
function* permutations(items) {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) yield [items[i], ...p];
  }
}
// Every n-edge graph on n nodes, in every order and orientation, n = 3..5.
for (let n = 3; n <= 5; n++) {
  const all = [];
  for (let a = 1; a <= n; a++) {
    for (let b = a + 1; b <= n; b++) all.push([a, b]);
  }
  const pick = (start, chosen) => {
    if (chosen.length === n) {
      for (const order of permutations(chosen)) {
        check(order);
        check(order.map(([a, b], k) => (k % 2 ? [b, a] : [a, b])));
      }
      return;
    }
    for (let i = start; i < all.length; i++) pick(i + 1, [...chosen, all[i]]);
  };
  pick(0, []);
}
// Random larger inputs, including LeetCode-shaped ones (tree + one edge).
let seed = 7;
// Integer LCG; the high bits are used because its low bits cycle quickly.
const rand = (m) =>
  ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 16) % m;
for (let t = 0; t < 3000; t++) {
  const n = 6 + rand(7);
  const edges = [];
  for (let v = 2; v <= n; v++) edges.push([1 + rand(v - 1), v]);
  let extra;
  do {
    extra = [1 + rand(n), 1 + rand(n)];
  } while (
    extra[0] === extra[1] ||
    edges.some(
      ([a, b]) =>
        (a === extra[0] && b === extra[1]) ||
        (a === extra[1] && b === extra[0]),
    )
  );
  edges.push(extra);
  for (let i = edges.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [edges[i], edges[j]] = [edges[j], edges[i]];
  }
  check(edges);
}
const answer = (e) => trace(e).at(-1).answer;
assert.deepEqual(
  answer([
    [1, 2],
    [1, 3],
    [2, 3],
  ]),
  [2, 3],
);
assert.deepEqual(
  answer([
    [1, 2],
    [2, 3],
    [3, 4],
    [1, 4],
    [1, 5],
  ]),
  [1, 4],
);
for (const bad of [
  [],
  [[1, 1]],
  [
    [1, 2],
    [2, 1],
  ],
  [[1, 3]],
  [[1.5, 2]],
]) {
  assert.throws(() => trace(bad));
}
console.log(
  `PASS: ${cases} edge lists match a brute-force cycle check; components and path compression verified.`,
);
