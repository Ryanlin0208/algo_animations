/* Node identities are original 1-based positions; 0 is dummy, null is None. */
(function (root) {
  function trace(nums, left, right) {
    if (!Array.isArray(nums) || nums.length < 1 || nums.length > 12 || nums.some(n => !Number.isInteger(n) || Math.abs(n) > 999) || !Number.isInteger(left) || !Number.isInteger(right) || left < 1 || left > right || right > nums.length)
      throw new Error('請輸入 1–12 個介於 −999 至 999 的整數，且 1 ≤ left ≤ right ≤ 節點數。');
    const next = Array.from({length: nums.length + 1}, (_, i) => i === nums.length ? null : i + 1), frames = [];
    let cnt_head, cur, prev, tmp;
    const name = id => id === null ? 'None' : id === 0 ? 'dummy' : `N${id}`;
    function add(phase, line, title, note, expression, changed) {
      frames.push({phase, line, title, note, expression, changed, head: 1, cnt_head, cur, prev, tmp, next: [...next]});
    }
    add('dummy', [8], '建立 dummy 節點', 'dummy.next 指向原始 head，讓從第一個節點開始反轉也能使用相同流程。', 'dummy = ListNode(0, head)');
    cnt_head = 0;
    add('locate', [9], '從 dummy 開始定位', `cnt_head 接下來向前移動 ${left - 1} 次。`, 'cnt_head = dummy');
    for (let i = 0; i < left - 1; i++) {
      cnt_head = next[cnt_head];
      add('locate', [10,11], `定位第 ${i + 1} 步`, 'cnt_head 最後停在反轉區間前一個節點。', `cnt_head = ${name(cnt_head)}`);
    }
    cur = next[cnt_head];
    add('init', [13], 'cur 指向區間第一個節點', 'cnt_head 在反轉過程中保持不動。', `cur = ${name(cur)}`);
    prev = null;
    add('init', [14], 'prev 從 None 開始', '第一個反轉節點的 next 將先改為 None，稍後再接回右側。', 'prev = None');
    for (let i = 0; i < right - left + 1; i++) {
      add('loop', [15], `反轉第 ${i + 1} / ${right - left + 1} 個節點`, `目前處理 ${name(cur)}。`, `cur = ${name(cur)}`);
      tmp = next[cur];
      add('save', [16], '先保存原本的下一個節點', '改寫 next 之前，用 tmp 保留尚未處理部分的入口。', `tmp = ${name(tmp)}`);
      next[cur] = prev;
      add('reverse', [17], '反轉目前節點的 next', '橘色箭頭是這一步實際改寫的連結；其餘 next 不變。', `${name(cur)}.next = ${name(prev)}`, cur);
      prev = cur;
      add('prev', [18], 'prev 移到剛反轉的節點', 'prev 指向已反轉部分的新頭。', `prev = ${name(prev)}`);
      cur = tmp;
      add('cur', [19], 'cur 移向原本的下一個節點', '從 tmp 繼續走，不會沿著剛剛反轉的 next 走回去。', `cur = ${name(cur)}`);
    }
    const tail = next[cnt_head]; next[tail] = cur;
    add('tail', [21], '先把反轉後的尾端接回右側', `cnt_head.next 仍是 ${name(tail)}，也就是原區間第一個節點。改寫它的 next，接到 ${name(cur)}。`, `${name(tail)}.next = ${name(cur)}`, tail);
    next[cnt_head] = prev;
    add('head', [22], '再把左側接到反轉後的新頭', `將 ${name(cnt_head)} 的 next 接到 ${name(prev)}，整條串列重新連通。`, `${name(cnt_head)}.next = ${name(prev)}`, cnt_head);
    add('done', [24], '回傳新的串列頭', '沿 dummy.next 即可走訪完整結果；dummy 本身不包含在回傳串列中。', `return ${name(next[0])}`);
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.reverseTrace = trace;
})(globalThis);
