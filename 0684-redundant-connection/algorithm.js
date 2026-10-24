/*
 * Mirrors the Python union-find line by line; snapshots are for playback.
 * Each find level is two frames: the descent (parent[x] != x → recurse)
 * and the unwind (path compression), so the call stack stays visible.
 */
(function (root) {
  function trace(edges) {
    if (!Array.isArray(edges) || edges.length < 1 || edges.length > 12) {
      throw new Error('edges 需有 1 到 12 條。');
    }
    const n = edges.length;
    const seen = new Set();
    for (const edge of edges) {
      const ok =
        Array.isArray(edge) &&
        edge.length === 2 &&
        edge.every((v) => Number.isInteger(v) && v >= 1 && v <= n);
      if (!ok) {
        throw new Error(
          `每條邊是 [a, b]，且 1 ≤ a, b ≤ n = ${n}（n 是邊數）。`,
        );
      }
      if (edge[0] === edge[1]) throw new Error(`[${edge}] 是自環。`);
      const key = [...edge].sort((x, y) => x - y).join(',');
      if (seen.has(key)) throw new Error(`[${edge}] 重複出現。`);
      seen.add(key);
    }
    const parent = Array.from({length: n + 1}, (_, i) => i);
    const frames = [];
    const added = [];
    let edge = -1;
    const stack = [];
    let vars = {};
    let changed = [];
    function add(phase, line, title, note, extra = {}) {
      frames.push({
        phase,
        line,
        title,
        note,
        edge,
        added: [...added],
        parent: [...parent],
        stack: stack.map((s) => ({...s})),
        vars: {...vars},
        changed,
        ...extra,
      });
      changed = [];
    }
    add(
      'init',
      [3, 4],
      `parent = [0, 1, …, ${n}]`,
      `共有 ${n} 條邊、${n} 個點。一開始每個點的上司都是自己，各自一組。parent[0] 用不到。`,
    );
    function find(x, label) {
      // Iterative mirror of the recursive find so every level gets a frame.
      const path = [];
      let cur = x;
      while (true) {
        stack.push({x: cur});
        if (parent[cur] !== cur) {
          add(
            'descend',
            path.length ? [8, 6, 7] : [12, 6, 7],
            `find(${cur})：parent[${cur}] = ${parent[cur]} ≠ ${cur}`,
            `${cur} 不是自己的上司，往上找 find(${parent[cur]})。`,
            {label},
          );
          path.push(cur);
          cur = parent[cur];
        } else {
          stack.at(-1).ret = cur;
          add(
            'root',
            [7, 9],
            `find(${cur})：parent[${cur}] == ${cur}，回傳 ${cur}`,
            `${cur} 的上司就是自己，它是這一組的老大（root）。`,
            {label, root: cur},
          );
          break;
        }
      }
      const top = cur;
      stack.pop();
      while (path.length) {
        const y = path.pop();
        const before = parent[y];
        parent[y] = top;
        if (before !== top) changed.push(y);
        stack.at(-1).ret = top;
        add(
          'compress',
          [8, 9],
          before !== top
            ? `路徑壓縮：parent[${y}] = ${top}（原本 ${before}）`
            : `parent[${y}] = ${top}（本來就指向 ${top}）`,
          before !== top
            ? `${y} 直接改指向老大 ${top}，下次 find(${y}) 一步就到。`
            : `${y} 已經直接指向老大，回傳 ${top}。`,
          {label, root: top, from: before, node: y},
        );
        stack.pop();
      }
      return top;
    }
    for (let k = 0; k < n; k++) {
      const [a, b] = edges[k];
      edge = k;
      added.push(k);
      vars = {a, b};
      add(
        'edge',
        [11],
        `第 ${k + 1} 條邊 [${a}, ${b}]`,
        `把邊 ${a} — ${b} 加進圖裡，先問 ${a} 和 ${b} 各自的老大是誰。`,
      );
      const ra = find(a, 'ra');
      vars.ra = ra;
      add(
        'found',
        [12],
        `ra = find(${a}) = ${ra}`,
        `${a} 屬於老大 ${ra} 這一組。`,
      );
      const rb = find(b, 'rb');
      vars.rb = rb;
      add(
        'found',
        [12],
        `rb = find(${b}) = ${rb}`,
        `${b} 屬於老大 ${rb} 這一組。`,
      );
      if (ra === rb) {
        add(
          'cycle',
          [13, 14],
          `ra == rb == ${ra} → 回傳 [${a}, ${b}]`,
          `${a} 和 ${b} 早就連通了，這條邊會造成環，它就是多餘的邊。`,
          {answer: [a, b]},
        );
        return frames;
      }
      add(
        'compare',
        [13],
        `ra = ${ra} ≠ rb = ${rb}`,
        '兩個點在不同組，這條邊不會造成環，可以合併。',
      );
      parent[ra] = rb;
      changed.push(ra);
      add(
        'union',
        [15],
        `parent[${ra}] = ${rb}`,
        `老大 ${ra} 改認 ${rb} 當上司，兩組合併成一組。`,
        {merged: ra, into: rb},
      );
    }
    edge = n;
    vars = {};
    add(
      'none',
      [11],
      '所有邊都處理完，沒有環',
      '這組邊沒有多餘的邊，函式結束時回傳 None。LeetCode 的輸入保證一定有環，不會走到這裡。',
      {answer: null},
    );
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.unionTrace = trace;
})(globalThis);
