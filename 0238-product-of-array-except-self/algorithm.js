/* BigInt preserves Python integer arithmetic; snapshots are for playback only. */
(function (root) {
  function trace(nums) {
    if (!Array.isArray(nums) || nums.length < 2 || nums.length > 20 || nums.some(n => !Number.isInteger(n) || Math.abs(n) > 30))
      throw new Error('動畫支援 2–20 個介於 −30 至 30 的整數。');
    const values = nums.map(BigInt), arr = nums.map(() => 1n), frames = [];
    let prefix, postfix, leftEnd = 0, rightStart = nums.length - 1;
    function add(phase, line, title, note, expression, extra = {}) {
      frames.push({ phase, line, title, note, expression, prefix, postfix, leftEnd, rightStart, arr: [...arr], ...extra });
    }
    add('init', [3], '每一格從 1 開始', 'arr = [1] * len(nums)。1 是乘法的單位元素。', `arr = [${arr.join(', ')}]`);
    prefix = 1n;
    add('prefix', [4], '準備由左往右掃描', '最左邊沒有其他元素，左側乘積從 1 開始。', 'prefix = 1', { pass: 'left' });
    for (let i = 0; i < nums.length; i++) {
      const info = { pass: 'left', i };
      add('visit', [5], `第一趟：i = ${i}`, `prefix 只包含索引 ${i ? `0 到 ${i - 1}` : '0 左側的空範圍'}，尚未包含 nums[${i}]。`, `nums[${i}] = ${nums[i]}`, info);
      const before = arr[i]; arr[i] *= prefix;
      add('write', [6], '把左側乘積寫入 arr[i]', `arr[${i}] 現在等於自己左側所有元素的乘積。`, `${before} × ${prefix} = ${arr[i]}`, info);
      const oldPrefix = prefix; prefix *= values[i]; leftEnd = i + 1;
      add('accumulate', [7], '將目前元素乘入 prefix', '更新後的 prefix 提供給下一個索引；不會再乘回目前的 arr[i]。', `${oldPrefix} × (${nums[i]}) = ${prefix}`, info);
    }
    postfix = 1n;
    add('postfix', [9], '換方向：由右往左掃描', 'arr 已保存左側乘積。最右邊的右側是空範圍，postfix 從 1 開始。', 'postfix = 1', { pass: 'right' });
    for (let i = nums.length - 1; i >= 0; i--) {
      const info = { pass: 'right', i };
      add('visit', [10], `第二趟：i = ${i}`, `postfix 只包含索引 ${i === nums.length - 1 ? '最右側之外的空範圍' : `${i + 1} 到 ${nums.length - 1}`}，尚未包含 nums[${i}]。`, `nums[${i}] = ${nums[i]}`, info);
      const before = arr[i]; arr[i] *= postfix;
      add('write', [11], '左側乘積 × 右側乘積', `arr[${i}] = ${arr[i]}，這一格的答案完成，不含 nums[${i}]。`, `${before} × ${postfix} = ${arr[i]}`, info);
      const oldPostfix = postfix; postfix *= values[i]; rightStart = i - 1;
      add('accumulate', [12], '將目前元素乘入 postfix', '更新後的 postfix 提供給左邊下一個索引。', `${oldPostfix} × (${nums[i]}) = ${postfix}`, info);
    }
    add('done', [14], '所有位置的答案完成', '每一格都是除了自身以外所有元素的乘積。兩趟掃描，全程不使用除法。', 'return arr');
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.productTrace = trace;
})(globalThis);
