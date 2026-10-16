/*
 * Mirrors the Python DP line by line; snapshots are for playback only.
 * Python's max() keeps the first maximum, so ties pick the earliest
 * candidate.
 */
(function (root) {
  function trace(prices) {
    if (
      !Array.isArray(prices) ||
      prices.length < 1 ||
      prices.length > 15 ||
      prices.some((p) => !Number.isInteger(p) || p < 0 || p > 1000)
    ) {
      throw new Error('動畫支援 1–15 個介於 0 至 1000 的整數價格。');
    }
    const buy = [0 - prices[0]];
    const sell = [0];
    const rest = [0];
    const frames = [];
    const fmt = (n) => (n < 0 ? `−${-n}` : `${n}`);
    function add(phase, line, title, note, extra = {}) {
      frames.push({
        phase,
        line,
        title,
        note,
        buy: [...buy],
        sell: [...sell],
        rest: [...rest],
        ...extra,
      });
    }
    function pick(candidates) {
      let winner = 0;
      candidates.forEach((c, k) => {
        if (c.value > candidates[winner].value) winner = k;
      });
      return winner;
    }
    add(
      'init',
      [3],
      '第 0 天：建立三種狀態',
      `buy[0] = −${prices[0]}（第 0 天買入）；sell[0] 與 rest[0] 都是 0（什麼都沒做）。`,
      {i: 0},
    );
    for (let i = 1; i < prices.length; i++) {
      const p = prices[i];
      add(
        'visit',
        [5],
        `第 ${i} 天：價格 ${p}`,
        `只看前一天 i − 1 = ${i - 1} 的三個狀態，推出今天的 buy、sell、rest。`,
        {i},
      );
      const buyCandidates = [
        {
          label: `buy[${i - 1}]`,
          expr: `${fmt(buy[i - 1])}`,
          value: buy[i - 1],
          from: 'buy',
          edge: 'buy-buy',
          meaning: '繼續持有',
        },
        {
          label: `rest[${i - 1}] − prices[${i}]`,
          expr: `${fmt(rest[i - 1])} − ${p}`,
          value: rest[i - 1] - p,
          from: 'rest',
          edge: 'rest-buy',
          meaning: '冷卻結束後買入',
        },
      ];
      const buyWin = pick(buyCandidates);
      buy.push(buyCandidates[buyWin].value);
      add(
        'buy',
        [6],
        `buy[${i}]：${buyCandidates[buyWin].meaning}`,
        '買入只能從 rest 出發，不能從 sell 直接買——這就是冷卻期。',
        {i, target: 'buy', candidates: buyCandidates, winner: buyWin},
      );
      const sellCandidates = [
        {
          label: `sell[${i - 1}]`,
          expr: `${fmt(sell[i - 1])}`,
          value: sell[i - 1],
          from: 'sell',
          edge: 'sell-sell',
          meaning: '保留之前的賣出收益',
        },
        {
          label: `buy[${i - 1}] + prices[${i}]`,
          expr: `${fmt(buy[i - 1])} + ${p}`,
          value: buy[i - 1] + p,
          from: 'buy',
          edge: 'buy-sell',
          meaning: '今天賣出手上的股票',
        },
      ];
      const sellWin = pick(sellCandidates);
      sell.push(sellCandidates[sellWin].value);
      add(
        'sell',
        [7],
        `sell[${i}]：${sellCandidates[sellWin].meaning}`,
        `注意用的是 buy[${i - 1}]（昨天持有），不是剛算好的 buy[${i}]。`,
        {i, target: 'sell', candidates: sellCandidates, winner: sellWin},
      );
      const restCandidates = [
        {
          label: `rest[${i - 1}]`,
          expr: `${fmt(rest[i - 1])}`,
          value: rest[i - 1],
          from: 'rest',
          edge: 'rest-rest',
          meaning: '繼續休息',
        },
        {
          label: `buy[${i - 1}]`,
          expr: `${fmt(buy[i - 1])}`,
          value: buy[i - 1],
          from: 'buy',
          edge: 'buy-rest',
          meaning: '取 buy[i − 1]（不會更大）',
        },
        {
          label: `sell[${i - 1}]`,
          expr: `${fmt(sell[i - 1])}`,
          value: sell[i - 1],
          from: 'sell',
          edge: 'sell-rest',
          meaning: '昨天賣出，今天冷卻',
        },
      ];
      const restWin = pick(restCandidates);
      rest.push(restCandidates[restWin].value);
      add(
        'rest',
        [8],
        `rest[${i}]：${restCandidates[restWin].meaning}`,
        'sell → rest 這條邊代表賣出後的強制冷卻；buy[i − 1] 永遠不超過 rest[i − 1]，所以不會勝出。',
        {i, target: 'rest', candidates: restCandidates, winner: restWin},
      );
    }
    add(
      'done',
      [10],
      '回傳最後一天的 sell',
      '最佳答案一定手上沒有股票；sell 不會小於 rest，所以 sell[-1] 就是最大利潤。',
      {i: prices.length - 1, answer: sell.at(-1)},
    );
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.cooldownTrace = trace;
})(globalThis);
