/* Snapshots and matching start indices are for playback, not part of the Python algorithm. */
(function (root) {
  function trace(nums, k) {
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > 30 || nums.some(n => !Number.isSafeInteger(n) || Math.abs(n) > 1000000) || !Number.isSafeInteger(k) || Math.abs(k) > 1000000)
      throw new Error('請輸入 1–30 個整數；nums 與 k 須介於 ±1,000,000。');
    const counts = new Map([[0, 1]]), boundaries = new Map([[0, [0]]]), frames = [];
    let prefix = 0, ans = 0, accumulated = -1;
    function add(phase, line, title, note, extra = {}) {
      frames.push({ phase, line, title, note, prefix, ans, accumulated, counts: [...counts], ...extra });
    }
    add('seed', [3], '先放入空前綴 0', 'prefix_count = {0: 1}。陣列開始前的總和為 0，已出現一次。');
    add('init', [5], '初始化累積和與答案', 'prefix = 0，ans = 0。接著由左到右讀取每個 num。');
    nums.forEach((num, index) => {
      add('visit', [7], `讀取 nums[${index}] = ${num}`, '先讀取元素，下一步才將它加入 prefix。', { index });
      const before = prefix; prefix += num; accumulated = index;
      add('sum', [8], '更新目前前綴和', `prefix = ${before} + (${num}) = ${prefix}。`, { index });
      const needed = prefix - k, hits = counts.get(needed) || 0, starts = [...(boundaries.get(needed) || [])];
      const info = { index, needed, hits, starts };
      add('lookup', [10], hits ? `找到 ${hits} 個先前的前綴和` : '表中沒有需要的前綴和', `尋找 ${prefix} − (${k}) = ${needed}。${hits ? `已出現 ${hits} 次，每一次對應一個不同起點。` : '條件為 False，跳過 ans 的更新。'}`, info);
      if (hits) {
        const beforeAns = ans; ans += hits;
        add('add', [11], `答案增加 ${hits}`, `ans = ${beforeAns} + ${hits} = ${ans}。這些子陣列都以索引 ${index} 結尾。`, info);
      }
      counts.set(prefix, (counts.get(prefix) || 0) + 1);
      if (!boundaries.has(prefix)) boundaries.set(prefix, []);
      boundaries.get(prefix).push(index + 1);
      add('update', [13], '最後才記錄目前前綴和', `prefix_count[${prefix}] = ${counts.get(prefix)}。供後續元素查詢；本輪查詢次數仍為 ${hits}，不包含剛寫入的這次。`, info);
    });
    add('done', [15], `找到 ${ans} 個符合的子陣列`, '所有元素處理完畢，回傳 ans。子陣列必須連續且非空。');
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.subarrayTrace = trace;
})(globalThis);
