/*
 * Mirrors the Python LRUCache line by line; snapshots are for playback.
 * Nodes keep a stable identity (left, right, N1, N2 …) separate from key / val,
 * and every pointer write is recorded so the view can draw it.
 */
(function (root) {
  function trace(capacity, operations) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 6) {
      throw new Error('capacity 需介於 1 到 6。');
    }
    if (
      !Array.isArray(operations) ||
      !operations.length ||
      operations.length > 20
    ) {
      throw new Error('操作需有 1 到 20 筆。');
    }
    for (const op of operations) {
      const ok =
        Array.isArray(op) &&
        ['get', 'put'].includes(op[0]) &&
        op.length === (op[0] === 'get' ? 2 : 3) &&
        op.slice(1).every((v) => Number.isInteger(v) && Math.abs(v) <= 999);
      if (!ok) {
        throw new Error(
          '每筆操作是 ["get", key] 或 ["put", key, value]，整數介於 ±999。',
        );
      }
    }
    const nodes = {};
    const cache = new Map();
    const frames = [];
    const results = [];
    let serial = 0;
    let operation = -1;
    let locals = {};
    let changed = [];
    function add(phase, line, title, note, extra = {}) {
      frames.push({
        phase,
        line,
        title,
        note,
        operation,
        changed,
        locals: {...locals},
        nodes: Object.fromEntries(
          Object.entries(nodes).map(([id, n]) => [id, {...n}]),
        ),
        cache: [...cache],
        results: [...results],
        ...extra,
      });
      changed = [];
    }
    function set(id, field, to) {
      nodes[id][field] = to;
      changed.push(`${id}.${field}`);
    }
    add('init', [10, 11, 12], '建立空的 cache', `capacity = ${capacity}。`);
    nodes.left = {key: 0, val: 0, prev: null, nxt: null};
    nodes.right = {key: 0, val: 0, prev: null, nxt: null};
    add(
      'init',
      [13],
      '建立兩個哨兵節點 left、right',
      '哨兵只用來標記兩端，不存資料，也不算進容量。指標一開始都是 None。',
    );
    set('left', 'nxt', 'right');
    set('right', 'prev', 'left');
    add(
      'link',
      [14],
      'left.nxt = right，right.prev = left',
      '空串列：left ⇄ right。之後左邊是最久沒用（LRU），右邊是最近使用（MRU）。',
    );
    function remove(id, callLine, caller) {
      locals = {...caller, node: id};
      add(
        'remove',
        [callLine, 21],
        `呼叫 remove(${id})`,
        '把節點從串列中間摘下來；remove 不會動 cache。',
      );
      const curPrev = nodes[id].prev;
      locals.cur_prev = curPrev;
      add('remove', [22], `cur_prev = ${curPrev}`, `記住 ${id} 前面的節點。`);
      const curNxt = nodes[id].nxt;
      locals.cur_nxt = curNxt;
      add('remove', [23], `cur_nxt = ${curNxt}`, `記住 ${id} 後面的節點。`);
      set(curPrev, 'nxt', curNxt);
      add(
        'link',
        [24],
        `${curPrev}.nxt = ${curNxt}`,
        `往右走的箭頭跳過 ${id}，${id} 離開串列。`,
      );
      set(curNxt, 'prev', curPrev);
      add(
        'link',
        [25],
        `${curNxt}.prev = ${curPrev}`,
        `往左走的箭頭也接好了。${id} 自己的 prev、nxt 還指著舊鄰居，但已經沒有人指向它。`,
      );
      locals = {...caller};
    }
    function insert(id, callLine, caller) {
      locals = {...caller, node: id};
      add(
        'insert',
        [callLine, 16],
        `呼叫 insert(${id})`,
        '把節點接到 right 的前面，成為最近使用（MRU）。',
      );
      const curHead = nodes.right.prev;
      locals.cur_head = curHead;
      add(
        'insert',
        [17],
        `cur_head = right.prev = ${curHead}`,
        `${curHead} 是目前最右邊的節點，新節點要接在它和 right 中間。`,
      );
      set(curHead, 'nxt', id);
      set('right', 'prev', id);
      add(
        'link',
        [18],
        `${curHead}.nxt = ${id}，right.prev = ${id}`,
        `兩個鄰居同時改指向 ${id}。`,
      );
      set(id, 'prev', curHead);
      set(id, 'nxt', 'right');
      add(
        'link',
        [19],
        `${id}.prev = ${curHead}，${id}.nxt = right`,
        `${id} 的兩根指標也接上，雙向連結完成。`,
      );
      locals = {...caller};
    }
    operations.forEach((op, index) => {
      operation = index;
      locals = {};
      const [type, key, value] = op;
      if (type === 'get') {
        add('call', [27], `get(${key})`, `查詢 key ${key}。`, {key});
        const hit = cache.has(key);
        add(
          'lookup',
          [28],
          hit ? `${key} 在 cache 裡` : `${key} 不在 cache 裡`,
          hit
            ? '命中，接下來要把它移到最右邊（MRU）。'
            : '沒有這個 key，直接回傳 −1。',
          {key, hit},
        );
        if (!hit) {
          results.push(-1);
          add('return', [29], '回傳 −1', '查不到時，使用順序不變。', {key});
          return;
        }
        const id = cache.get(key);
        locals = {node: id};
        add(
          'lookup',
          [30, 31],
          `node = cache[${key}] = ${id}`,
          `字典直接給出節點 ${id}，不用從頭走訪串列。`,
          {key, hit: true},
        );
        remove(id, 32, {node: id});
        insert(id, 33, {node: id});
        results.push(nodes[id].val);
        add(
          'return',
          [35],
          `回傳 ${id}.val = ${nodes[id].val}`,
          `${id} 現在在最右邊，是最近使用的節點。`,
          {key},
        );
        return;
      }
      add('call', [37], `put(${key}, ${value})`, `寫入 key ${key}。`, {key});
      const had = cache.has(key);
      add(
        'lookup',
        [38],
        had ? `${key} 已經在 cache 裡` : `${key} 不在 cache 裡`,
        had
          ? '這份程式的作法是先把舊節點摘下，再建立一個新節點。'
          : '直接建立新節點。',
        {key, hit: had},
      );
      if (had) remove(cache.get(key), 39, {});
      const id = `N${++serial}`;
      nodes[id] = {key, val: value, prev: null, nxt: null};
      locals = {node: id};
      add(
        'create',
        [41],
        `node = Node(${key}, ${value}) → ${id}`,
        `${id} 是新節點的身分，key=${key}、val=${value} 是它存的資料。指標都還是 None。`,
        {key},
      );
      const old = cache.get(key);
      cache.set(key, id);
      add(
        'cache',
        [42],
        `cache[${key}] = ${id}`,
        old
          ? `字典的 ${key} 改指向新節點 ${id}，舊節點 ${old} 沒有人再指向它。`
          : `字典新增 ${key} → ${id}，但 ${id} 還沒接進串列。`,
        {key, dropped: old ?? null},
      );
      insert(id, 43, {node: id});
      const over = cache.size > capacity;
      add(
        'capacity',
        [45],
        `len(cache) = ${cache.size} ${over ? '>' : '≤'} ${capacity}`,
        over ? '超過容量，要淘汰最久沒用的節點。' : '沒有超過容量。',
        {key, over},
      );
      if (over) {
        const lru = nodes.left.nxt;
        locals = {node: id, lru};
        add(
          'evict',
          [46],
          `lru = left.nxt = ${lru}`,
          `left 右邊的第一個節點 ${lru}（key ${nodes[lru].key}）最久沒被使用。`,
          {key},
        );
        remove(lru, 47, {node: id, lru});
        const lruKey = nodes[lru].key;
        cache.delete(lruKey);
        add(
          'cache',
          [48],
          `del cache[${lruKey}]`,
          `字典刪掉 ${lruKey}，${lru} 從兩個結構都消失了。`,
          {key: lruKey, dropped: lru},
        );
      }
      results.push(null);
      add('return', [37], 'put 完成', 'put 沒有回傳值（None）。', {key});
    });
    operation = operations.length;
    locals = {};
    add(
      'done',
      [],
      '所有操作完成',
      '輸出依操作順序排列；null 是 put 的 None。',
    );
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.lruTrace = trace;
})(globalThis);
