/*
 * Mirrors the Python Kahn's algorithm line by line; snapshots are for playback.
 * Edge [a, b] means "take b before a" and is drawn b → a.
 */
(function (root) {
  function trace(n, prerequisites) {
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      throw new Error('numCourses 需介於 1 到 12。');
    }
    if (!Array.isArray(prerequisites) || prerequisites.length > 20) {
      throw new Error('prerequisites 最多 20 組。');
    }
    const seen = new Set();
    for (const pair of prerequisites) {
      const ok =
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every((v) => Number.isInteger(v) && v >= 0 && v < n);
      if (!ok) {
        throw new Error(`每組先修關係都要是 [a, b]，且 0 ≤ a, b < ${n}。`);
      }
      const key = pair.join(',');
      if (seen.has(key)) throw new Error(`[${key}] 重複出現。`);
      seen.add(key);
    }
    const graph = Array.from({length: n}, () => []);
    const indeg = Array(n).fill(0);
    const edges = [];
    let q = [];
    let taken = 0;
    const order = [];
    const frames = [];
    function add(phase, line, title, note, extra = {}) {
      frames.push({
        phase,
        line,
        title,
        note,
        indeg: [...indeg],
        q: [...q],
        taken,
        order: [...order],
        edges: edges.length,
        ...extra,
      });
    }
    add(
      'init',
      [5, 6],
      '建立空的圖與 indeg 陣列',
      `共有 ${n} 堂課，還沒有任何先修關係，每堂課的 indeg 都是 0。`,
    );
    prerequisites.forEach(([a, b], k) => {
      graph[b].push(a);
      indeg[a] += 1;
      edges.push({from: b, to: a});
      add(
        'edge',
        [8, 9, 10],
        `[${a}, ${b}]：畫一條 ${b} → ${a}，indeg[${a}] = ${indeg[a]}`,
        `要先修完課 ${b} 才能修課 ${a}。課 ${a} 又多了一堂要等的先修課。`,
        {edge: k, a, b},
      );
    });
    q = indeg.flatMap((d, i) => (d === 0 ? [i] : []));
    add(
      'seed',
      [12, 13],
      q.length
        ? `indeg 為 0 的課先排隊：${q.join('、')}`
        : '沒有 indeg 為 0 的課，佇列是空的',
      q.length
        ? '這些課沒有任何先修限制，可以直接修。taken 從 0 開始計算。'
        : '每堂課都有先修課在等，代表一開始就卡住，一堂都修不了。',
      {enqueued: [...q]},
    );
    while (q.length) {
      const course = q.shift();
      taken += 1;
      order.push(course);
      const unlocks = graph[course];
      add(
        'pop',
        [15, 16, 17],
        `取出課 ${course} 修掉，taken = ${taken}`,
        unlocks.length
          ? `修完課 ${course} 後，要通知它解鎖的課：${unlocks.join('、')}。`
          : `課 ${course} 不是任何課的先修課，修完就結束。`,
        {course},
      );
      for (const nxt of unlocks) {
        indeg[nxt] -= 1;
        const edge = edges.findIndex((e) => e.from === course && e.to === nxt);
        const ready = indeg[nxt] === 0;
        add(
          'relax',
          [18, 19, 20],
          `indeg[${nxt}] − 1 = ${indeg[nxt]}`,
          ready
            ? `課 ${nxt} 的先修課全修完了。`
            : `課 ${nxt} 還有 ${indeg[nxt]} 堂先修課沒修，先不能排隊。`,
          {course, nxt, edge, ready},
        );
        if (ready) {
          q.push(nxt);
          add(
            'enqueue',
            [21],
            `課 ${nxt} 加入佇列`,
            `佇列現在是 [${q.join(', ')}]。`,
            {course, nxt, edge},
          );
        }
      }
    }
    const answer = taken === n;
    const stuck = indeg.flatMap((d, i) => (d > 0 ? [i] : []));
    add(
      'done',
      [23],
      `taken = ${taken}，numCourses = ${n} → ${answer ? 'True' : 'False'}`,
      answer
        ? `每堂課都修得到，修課順序是 ${order.join(' → ')}。`
        : `課 ${stuck.join('、')} 的 indeg 永遠歸不了零：它們不是卡在循環裡，就是排在循環後面。`,
      {answer, stuck},
    );
    return {frames, edges};
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.courseTrace = trace;
})(globalThis);
