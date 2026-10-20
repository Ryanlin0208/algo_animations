/*
 * Mirrors the Python greedy line by line; snapshots are for playback.
 * [lo, hi] is the range of possible counts of unmatched '(' after s[i].
 * Column 0 is the start; column i + 1 is the state after s[i].
 */
(function (root) {
  function trace(s) {
    if (typeof s !== 'string' || s.length < 1 || s.length > 24) {
      throw new Error('動畫支援長度 1–24 的字串。');
    }
    if (!/^[()*]+$/.test(s)) {
      throw new Error('字串只能包含 (、) 與 *。');
    }
    let lo = 0;
    let hi = 0;
    const frames = [];
    // Per-column history: raw = right after the update, lo = after clamping.
    const cols = [{rawLo: 0, rawHi: 0, lo: 0, hi: 0}];
    function add(phase, line, title, note, extra = {}) {
      frames.push({phase, line, title, note, lo, hi, ...extra});
    }
    add(
      'init',
      [3],
      '初始化：lo = hi = 0',
      '還沒讀任何字元，未配對的左括號一定是 0 個，可能範圍只有 {0}。',
      {i: -1, col: 0},
    );
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      const prevLo = lo;
      const prevHi = hi;
      if (c === '(') {
        lo += 1;
        hi += 1;
      } else if (c === ')') {
        lo -= 1;
        hi -= 1;
      } else {
        lo -= 1;
        hi += 1;
      }
      const col = i + 1;
      cols.push({rawLo: lo, rawHi: hi, lo, hi});
      const extra = {i, c, col, prevLo, prevHi};
      add(
        'update',
        {'(': [5, 6, 7], ')': [5, 8, 9, 10], '*': [5, 8, 11, 12, 13]}[c],
        {
          '(': `讀到 (：lo = ${prevLo} + 1 = ${lo}，hi = ${prevHi} + 1 = ${hi}`,
          ')': `讀到 )：lo = ${prevLo} − 1 = ${lo}，hi = ${prevHi} − 1 = ${hi}`,
          '*': `讀到 *：lo = ${prevLo} − 1 = ${lo}，hi = ${prevHi} + 1 = ${hi}`,
        }[c],
        {
          '(': '左括號一定會多出一個等待配對的 (，整段範圍往上平移 1。',
          ')': '右括號一定會配掉一個 (，整段範圍往下平移 1。',
          '*': '* 有三種身分：當 ) 讓數量 −1、當空字串不變、當 ( 讓數量 +1。範圍往上下各撐開 1。',
        }[c],
        extra,
      );
      const fail = hi < 0;
      add(
        'check',
        [15],
        fail
          ? `hi = ${hi} < 0：連最多的可能都不夠`
          : `hi = ${hi} ≥ 0：還有可能`,
        fail
          ? '就算前面所有 * 都當成 (，左括號還是不夠配這個 )。'
          : '至少有一種把 * 換掉的方法，讓目前為止的右括號都配得到左括號。',
        {...extra, fail},
      );
      if (fail) {
        add(
          'fail',
          [16],
          '回傳 False',
          `在 s[${i}] 這個 ) 時，右括號比所有可能的左括號都多，後面的字元也救不回來。`,
          {...extra, answer: false},
        );
        return {frames, cols};
      }
      const rawLo = lo;
      lo = Math.max(lo, 0);
      cols[col].lo = lo;
      add(
        'clamp',
        [17],
        rawLo < 0
          ? `lo = max(${rawLo}, 0) = 0：丟掉負數`
          : `lo = max(${rawLo}, 0) = ${lo}：不用調整`,
        rawLo < 0
          ? '未配對數量變成 −1，代表那種選法讓 ) 多於 (，選法不合法，直接刪掉。範圍下緣回到 0。'
          : '範圍下緣沒有跌破 0，每種可能都還合法。',
        {...extra, rawLo, clamped: rawLo < 0},
      );
    }
    add(
      'done',
      [18],
      `回傳 lo == 0 → ${lo === 0 ? 'True' : 'False'}`,
      lo === 0
        ? `最後的範圍是 ${lo}…${hi}，包含 0：存在一種選法讓所有括號剛好配完。`
        : `最後的範圍是 ${lo}…${hi}，最少也有 ${lo} 個 ( 沒被配到，所以不合法。`,
      {i: s.length - 1, col: s.length, answer: lo === 0},
    );
    return {frames, cols};
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.parenTrace = trace;
})(globalThis);
