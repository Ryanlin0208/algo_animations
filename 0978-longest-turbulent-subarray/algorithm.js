/*
 * Mirrors the Python rolling DP line by line; snapshots are for playback.
 * up / down: length of the longest turbulent subarray ending at `end`
 * whose last step rises / falls. Each chain covers [end - len + 1, end].
 */
(function (root) {
  function trace(arr) {
    if (
      !Array.isArray(arr) ||
      arr.length < 1 ||
      arr.length > 20 ||
      arr.some((v) => !Number.isInteger(v) || v < 0 || v > 999)
    ) {
      throw new Error('動畫支援 1–20 個介於 0 至 999 的整數。');
    }
    let up = 1;
    let down = 1;
    let ans = 1;
    let best = [0, 0];
    const frames = [];
    function add(phase, line, title, note, extra = {}) {
      frames.push({
        phase,
        line,
        title,
        note,
        up,
        down,
        ans,
        best: [...best],
        ...extra,
      });
    }
    add(
      'init',
      [3, 4],
      '初始化：每個元素自己就是長度 1',
      '只有一個數字時沒有比較可言，up、down 與 ans 都從 1 開始。',
      {i: 0, end: 0},
    );
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1];
      const b = arr[i];
      const cmp = b > a ? 'up' : b < a ? 'down' : 'eq';
      const sign = {up: '>', down: '<', eq: '='}[cmp];
      add(
        'compare',
        {up: [5, 6], down: [5, 6, 8], eq: [5, 6, 8, 10]}[cmp],
        `比較 arr[${i}] 與 arr[${i - 1}]：${b} ${sign} ${a}`,
        {
          up: '這一段往上走 ↗。能接在它前面的，只有「最後一步往下」的 down 鏈。',
          down: '這一段往下走 ↘。能接在它前面的，只有「最後一步往上」的 up 鏈。',
          eq: '兩數相等，既不是上升也不是下降，任何震盪都在這裡斷開。',
        }[cmp],
        {i, end: i - 1, cmp},
      );
      const prevUp = up;
      const prevDown = down;
      if (cmp === 'up') {
        [up, down] = [down + 1, 1];
      } else if (cmp === 'down') {
        [up, down] = [1, up + 1];
      } else {
        up = down = 1;
      }
      const grown = cmp === 'up' ? up : cmp === 'down' ? down : 1;
      const restart = cmp === 'eq' || (grown === 2 && i >= 2);
      const title = {
        up: `up = down + 1 = ${prevDown} + 1 = ${up}，down = 1`,
        down: `down = up + 1 = ${prevUp} + 1 = ${down}，up = 1`,
        eq: 'up = down = 1：重新開始',
      }[cmp];
      let note;
      if (cmp === 'eq') {
        note = `arr[${i}] 只能自己成為新的起點。`;
      } else if (restart) {
        note = `前一段和這一段同方向（或相等），舊鏈接不上，從 arr[${i - 1}] 重新長出長度 2 的鏈。`;
      } else if (i === 1) {
        note = '第一段比較，兩個不同的數字形成長度 2 的震盪鏈。';
      } else {
        note = `方向和前一段相反，把舊的${cmp === 'up' ? ' down' : ' up'} 鏈整條接過來再加這一段。`;
      }
      if (cmp === 'up') note += '以下降結尾的 down 鏈只剩 arr[i] 自己。';
      if (cmp === 'down') note += '以上升結尾的 up 鏈只剩 arr[i] 自己。';
      add('update', {up: [7], down: [9], eq: [11]}[cmp], title, note, {
        i,
        end: i,
        cmp,
        prevUp,
        prevDown,
        restart,
      });
      const prevAns = ans;
      ans = Math.max(ans, up, down);
      if (ans > prevAns) best = [i - ans + 1, i];
      add(
        'ans',
        [12],
        ans > prevAns ? `ans 更新為 ${ans}` : `ans 維持 ${ans}`,
        ans > prevAns
          ? `目前最長的震盪子陣列是 arr[${best[0]}..${best[1]}]。`
          : `這條鏈長度 ${Math.max(up, down)}，沒有超過紀錄。`,
        {i, end: i, cmp, prevAns, candidates: [prevAns, up, down]},
      );
    }
    add(
      'done',
      [13],
      `回傳 ans = ${ans}`,
      `最長震盪子陣列是 arr[${best[0]}..${best[1]}]，每一段都與相鄰段方向相反。`,
      {i: arr.length - 1, end: arr.length - 1, answer: ans},
    );
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.turbulentTrace = trace;
})(globalThis);
