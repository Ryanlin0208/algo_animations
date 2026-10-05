const $ = id => document.getElementById(id);
const source = `class Solution:
    def carFleet(self, target: int, position: list[int], speed: list[int]) -> int:
        cars = sorted(zip(position, speed), reverse=True)
        fleets = 0
        previous_time = 0

        for pos, spd in cars:
            time = (target - pos) / spd

            if time > previous_time:
                fleets += 1
                previous_time = time

        return fleets`;
source.split('\n').forEach((text, i) => {
  const row = document.createElement('span'); row.className = text ? 'code-line' : 'code-line blank';
  const number = document.createElement('span'); number.className = 'line-number'; number.textContent = i + 1;
  row.append(number, document.createTextNode(text)); $('code').append(row);
});
let target, frames, step = 0, timer = null;
const format = value => value === undefined ? '—' : Number(value.toFixed(6)).toString();
function pause() { clearInterval(timer); timer = null; $('play').textContent = step === frames?.length - 1 ? '重新播放' : '播放動畫'; }
function render() {
  const f = frames[step];
  $('fleets').textContent = f.fleets; $('current').textContent = f.id ? `C${f.id}` : '—'; $('target').textContent = target;
  $('phase').textContent = { input: 'INPUT', sort: 'SORT', init: 'INITIALIZE', visit: 'NEXT CAR', time: 'ARRIVAL TIME', compare: 'COMPARE', new: 'NEW FLEET', update: 'UPDATE TIME', merge: 'MERGE', done: 'COMPLETE' }[f.phase];
  $('cars').replaceChildren();
  f.cars.forEach(car => {
    const card = document.createElement('div');
    card.className = `car-card${f.groups[car.id] ? ' assigned' : ''}${f.id === car.id ? ' current' : ''}`;
    const label = document.createElement('strong'); label.textContent = `C${car.id} · ${f.groups[car.id] ? 'F' + f.groups[car.id] : '待處理'}`;
    const pos = document.createElement('span'); pos.textContent = `pos ${car.pos}`;
    const spd = document.createElement('span'); spd.textContent = `spd ${car.spd}`;
    card.append(label, pos, spd); $('cars').append(card);
  });
  [...$('road').children].forEach(row => {
    const id = Number(row.dataset.id), vehicle = row.querySelector('.vehicle');
    vehicle.classList.toggle('assigned', !!f.groups[id]); vehicle.classList.toggle('current', f.id === id);
    row.querySelector('.fleet-label').textContent = f.groups[id] ? `F${f.groups[id]}` : '—';
  });
  $('time').textContent = format(f.time); $('previous').textContent = format(f.previous);
  $('operator').textContent = f.time === undefined ? '?' : f.time > f.previous ? '>' : f.time === f.previous ? '=' : '<';
  const car = f.cars.find(c => c.id === f.id);
  $('expression').textContent = f.time === undefined ? '尚未計算' : `(${target} − ${car.pos}) / ${car.spd}`;
  $('title').textContent = f.title; $('note').textContent = f.note;
  $('result').textContent = f.phase === 'done' ? `return ${f.fleets}` : '';
  $('step-label').textContent = `STEP ${String(step + 1).padStart(2, '0')}`;
  $('counter').textContent = `${step + 1} / ${frames.length}`; $('seek').value = step; $('seek').max = frames.length - 1;
  $('prev').disabled = step === 0; $('next').disabled = step === frames.length - 1;
  [...$('code').children].forEach((row, i) => row.classList.toggle('active', f.line.includes(i + 1)));
  if (step === frames.length - 1) pause(); else if (!timer) $('play').textContent = '播放動畫';
}
function parse(id) {
  const raw = $(id).value.trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!/^\d+(?:[\s,，]+\d+)*$/.test(raw)) throw new Error('位置與速度請使用逗號或空白分隔的非負整數。');
  return raw.split(/[\s,，]+/).map(Number);
}
function load() {
  pause();
  try {
    const nextTarget = Number($('target-input').value), nextFrames = carFleetTrace(nextTarget, parse('position'), parse('speeds'));
    target = nextTarget; frames = nextFrames; step = 0; $('error').textContent = ''; $('road').replaceChildren();
    frames[0].cars.forEach(car => {
      const row = document.createElement('div'); row.className = 'road-row'; row.dataset.id = car.id;
      const label = document.createElement('span'); label.className = 'car-label'; label.textContent = `C${car.id} · p=${car.pos}`;
      const track = document.createElement('div'); track.className = 'track';
      const vehicle = document.createElement('span'); vehicle.className = 'vehicle'; vehicle.textContent = `C${car.id}`;
      vehicle.style.setProperty('--position', `${3 + car.pos / target * 94}%`);
      track.append(vehicle); const fleet = document.createElement('span'); fleet.className = 'fleet-label';
      row.append(label, track, fleet); $('road').append(row);
    });
    render();
  } catch (error) { $('error').textContent = error.message; }
}
function play() {
  if (timer) return pause();
  if (step === frames.length - 1) { step = 0; render(); }
  $('play').textContent = '暫停';
  timer = setInterval(() => { step++; render(); }, Number($('speed').value));
}
$('inputs').addEventListener('submit', event => { event.preventDefault(); load(); });
$('play').onclick = play;
$('reset').onclick = () => { pause(); step = 0; render(); };
$('prev').onclick = () => { pause(); step = Math.max(0, step - 1); render(); };
$('next').onclick = () => { pause(); step = Math.min(frames.length - 1, step + 1); render(); };
$('seek').oninput = () => { pause(); step = Number($('seek').value); render(); };
$('speed').onchange = () => { if (timer) { pause(); play(); } };
const examples = { classic: [12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]], tie: [10, [8, 4], [1, 3]], separate: [12, [9, 6, 3], [1, 1, 1]], merge: [10, [6, 4, 2], [1, 2, 4]] };
document.querySelectorAll('[data-example]').forEach(button => button.onclick = () => {
  const [t, positions, speeds] = examples[button.dataset.example];
  $('target-input').value = t; $('position').value = positions.join(', '); $('speeds').value = speeds.join(', '); load();
});
load();
