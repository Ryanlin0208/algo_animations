/* Shared by the animation and the dependency-free Node check. */
(function (root) {
  function trace(target, position, speed) {
    if (!Number.isSafeInteger(target) || target < 1 || target > 1000000 ||
        !Array.isArray(position) || !Array.isArray(speed) || !position.length || position.length > 20 || position.length !== speed.length ||
        new Set(position).size !== position.length || position.some(p => !Number.isSafeInteger(p) || p < 0 || p >= target) ||
        speed.some(s => !Number.isSafeInteger(s) || s < 1 || s > 1000000))
      throw new Error('請輸入 1–20 台車，位置與速度數量相同；位置須不重複且 0 ≤ position < target。target 與速度須為 1–1,000,000 的整數。');
    const original = position.map((pos, i) => ({ pos, spd: speed[i], id: i + 1 }));
    const cars = [...original].sort((a, b) => b.pos - a.pos);
    let fleets = 0, previous = 0;
    const groups = {}, frames = [];
    function add(phase, line, title, note, extra = {}) {
      frames.push({ phase, line, title, note, fleets, previous, groups: { ...groups }, cars, ...extra });
    }
    add('input', [2], '先把位置與速度配對', 'C1、C2… 對應原始輸入順序；同一索引的位置與速度屬於同一台車。', { cars: original });
    add('sort', [3], '依位置由大到小排序', '從離終點最近的車開始，逐一往後掃描。排序時保留每台車的位置與速度配對。');
    add('init', [4, 5], '初始化車隊數與前方時間', 'fleets = 0，previous_time = 0。第一台車的抵達時間一定大於 0。');
    cars.forEach((car, i) => {
      const time = (target - car.pos) / car.spd;
      const current = { id: car.id, index: i };
      add('visit', [7], `查看 C${car.id}`, `pos = ${car.pos}，spd = ${car.spd}。`, current);
      add('time', [8], '計算不受前車影響的抵達時間', `time = (${target} − ${car.pos}) / ${car.spd} = ${Number(time.toFixed(6))}。`, { ...current, time });
      const creates = time > previous;
      add('compare', [10], creates ? '比前方車隊晚抵達，追不上' : time === previous ? '恰好在終點相遇，也算同一隊' : '會追上前方車隊', `time > previous_time 為 ${creates ? 'True：新增車隊。' : 'False：合併，保持前方車隊抵達時間。'}`, { ...current, time });
      if (creates) {
        fleets++;
        groups[car.id] = fleets;
        add('new', [11], `新增第 ${fleets} 個車隊`, `fleets += 1，目前有 ${fleets} 個車隊。接著更新 previous_time。`, { ...current, time });
        previous = time;
        add('update', [12], '記住新車隊的抵達時間', `previous_time = ${Number(time.toFixed(6))}，供後方車輛比較。`, { ...current, time });
      } else {
        groups[car.id] = fleets;
        add('merge', [10], `C${car.id} 併入 F${fleets}`, '不執行 if 區塊；fleets 與 previous_time 都不變。後車追上後，必須跟著前方車隊抵達。', { ...current, time });
      }
    });
    add('done', [14], `共有 ${fleets} 個車隊抵達終點`, '所有車輛都已處理，回傳 fleets。相同 F 編號的車屬於同一車隊。');
    return frames;
  }
  if (typeof module !== 'undefined') module.exports = trace;
  else root.carFleetTrace = trace;
})(globalThis);
