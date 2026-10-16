/*
 * Mirrors the Python subset-count DP line by line; snapshots are for
 * playback only.
 */
(function (root) {
  function trace(nums, target) {
    if (
      !Array.isArray(nums) ||
      nums.length < 1 ||
      nums.length > 8 ||
      nums.some((n) => !Number.isInteger(n) || n < 0 || n > 20)
    ) {
      throw new Error('動畫支援 1–8 個介於 0 至 20 的整數。');
    }
    if (!Number.isInteger(target) || Math.abs(target) > 160) {
      throw new Error('target 需為 −160 至 160 的整數。');
    }
    const frames = [];
    const total = nums.reduce((a, b) => a + b, 0);
    let P = null;
    let dp = [];
    function add(phase, line, title, note, extra = {}) {
      frames.push({phase, line, title, note, total, P, dp: [...dp], ...extra});
    }
    add('sum', [3], '先算總和', `total = ${nums.join(' + ')} = ${total}。`);
    const tooFar = Math.abs(target) > total;
    const odd = (total + target) % 2 !== 0;
    add(
      'check',
      [4],
      tooFar || odd ? '無法湊出 target' : '可以拆成正負兩組',
      tooFar
        ? `|target| = ${Math.abs(target)} 大於 total = ${total}，全部同號也到不了。`
        : odd
          ? `total + target = ${total + target} 是奇數，無法平分成整數 P。`
          : `|target| ≤ total，且 total + target = ${total + target} 是偶數。`,
      {fail: tooFar || odd},
    );
    if (tooFar || odd) {
      add('done', [5], '回傳 0', '沒有任何正負號組合能得到 target。', {
        answer: 0,
      });
      return frames;
    }
    P = (total + target) / 2;
    add(
      'target',
      [7],
      `轉換成子集合問題：P = ${P}`,
      `正號組總和 P、負號組總和 N：P − N = ${target}，P + N = ${total}，所以 P = (${total} + ${target}) / 2 = ${P}。`,
    );
    dp = Array(P + 1).fill(0);
    add(
      'alloc',
      [8],
      `建立 dp[0…${P}]`,
      'dp[s] = 用目前看過的數字，挑出總和恰好為 s 的方法數。',
    );
    dp[0] = 1;
    add('base', [9], 'dp[0] = 1', '什麼都不選，總和為 0：一種方法。', {s: 0});
    nums.forEach((x, k) => {
      add(
        'pick',
        [11],
        `處理第 ${k} 個數字 x = ${x}`,
        x > P
          ? `x = ${x} 大於 P，range(${P}, ${x - 1}, −1) 是空的，dp 不變。`
          : `由右往左更新 s = ${P} … ${x}，確保 dp[s − x] 還是「放入 x 之前」的舊值。`,
        {k, x},
      );
      for (let s = P; s >= x; s--) {
        const before = dp[s];
        const gain = dp[s - x];
        dp[s] += gain;
        add(
          'update',
          [12, 13],
          `dp[${s}] += dp[${s - x}]`,
          gain
            ? `把 x = ${x} 放進正號組：湊出 ${s - x} 的 ${gain} 種方法，各加上 ${x} 就湊出 ${s}。`
            : `dp[${s - x}] = 0，沒有方法可以接上 x = ${x}，dp[${s}] 不變。`,
          {k, x, s, from: s - x, before, gain},
        );
      }
    });
    add(
      'done',
      [14],
      `回傳 dp[${P}] = ${dp[P]}`,
      `共有 ${dp[P]} 種方式讓正號組總和為 ${P}，也就是 ${dp[P]} 種正負號組合得到 ${target}。`,
      {answer: dp[P]},
    );
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.targetSumTrace = trace;
})(globalThis);
