const assert = require('node:assert/strict');
const trace = require('./algorithm.js');
let cases = 0;
// Reference: a Map keeps insertion order, so its first key is the LRU.
function reference(capacity, ops) {
  const map = new Map();
  const out = [];
  const orders = [];
  for (const [type, key, value] of ops) {
    if (type === 'get') {
      if (!map.has(key)) out.push(-1);
      else {
        const v = map.get(key);
        map.delete(key);
        map.set(key, v);
        out.push(v);
      }
    } else {
      map.delete(key);
      map.set(key, value);
      if (map.size > capacity) map.delete(map.keys().next().value);
      out.push(null);
    }
    orders.push([...map]);
  }
  return {out, orders};
}
function walk(f) {
  const order = [];
  let prev = 'left';
  let id = f.nodes.left.nxt;
  while (id !== 'right') {
    const n = f.nodes[id];
    assert.equal(n.prev, prev, `${id}.prev`);
    order.push(id);
    prev = id;
    id = n.nxt;
    assert.ok(order.length <= 8, 'cycle');
  }
  assert.equal(f.nodes.right.prev, prev);
  return order;
}
function check(capacity, ops) {
  const frames = trace(capacity, ops);
  const ref = reference(capacity, ops);
  assert.deepEqual(frames.at(-1).results, ref.out, JSON.stringify(ops));
  // After each operation the list and the dict match the reference.
  frames.forEach((f, i) => {
    const next = frames[i + 1];
    if (f.phase !== 'return' || (next && next.operation === f.operation)) {
      return;
    }
    const order = walk(f);
    const expected = ref.orders[f.operation];
    assert.deepEqual(
      order.map((id) => [f.nodes[id].key, f.nodes[id].val]),
      expected,
    );
    const dict = new Map(f.cache);
    assert.equal(dict.size, expected.length);
    order.forEach((id) => assert.equal(dict.get(f.nodes[id].key), id));
    assert.ok(dict.size <= capacity);
  });
  // Every pointer that differs from the last frame is listed in `changed`.
  for (let i = 1; i < frames.length; i++) {
    const diff = [];
    for (const [id, n] of Object.entries(frames[i].nodes)) {
      const before = frames[i - 1].nodes[id];
      for (const field of ['prev', 'nxt']) {
        if (before && before[field] !== n[field]) diff.push(`${id}.${field}`);
      }
    }
    for (const d of diff) assert.ok(frames[i].changed.includes(d), d);
    for (const id of Object.values(frames[i].locals)) {
      assert.ok(id in frames[i].nodes, `local ${id}`);
    }
  }
  cases++;
}
const choices = [
  ['get', 1],
  ['get', 2],
  ['put', 1, 10],
  ['put', 1, 99],
  ['put', 2, 20],
  ['put', 3, 30],
];
function enumerate(ops, n) {
  if (ops.length === n) {
    for (const capacity of [1, 2, 3]) check(capacity, ops);
    return;
  }
  for (const op of choices) enumerate([...ops, op], n);
}
for (let n = 1; n <= 5; n++) enumerate([], n);
check(6, [
  ['put', 1, 1],
  ['put', 2, 2],
  ['put', 3, 3],
  ['put', 4, 4],
  ['put', 5, 5],
  ['put', 6, 6],
  ['get', 3],
  ['put', 7, 7],
  ['get', 1],
  ['put', -999, 999],
]);
for (const args of [
  [0, [['get', 1]]],
  [7, [['get', 1]]],
  [2, []],
  [2, [['put', 1]]],
  [2, [['bad', 1]]],
  [2, [['get', 1.2]]],
  [2, [['get', 1000]]],
]) {
  assert.throws(() => trace(...args));
}
console.log(
  `PASS: ${cases} sequences match a reference LRU; list ⇄ dict stay consistent and every pointer write is recorded.`,
);
