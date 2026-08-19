(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const monsters = [
    { face: '🧛', name: 'Count Byteula', demand: 'Refuses to sit with anyone wearing garlic deodorant.' },
    { face: '🧟', name: 'Zed', demand: 'Will discuss brains, loudly, through every course.' },
    { face: '🐺', name: 'Howlbert', demand: 'Needs a window seat. The moon is his emotional support lamp.' },
    { face: '👻', name: 'Boo Radley', demand: 'Insists every chair is technically already occupied.' },
    { face: '🤖', name: 'R0-BERT', demand: 'Cannot sit near soup. Warranty reasons.' },
    { face: '🧌', name: 'Trollivia', demand: 'Asks a riddle before passing the potatoes.' },
    { face: '🦹', name: 'Dr. Awkward', demand: 'Only speaks in palindromes. Tacos? Never.' }
  ];

  const bipartiteFeuds = [[0,1],[0,3],[2,1],[2,5],[4,3],[4,5],[6,1]];
  const puzzleFeuds = [[0,1],[1,2],[2,0],[2,3],[3,4],[4,5],[5,2],[1,6],[5,6]];
  const positions = [
    { x: 17, y: 22 }, { x: 50, y: 14 }, { x: 80, y: 27 },
    { x: 75, y: 69 }, { x: 48, y: 84 }, { x: 16, y: 72 }, { x: 47, y: 49 }
  ];
  const colors = ['#f2509d', '#c6ff4a', '#6ce5ff', '#ffb86b'];

  function rosterHTML(kind) {
    return monsters.map((monster, i) => `<button class="monster-card" data-${kind}="${i}"><span class="face">${monster.face}</span><strong>${monster.name}</strong><small>${kind === 'seat' ? 'LOBBY' : `GUEST ${i + 1}`}</small></button>`).join('');
  }

  $('#introRoster').innerHTML = rosterHTML('intro');
  $('#seatingRoster').innerHTML = rosterHTML('seat');

  function key(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }
  function edgeSet(edges) { return new Set(edges.map(([a,b]) => key(a,b))); }

  function conflictsFor(edges, assignments) {
    return edges.filter(([a,b]) => assignments[a] != null && assignments[a] === assignments[b]);
  }

  function ringBell() {
    const bell = $('#dinnerBell');
    bell.classList.remove('ringing');
    void bell.offsetWidth;
    bell.classList.add('ringing');
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(920, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(430, audio.currentTime + .45);
      gain.gain.setValueAtTime(.12, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .48);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + .5);
    } catch (_) { /* The visual bell still works when audio is unavailable. */ }
  }

  const seats = Array(monsters.length).fill(null);
  function renderSeating(wasMoved = false) {
    const conflictEdges = conflictsFor(bipartiteFeuds, seats);
    const bad = new Set(conflictEdges.flat());
    $$('#seatingRoster [data-seat]').forEach(card => {
      const i = Number(card.dataset.seat);
      card.querySelector('small').textContent = seats[i] == null ? 'LOBBY' : `TABLE ${seats[i]}`;
      card.classList.toggle('selected', seats[i] != null);
    });
    ['A','B'].forEach(tableName => {
      const table = $(`#table${tableName}`);
      table.innerHTML = `<h3>TABLE ${tableName}</h3>` + monsters.map((monster, i) => seats[i] === tableName ? `<div class="seat filled ${bad.has(i) ? 'violation' : ''}" title="${monster.name}">${monster.face}</div>` : '').join('');
    });
    if (conflictEdges.length) {
      $('#seatingStatus').textContent = `${conflictEdges.length} feud${conflictEdges.length > 1 ? 's' : ''} at dinner!`;
      if (wasMoved) ringBell();
    } else if (seats.every(Boolean)) {
      $('#seatingStatus').textContent = 'A peaceful dinner. Suspiciously excellent.';
    } else {
      $('#seatingStatus').textContent = `${seats.filter(Boolean).length} seated · ${seats.filter(x => !x).length} glaring from the lobby`;
    }
  }

  function renderGraph(container, edges, options = {}) {
    const assignments = options.assignments || [];
    const conflictKeys = edgeSet(conflictsFor(edges, assignments));
    const selected = options.selected == null ? -1 : options.selected;
    const lineHtml = edges.map(([a,b]) => `<line class="graph-edge ${conflictKeys.has(key(a,b)) ? 'active' : ''}" x1="${positions[a].x}%" y1="${positions[a].y}%" x2="${positions[b].x}%" y2="${positions[b].y}%"></line>`).join('');
    const nodeCount = options.nodeCount || 7;
    const nodeHtml = monsters.slice(0, nodeCount).map((monster, i) => {
      const value = assignments[i];
      const conflict = edges.some(([a,b]) => (a === i || b === i) && conflictKeys.has(key(a,b)));
      const color = value == null || value < 0 ? 'var(--card)' : colors[value];
      return `<button class="graph-node ${conflict ? 'conflict' : ''} ${selected === i ? 'pick' : ''}" data-node="${i}" style="left:${positions[i].x}%;top:${positions[i].y}%;--node-color:${color}" title="${monster.name}">${monster.face}</button>`;
    }).join('');
    container.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lineHtml}</svg>${nodeHtml}`;
  }

  renderGraph($('#mapGraph'), bipartiteFeuds);

  const colorAssignments = Array(7).fill(-1);
  function renderColorGraph() { renderGraph($('#colorGraph'), puzzleFeuds, { assignments: colorAssignments }); }
  function checkColorGraph() {
    const missing = colorAssignments.some(value => value < 0);
    const conflicts = conflictsFor(puzzleFeuds, colorAssignments);
    const used = new Set(colorAssignments.filter(value => value >= 0)).size;
    $('#colorStatus').textContent = missing ? 'Some guests are still haunting the lobby.' : conflicts.length ? `${conflicts.length} feud${conflicts.length > 1 ? 's' : ''} still share a table.` : `${used} tables. Valid plan! Can you use fewer?`;
    renderColorGraph();
  }

  const sabotageBase = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]];
  let sabotageEdges = sabotageBase.map(edge => [...edge]);
  let sabotagePick = -1;
  function renderSabotage() { renderGraph($('#sabotageGraph'), sabotageEdges, { selected: sabotagePick, nodeCount: 6 }); }

  let builderEdges = [];
  let builderPick = -1;
  function renderBuilder() { renderGraph($('#builderGraph'), builderEdges, { selected: builderPick, nodeCount: 5 }); }

  function isBipartite(nodeCount, edges) {
    const adjacency = Array.from({ length: nodeCount }, () => []);
    edges.forEach(([a,b]) => { adjacency[a].push(b); adjacency[b].push(a); });
    const assignment = Array(nodeCount).fill(-1);
    for (let start = 0; start < nodeCount; start += 1) {
      if (assignment[start] >= 0) continue;
      assignment[start] = 0;
      const queue = [start];
      while (queue.length) {
        const current = queue.shift();
        for (const next of adjacency[current]) {
          if (assignment[next] < 0) { assignment[next] = 1 - assignment[current]; queue.push(next); }
          else if (assignment[next] === assignment[current]) return false;
        }
      }
    }
    return true;
  }

  function toggleEdge(edges, a, b) {
    const target = key(a,b);
    const index = edges.findIndex(([x,y]) => key(x,y) === target);
    if (index >= 0) edges.splice(index, 1);
    else edges.push([a,b]);
  }

  let triangleStep = 0;
  function triangleTry() {
    const nodes = $$('[data-triangle]');
    nodes.forEach((node, i) => { node.style.background = colors[i % 2]; node.style.color = '#170f2f'; });
    nodes[2].style.outline = '.45rem solid var(--bad)';
    $('#triangleStatus').textContent = 'The third monster matches an enemy either way.';
  }
  function triangleThird() {
    const nodes = $$('[data-triangle]');
    nodes.forEach((node, i) => { node.style.background = colors[i]; node.style.color = '#170f2f'; node.style.outline = 'none'; });
    $('#triangleStatus').textContent = 'Three enemies need three tables. Case closed.';
    triangleStep += 1;
  }

  const scheduleCourses = ['Math', 'Art', 'Music', 'Drama', 'Robotics'];
  const scheduleConflicts = [[0,1],[1,2],[2,0],[0,3],[3,4]];
  const schedule = Array(scheduleCourses.length).fill(0);
  function renderSchedule() {
    const grid = $('#scheduleGrid');
    grid.innerHTML = '<strong>COURSE</strong><strong>1</strong><strong>2</strong><strong>3</strong>' + scheduleCourses.map((course, i) => `<strong>${course}</strong>${[1,2,3].map(period => `<button class="schedule-course ${schedule[i] === period ? `period-${period}` : ''}" data-course="${i}" data-period="${period}">${schedule[i] === period ? '●' : ''}</button>`).join('')}`).join('');
  }

  const hints = ['Try alternating two labels along every feud.', 'Pick one monster. Their enemies must all use the other table.', 'A loop with an odd number of feuds behaves strangely.'];
  let hint = 0;

  document.addEventListener('click', event => {
    const intro = event.target.closest('[data-intro]');
    if (intro) {
      const i = Number(intro.dataset.intro);
      $$('#introRoster .monster-card').forEach(card => card.classList.toggle('selected', card === intro));
      $('#monsterDemand').textContent = `“${monsters[i].demand}”`;
    }

    const seat = event.target.closest('[data-seat]');
    if (seat) {
      const i = Number(seat.dataset.seat);
      seats[i] = seats[i] == null ? 'A' : seats[i] === 'A' ? 'B' : null;
      renderSeating(true);
    }

    const colorNode = event.target.closest('#colorGraph [data-node]');
    if (colorNode) {
      const i = Number(colorNode.dataset.node);
      colorAssignments[i] = (colorAssignments[i] + 1) % 4;
      renderColorGraph();
      $('#colorStatus').textContent = 'Keep every connected pair different.';
    }

    const sabotageNode = event.target.closest('#sabotageGraph [data-node]');
    if (sabotageNode) {
      const i = Number(sabotageNode.dataset.node);
      if (sabotagePick < 0) sabotagePick = i;
      else if (sabotagePick === i) sabotagePick = -1;
      else { toggleEdge(sabotageEdges, sabotagePick, i); sabotagePick = -1; $('#sabotageStatus').textContent = 'The gossip has been updated.'; }
      renderSabotage();
    }

    const builderNode = event.target.closest('#builderGraph [data-node]');
    if (builderNode) {
      const i = Number(builderNode.dataset.node);
      if (builderPick < 0) builderPick = i;
      else if (builderPick === i) builderPick = -1;
      else { toggleEdge(builderEdges, builderPick, i); builderPick = -1; $('#builderStatus').textContent = `${builderEdges.length} feud${builderEdges.length === 1 ? '' : 's'} and counting.`; }
      renderBuilder();
    }

    const scheduleCell = event.target.closest('[data-course][data-period]');
    if (scheduleCell) {
      schedule[Number(scheduleCell.dataset.course)] = Number(scheduleCell.dataset.period);
      renderSchedule();
    }

    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'seating-reset') { seats.fill(null); renderSeating(); }
    if (action === 'monster-hint') { $('#monsterHint').textContent = hints[hint % hints.length]; hint += 1; }
    if (action === 'triangle-color') triangleTry();
    if (action === 'triangle-third') triangleThird();
    if (action === 'color-reset') { colorAssignments.fill(-1); renderColorGraph(); $('#colorStatus').textContent = 'Click dots to change tables.'; }
    if (action === 'color-check') checkColorGraph();
    if (action === 'sabotage-reset') { sabotageEdges = sabotageBase.map(edge => [...edge]); sabotagePick = -1; renderSabotage(); $('#sabotageStatus').textContent = 'Choose your enemies wisely.'; }
    if (action === 'sabotage-test') $('#sabotageStatus').textContent = isBipartite(6, sabotageEdges) ? 'Two tables still work. Your sabotage was adorable.' : 'Success! Two tables are now impossible.';
    if (action === 'court') $('#courtStatus').textContent = button.dataset.court === '1' ? 'Sustained! That explains why every attempt must fail.' : button.dataset.court === '0' ? 'Overruled. Failed attempts are evidence, not proof.' : 'True, but mathematically irrelevant.';
    if (action === 'builder-clear') { builderEdges = []; builderPick = -1; renderBuilder(); $('#builderStatus').textContent = 'A blank social calendar. For now.'; }
    if (action === 'builder-test') $('#builderStatus').textContent = builderEdges.length < 3 ? 'Not enough drama yet.' : isBipartite(5, builderEdges) ? 'Two tables can still survive this.' : 'Certified impossible with two tables!';
    if (action === 'schedule-reset') { schedule.fill(0); renderSchedule(); $('#scheduleStatus').textContent = 'Click each course to choose a period.'; }
    if (action === 'schedule-check') {
      const missing = schedule.some(value => !value);
      const conflicts = scheduleConflicts.filter(([a,b]) => schedule[a] && schedule[a] === schedule[b]);
      $('#scheduleStatus').textContent = missing ? 'Some courses are floating outside time.' : conflicts.length ? `${conflicts.length} student conflict${conflicts.length > 1 ? 's' : ''}. The principal is calling.` : 'Schedule approved. Nobody must clone themselves.';
    }
  });

  renderSeating();
  renderColorGraph();
  renderSabotage();
  renderBuilder();
  renderSchedule();
})();
