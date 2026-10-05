/* Shared by the animation and the dependency-free Node check. */
(function (root) {
  function trace(arr, k, x) {
    if (!Array.isArray(arr) || !arr.length || arr.length > 40 ||
        arr.some((v, i) => !Number.isSafeInteger(v) || Math.abs(v) > 1000000 || (i && v < arr[i - 1])) ||
        !Number.isInteger(k) || k < 1 || k > arr.length || !Number.isSafeInteger(x) || Math.abs(x) > 1000000)
      throw new Error('請輸入 1–40 個由小到大排列的整數，1 ≤ k ≤ 陣列長度；數值須介於 ±1,000,000。');
    let left = 0, right = arr.length - k;
    const frames = [{ left, right, line: [3, 4], phase: 'init', title: '先決定視窗起點的搜尋範圍', note: `長度為 ${k} 的視窗，起點只能在索引 0 到 ${right} 之間。` }];
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const a = x - arr[mid], b = arr[mid + k] - x;
      frames.push({ left, right, mid, a, b, line: [6, 7], phase: 'mid', title: '取中間起點，框出 k 個元素', note: `mid = floor((${left} + ${right}) / 2) = ${mid}。比較目前視窗與向右一格的視窗。` });
      const move = a > b;
      frames.push({ left, right, mid, a, b, line: [9], phase: 'compare', title: move ? '右側更有利，往右找' : a === b ? '兩側相等，保留較小的數' : '左側更有利，保留 mid', note: `${a} > ${b} 為 ${move ? 'True' : 'False'}。${move ? `arr[mid] = ${arr[mid]} 可以捨去。` : a === b ? '距離相同時優先選較小值，因此不向右移。' : '最佳起點可能是 mid，也可能在它左側。'}` });
      if (move) left = mid + 1; else right = mid;
      frames.push({ left, right, mid, a, b, line: move ? [10] : [11, 12], phase: 'update', title: move ? `left 移到 ${left}` : `right 移到 ${right}`, note: `剩餘可能起點：${left === right ? left : `${left}–${right}`}。${left === right ? '兩個邊界相遇，搜尋結束。' : '繼續二分搜尋。'}` });
    }
    frames.push({ left, right, line: [14], phase: 'done', title: '找到最接近 x 的 k 個元素', note: `回傳 arr[${left}:${left + k}]，結果保持遞增排序。` });
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.closestTrace = trace;
})(globalThis);
