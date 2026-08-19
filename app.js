(() => {
  "use strict";

  const slides = [...document.querySelectorAll(".slide")];
  const total = slides.length;
  let current = Math.max(0, Math.min(total - 1, Number(location.hash.replace("#", "")) - 1 || 0));
  let touchStartX = 0;

  const chapterLabel = document.getElementById("chapterLabel");
  const slideNumber = document.getElementById("slideNumber");
  const slideTotal = document.getElementById("slideTotal");
  const progressBar = document.getElementById("progressBar");
  const notesPanel = document.getElementById("notesPanel");
  const notesText = document.getElementById("notesText");
  const displayPanel = document.getElementById("displayPanel");
  const visualDensity = document.getElementById("visualDensity");
  const visualDensityValue = document.getElementById("visualDensityValue");
  const projectorToggle = document.getElementById("projectorToggle");
  const themeColorMeta = document.querySelector("meta[name='theme-color']");

  slideTotal.textContent = String(total).padStart(2, "0");

  function showSlide(index) {
    current = Math.max(0, Math.min(total - 1, index));
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === current);
      slide.classList.toggle("was-active", i < current);
      slide.setAttribute("aria-hidden", i === current ? "false" : "true");
    });
    chapterLabel.textContent = slides[current].dataset.chapter || "GLITCH";
    slideNumber.textContent = String(current + 1).padStart(2, "0");
    progressBar.style.width = `${((current + 1) / total) * 100}%`;
    notesText.textContent = slides[current].dataset.notes || "";
    history.replaceState(null, "", `#${current + 1}`);
  }

  function nextSlide() { showSlide(current + 1); }
  function previousSlide() { showSlide(current - 1); }

  function toggleNotes() {
    notesPanel.hidden = !notesPanel.hidden;
    if (!notesPanel.hidden) notesText.textContent = slides[current].dataset.notes || "";
  }

  function toggleDisplayPanel(force) {
    const shouldOpen = typeof force === "boolean" ? force : displayPanel.hidden;
    displayPanel.hidden = !shouldOpen;
    document.querySelectorAll("[data-action='toggle-display-panel']").forEach((button) => {
      button.setAttribute("aria-expanded", String(shouldOpen));
    });
  }

  function setVisualDensity(value) {
    const normalized = Math.max(0, Math.min(2, Number(value)));
    const labels = ["Fewer", "Current", "More"];
    document.body.dataset.visuals = String(normalized);
    visualDensity.value = String(normalized);
    visualDensityValue.textContent = labels[normalized];
  }

  function setProjectorMode(enabled) {
    document.body.classList.toggle("projector-mode", enabled);
    projectorToggle.setAttribute("aria-pressed", String(enabled));
    projectorToggle.querySelector("span").textContent = enabled ? "Restore dark colors" : "Flip colors for projector";
    themeColorMeta.setAttribute("content", enabled ? "#f4f7fd" : "#050816");
  }

  function resetDisplay() {
    setVisualDensity(1);
    setProjectorMode(false);
  }

  visualDensity.addEventListener("input", () => setVisualDensity(visualDensity.value));

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      // Fullscreen can be blocked by the host; the deck remains fully usable.
    }
  }

  document.addEventListener("keydown", (event) => {
    const editing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
    if (editing) {
      if (event.key === "Escape") event.target.blur();
      return;
    }
    if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); nextSlide(); }
    if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); previousSlide(); }
    if (event.key === "Home") showSlide(0);
    if (event.key === "End") showSlide(total - 1);
    if (event.key.toLowerCase() === "n") toggleNotes();
    if (event.key.toLowerCase() === "f") toggleFullscreen();
    if (event.key.toLowerCase() === "d") toggleDisplayPanel();
    if (event.key.toLowerCase() === "c") setProjectorMode(!document.body.classList.contains("projector-mode"));
  });

  document.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", (event) => {
    const dx = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 70) dx < 0 ? nextSlide() : previousSlide();
  }, { passive: true });

  // Opening transmission animation.
  const openingBits = [...document.querySelectorAll("#openingChannel span")];
  let openingGlitch = 3;
  setInterval(() => {
    openingBits[openingGlitch]?.classList.remove("glitched");
    openingGlitch = Math.floor(Math.random() * openingBits.length);
    const bit = openingBits[openingGlitch];
    if (!bit) return;
    bit.textContent = bit.textContent === "1" ? "0" : "1";
    bit.classList.add("glitched");
  }, 1700);

  // Generic activity timers.
  const timerState = new Map();
  document.querySelectorAll(".mission-timer").forEach((element) => {
    timerState.set(element.id, { remaining: Number(element.dataset.duration), running: false, interval: null });
  });

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function renderTimer(id) {
    const state = timerState.get(id);
    const element = document.getElementById(id);
    if (!state || !element) return;
    element.textContent = formatTime(state.remaining);
    element.classList.toggle("running", state.running);
    element.classList.toggle("expired", state.remaining === 0);
  }

  function timerToggle(id) {
    const state = timerState.get(id);
    if (!state) return;
    if (state.remaining === 0) state.remaining = Number(document.getElementById(id).dataset.duration);
    state.running = !state.running;
    clearInterval(state.interval);
    if (state.running) {
      state.interval = setInterval(() => {
        state.remaining -= 1;
        if (state.remaining <= 0) {
          state.remaining = 0;
          state.running = false;
          clearInterval(state.interval);
        }
        renderTimer(id);
      }, 1000);
    }
    renderTimer(id);
  }

  function timerReset(id) {
    const state = timerState.get(id);
    if (!state) return;
    clearInterval(state.interval);
    state.remaining = Number(document.getElementById(id).dataset.duration);
    state.running = false;
    renderTimer(id);
  }

  // Grid mathematics.
  function randomBits(count) { return Array.from({ length: count }, () => Math.random() < 0.5 ? 0 : 1); }

  function addEvenChecks(core) {
    const values = Array(36).fill(0);
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) values[row * 6 + col] = core[row * 5 + col];
      const rowSum = core.slice(row * 5, row * 5 + 5).reduce((a, b) => a + b, 0);
      values[row * 6 + 5] = rowSum % 2;
    }
    for (let col = 0; col < 5; col += 1) {
      let columnSum = 0;
      for (let row = 0; row < 5; row += 1) columnSum += core[row * 5 + col];
      values[5 * 6 + col] = columnSum % 2;
    }
    const lastColumnSum = [0, 1, 2, 3, 4].reduce((sum, row) => sum + values[row * 6 + 5], 0);
    values[35] = lastColumnSum % 2;
    return values;
  }

  function oddLines(values) {
    const rows = [];
    const cols = [];
    for (let row = 0; row < 6; row += 1) {
      let sum = 0;
      for (let col = 0; col < 6; col += 1) sum += values[row * 6 + col];
      if (sum % 2) rows.push(row);
    }
    for (let col = 0; col < 6; col += 1) {
      let sum = 0;
      for (let row = 0; row < 6; row += 1) sum += values[row * 6 + col];
      if (sum % 2) cols.push(col);
    }
    return { rows, cols };
  }

  function renderGrid(element, values, options = {}) {
    element.innerHTML = "";
    values.forEach((value, index) => {
      const row = Math.floor(index / 6);
      const col = index % 6;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "grid-cell";
      button.classList.toggle("black", Boolean(value));
      button.classList.toggle("core", row < 5 && col < 5);
      button.classList.toggle("check", row === 5 || col === 5);
      button.classList.toggle("hidden-check", !options.borderVisible && (row === 5 || col === 5));
      button.classList.toggle("selected", options.selected === index);
      button.classList.toggle("culprit", options.culprit === index);
      button.classList.toggle("candidate", options.candidates?.has(index));
      button.classList.toggle("suspect-row", options.rows?.includes(row));
      button.classList.toggle("suspect-col", options.cols?.includes(col));
      button.dataset.index = String(index);
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `row ${row + 1}, column ${col + 1}, ${value ? "black" : "white"}`);
      if (typeof options.onClick === "function") button.addEventListener("click", () => options.onClick(index, button));
      element.appendChild(button);
    });
  }

  // Mind-reading grid.
  const parityGrid = document.getElementById("parityGrid");
  const parityStatus = document.getElementById("parityStatus");
  const parityState = { values: addEvenChecks(randomBits(25)), borderVisible: false, flipped: null, revealed: false };

  function drawParity() {
    const lines = parityState.revealed ? oddLines(parityState.values) : { rows: [], cols: [] };
    const culprit = lines.rows.length === 1 && lines.cols.length === 1 ? lines.rows[0] * 6 + lines.cols[0] : null;
    renderGrid(parityGrid, parityState.values, {
      borderVisible: parityState.borderVisible,
      rows: lines.rows,
      cols: lines.cols,
      culprit,
      onClick: (index, button) => {
        const row = Math.floor(index / 6);
        const col = index % 6;

        if (!parityState.borderVisible) {
          if (row >= 5 || col >= 5) return;
          parityState.values[index] = 1 - parityState.values[index];
          button.classList.add("flipped");
          parityStatus.textContent = "Custom pattern updated. Keep flipping cards—or add the decoration when you are ready.";
          setTimeout(drawParity, 220);
          return;
        }

        if (parityState.flipped !== null) return;
        parityState.values[index] = 1 - parityState.values[index];
        parityState.flipped = index;
        button.classList.add("flipped");
        parityStatus.textContent = "Sabotage complete. I can turn around now.";
        setTimeout(drawParity, 220);
      }
    });
  }

  function parityRandomize() {
    parityState.values = addEvenChecks(randomBits(25));
    parityState.borderVisible = false;
    parityState.flipped = null;
    parityState.revealed = false;
    parityStatus.textContent = "A new 5 × 5 pattern is ready. You can still flip any core cards before step 2.";
    drawParity();
  }

  function parityBorder() {
    if (parityState.borderVisible) {
      parityStatus.textContent = parityState.flipped === null
        ? "The decoration is already in place. Now flip exactly one square."
        : "The decoration is locked. Reveal the sabotaged square with step 3.";
      return;
    }

    const core = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) core.push(parityState.values[row * 6 + col]);
    }
    parityState.values = addEvenChecks(core);
    parityState.borderVisible = true;
    parityState.flipped = null;
    parityState.revealed = false;
    parityStatus.textContent = "Border added. Click exactly one square while I look away.";
    drawParity();
  }

  function parityReveal() {
    if (!parityState.borderVisible) {
      parityStatus.textContent = "Add the mysterious border first.";
      return;
    }
    parityState.revealed = true;
    const lines = oddLines(parityState.values);
    if (lines.rows.length === 1 && lines.cols.length === 1) {
      parityStatus.textContent = `Alarm: row ${lines.rows[0] + 1}, column ${lines.cols[0] + 1}. Their intersection was flipped.`;
    } else {
      parityStatus.textContent = "No single flip detected. The board is still balanced.";
    }
    drawParity();
  }

  // Alien transmission.
  const alienCore = [
    0, 1, 0, 1, 0,
    1, 1, 1, 1, 1,
    1, 0, 1, 0, 1,
    1, 1, 1, 1, 1,
    0, 1, 0, 1, 0
  ];
  const alienGrid = document.getElementById("alienGrid");
  const alienStatus = document.getElementById("alienStatus");
  const alienDecoded = document.getElementById("alienDecoded");
  const alienState = { original: addEvenChecks(alienCore), values: [], corrupt: 0, selected: null };

  function alienNew() {
    alienState.values = [...alienState.original];
    alienState.corrupt = Math.floor(Math.random() * 36);
    alienState.values[alienState.corrupt] = 1 - alienState.values[alienState.corrupt];
    alienState.selected = null;
    alienDecoded.hidden = true;
    alienStatus.textContent = "Find the line checks that have changed.";
    drawAlien();
  }

  function drawAlien() {
    renderGrid(alienGrid, alienState.values, {
      borderVisible: true,
      selected: alienState.selected,
      onClick: (index) => { alienState.selected = index; drawAlien(); }
    });
  }

  function alienRepair() {
    if (alienState.selected === null) {
      alienStatus.textContent = "Select the square you think was damaged.";
      return;
    }
    if (alienState.selected === alienState.corrupt) {
      alienState.values[alienState.selected] = 1 - alienState.values[alienState.selected];
      alienStatus.textContent = "Repair confirmed. Every line check is even again.";
      alienDecoded.hidden = false;
      drawAlien();
    } else {
      alienStatus.textContent = "That repair creates another inconsistency. Try the intersection of the two alarms.";
      alienGrid.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 280 });
    }
  }

  // Two-glitch experiment.
  const doubleGrid = document.getElementById("doubleGrid");
  const doubleStatus = document.getElementById("doubleStatus");
  const doubleState = { base: addEvenChecks(alienCore), values: [], errors: [], analyzed: false };

  function doubleCorrupt() {
    doubleState.values = [...doubleState.base];
    const first = Math.floor(Math.random() * 36);
    let second = Math.floor(Math.random() * 36);
    while (second === first) second = Math.floor(Math.random() * 36);
    doubleState.errors = [first, second];
    doubleState.errors.forEach((index) => { doubleState.values[index] = 1 - doubleState.values[index]; });
    doubleState.analyzed = false;
    doubleStatus.textContent = "Two squares changed. What do the checks reveal?";
    drawDouble();
  }

  function drawDouble() {
    const lines = doubleState.analyzed ? oddLines(doubleState.values) : { rows: [], cols: [] };
    const candidates = new Set();
    lines.rows.forEach((row) => lines.cols.forEach((col) => candidates.add(row * 6 + col)));
    renderGrid(doubleGrid, doubleState.values, {
      borderVisible: true,
      rows: lines.rows,
      cols: lines.cols,
      candidates
    });
  }

  function doubleAnalyze() {
    doubleState.analyzed = true;
    const { rows, cols } = oddLines(doubleState.values);
    if (rows.length === 2 && cols.length === 2) {
      doubleStatus.textContent = "Four intersections are possible—but only two are real. The checks cannot choose.";
    } else if (rows.length === 0 && cols.length === 2) {
      doubleStatus.textContent = "The two row alarms cancelled. We know the columns, but not which row.";
    } else if (rows.length === 2 && cols.length === 0) {
      doubleStatus.textContent = "The two column alarms cancelled. We know the rows, but not which column.";
    } else if (rows.length === 0 && cols.length === 0) {
      doubleStatus.textContent = "The errors cancelled every alarm. The method sees nothing.";
    } else {
      doubleStatus.textContent = `${rows.length} odd row(s), ${cols.length} odd column(s): not enough for a guaranteed repair.`;
    }
    drawDouble();
  }

  // Error-correcting code labs.
  function hamming(a, b) {
    const length = Math.max(a.length, b.length);
    let distance = 0;
    for (let i = 0; i < length; i += 1) if (a[i] !== b[i]) distance += 1;
    return distance;
  }

  function sanitizeBinaryInput(input) {
    input.value = input.value.replace(/[^01]/g, "").slice(0, Number(input.maxLength));
  }

  document.querySelectorAll("input[inputmode='numeric']").forEach((input) => {
    input.addEventListener("input", () => sanitizeBinaryInput(input));
  });

  function testLab(lab) {
    const length = Number(lab.dataset.length);
    const inputs = [...lab.querySelectorAll("input")];
    const codes = inputs.map((input) => input.value);
    const result = lab.querySelector(".lab-result");
    const detail = lab.querySelector(".lab-detail");
    lab.classList.remove("pass", "fail");

    if (codes.some((code) => code.length !== length)) {
      lab.classList.add("fail");
      result.textContent = `Every message needs exactly ${length} bits.`;
      detail.textContent = "Fill every codeword before testing.";
      return;
    }
    if (new Set(codes).size !== codes.length) {
      lab.classList.add("fail");
      result.textContent = "Two commands use the same legal message.";
      detail.textContent = "They are ambiguous even before the Goblin attacks.";
      return;
    }

    let minimum = Infinity;
    let pair = [0, 1];
    for (let i = 0; i < codes.length; i += 1) {
      for (let j = i + 1; j < codes.length; j += 1) {
        const distance = hamming(codes[i], codes[j]);
        if (distance < minimum) { minimum = distance; pair = [i, j]; }
      }
    }

    if (minimum >= 3) {
      lab.classList.add("pass");
      result.textContent = "PASS — every zero-or-one glitch decodes uniquely.";
      detail.textContent = `Closest legal messages are ${minimum} positions apart. The Goblin cannot create ambiguity.`;
    } else {
      lab.classList.add("fail");
      result.textContent = "FAIL — the Goblin found an ambiguity.";
      detail.textContent = `Messages ${pair[0] + 1} and ${pair[1] + 1} are only ${minimum} position${minimum === 1 ? "" : "s"} apart.`;
    }
  }

  function clearLab(lab) {
    lab.querySelectorAll("input").forEach((input) => { input.value = ""; });
    lab.classList.remove("pass", "fail");
    lab.querySelector(".lab-result").textContent = "No codebook loaded.";
    lab.querySelector(".lab-detail").textContent = "Invent four legal messages, then test them.";
  }

  function revealPreset(lab) {
    const preset = lab.dataset.preset.split(",");
    lab.querySelectorAll("input").forEach((input, index) => { input.value = preset[index]; });
    testLab(lab);
  }

  // Hamming-distance workbench.
  const distanceA = document.getElementById("distanceA");
  const distanceB = document.getElementById("distanceB");
  const bitComparison = document.getElementById("bitComparison");
  const distanceValue = document.getElementById("distanceValue");

  function updateDistance() {
    const a = distanceA.value;
    const b = distanceB.value;
    const length = Math.max(a.length, b.length);
    bitComparison.innerHTML = "";
    for (let i = 0; i < length; i += 1) {
      const marker = document.createElement("i");
      marker.classList.toggle("diff", a[i] !== b[i]);
      marker.title = a[i] === b[i] ? `position ${i + 1}: same` : `position ${i + 1}: different`;
      bitComparison.appendChild(marker);
    }
    distanceValue.textContent = String(hamming(a, b));
  }
  distanceA.addEventListener("input", updateDistance);
  distanceB.addEventListener("input", updateDistance);

  // Nearest-message decoder.
  const legalCodes = ["00000", "11100", "10011", "01111"];
  const legalNames = ["A · LAUNCH", "B · RETURN", "C · REFUEL", "D · STOP"];
  function decodeSignal() {
    const input = document.getElementById("decoderInput");
    const output = document.getElementById("decodeResult");
    if (input.value.length !== 5) {
      output.textContent = "Enter exactly five bits.";
      return;
    }
    const distances = legalCodes.map((code) => hamming(code, input.value));
    const minimum = Math.min(...distances);
    const winners = distances.map((distance, index) => ({ distance, index })).filter((item) => item.distance === minimum);
    if (winners.length === 1 && minimum <= 1) {
      output.innerHTML = `<strong>${legalNames[winners[0].index]}</strong><br>Nearest legal message: ${legalCodes[winners[0].index]} · distance ${minimum}`;
    } else if (winners.length === 1) {
      output.textContent = `${legalCodes[winners[0].index]} is nearest, but ${minimum} changes away—outside the one-glitch guarantee.`;
    } else {
      output.textContent = `Ambiguous: ${winners.length} legal messages are equally close.`;
    }
  }

  // Robot alarm designer.
  const robotDesigner = document.getElementById("robotDesigner");
  const robotStatus = document.getElementById("robotStatus");
  const robotPatterns = Array.from({ length: 7 }, () => [0, 0, 0]);
  let failedRobot = null;

  function renderRobots() {
    robotDesigner.innerHTML = "";
    robotPatterns.forEach((pattern, robotIndex) => {
      const card = document.createElement("div");
      card.className = "robot-card";
      card.classList.toggle("failed", robotIndex === failedRobot);
      card.innerHTML = `<div class="robot-face">🤖</div><strong>ROBOT ${robotIndex + 1}</strong>`;
      const dots = document.createElement("div");
      dots.className = "sensor-dots";
      pattern.forEach((value, sensorIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.toggle("on", Boolean(value));
        button.dataset.action = "robot-toggle";
        button.dataset.robot = String(robotIndex);
        button.dataset.sensor = String(sensorIndex);
        button.setAttribute("aria-label", `Toggle sensor ${sensorIndex + 1} for robot ${robotIndex + 1}`);
        dots.appendChild(button);
      });
      card.appendChild(dots);
      robotDesigner.appendChild(card);
    });
  }

  function robotToggle(robot, sensor) {
    robotPatterns[robot][sensor] = 1 - robotPatterns[robot][sensor];
    failedRobot = null;
    setAlarms([0, 0, 0]);
    renderRobots();
  }

  function setAlarms(pattern) {
    document.querySelectorAll(".alarm-bank i").forEach((light, index) => light.classList.toggle("on", Boolean(pattern[index])));
  }

  function robotDesignIsValid() {
    const signatures = robotPatterns.map((pattern) => pattern.join(""));
    return signatures.every((signature) => signature !== "000") && new Set(signatures).size === 7;
  }

  function robotClear() {
    robotPatterns.forEach((pattern) => pattern.fill(0));
    failedRobot = null;
    setAlarms([0, 0, 0]);
    robotStatus.textContent = "Design cleared. Each light may monitor any collection of robots.";
    renderRobots();
  }

  function robotReveal() {
    robotPatterns.forEach((pattern, index) => {
      const bits = (index + 1).toString(2).padStart(3, "0");
      pattern.splice(0, 3, ...[...bits].map(Number));
    });
    failedRobot = null;
    setAlarms([0, 0, 0]);
    robotStatus.textContent = "Seven different nonzero patterns: 001 through 111.";
    renderRobots();
  }

  function robotTest() {
    failedRobot = null;
    setAlarms([0, 0, 0]);
    if (robotDesignIsValid()) robotStatus.textContent = "PASS — every robot creates a different alarm pattern.";
    else robotStatus.textContent = "Not yet: find a robot with 000 or two robots sharing the same pattern.";
    renderRobots();
  }

  function robotFail() {
    if (!robotDesignIsValid()) {
      robotStatus.textContent = "Create seven unique nonzero patterns—or reveal a design—before simulating.";
      return;
    }
    failedRobot = Math.floor(Math.random() * 7);
    const signature = robotPatterns[failedRobot].join("");
    setAlarms(robotPatterns[failedRobot]);
    robotStatus.textContent = `Alarm pattern ${signature} identifies Robot ${failedRobot + 1}. Three answers distinguish seven possibilities.`;
    renderRobots();
  }

  // Central action router.
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const lab = button.closest(".code-lab");

    if (action === "next") nextSlide();
    else if (action === "prev") previousSlide();
    else if (action === "go-home") showSlide(0);
    else if (action === "toggle-notes") toggleNotes();
    else if (action === "toggle-display-panel") toggleDisplayPanel();
    else if (action === "toggle-projector") setProjectorMode(!document.body.classList.contains("projector-mode"));
    else if (action === "reset-display") resetDisplay();
    else if (action === "fullscreen") toggleFullscreen();
    else if (action === "stabilize") {
      const transmission = document.getElementById("heroTransmission");
      transmission.textContent = "HUMANITY HAS A PROBLEM";
      transmission.style.color = "var(--cyan)";
      button.textContent = "Signal locked";
      setTimeout(nextSlide, 650);
    }
    else if (action === "parity-randomize") parityRandomize();
    else if (action === "parity-border") parityBorder();
    else if (action === "parity-reveal") parityReveal();
    else if (action === "timer-toggle") timerToggle(button.dataset.target);
    else if (action === "timer-reset") timerReset(button.dataset.target);
    else if (action === "reveal-hint") {
      const hint = document.getElementById(button.dataset.hint);
      hint.hidden = !hint.hidden;
      button.setAttribute("aria-expanded", String(!hint.hidden));
    }
    else if (action === "pulse-cross") {
      button.classList.remove("pulse");
      requestAnimationFrame(() => button.classList.add("pulse"));
    }
    else if (action === "reveal-parity") {
      document.getElementById("parityWord").textContent = "PARITY";
      button.classList.add("revealed");
    }
    else if (action === "alien-new") alienNew();
    else if (action === "alien-repair") alienRepair();
    else if (action === "double-corrupt") doubleCorrupt();
    else if (action === "double-analyze") doubleAnalyze();
    else if (action === "test-lab") testLab(lab);
    else if (action === "clear-lab") clearLab(lab);
    else if (action === "reveal-preset") revealPreset(lab);
    else if (action === "reveal-distance") {
      document.getElementById("distanceWord").textContent = "HAMMING DISTANCE";
      button.classList.add("revealed");
    }
    else if (action === "show-distance-case") {
      document.querySelectorAll("[data-action='show-distance-case']").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const messages = {
        "1": "Unsafe: a single glitch can land directly on another legal message.",
        "2": "Unsafe: one received message can be one step from two different legal messages.",
        "3": "Safe for one glitch: every damaged message has one nearest legal home."
      };
      document.getElementById("separationRule").textContent = messages[button.dataset.case];
    }
    else if (action === "decode-signal") decodeSignal();
    else if (action === "robot-toggle") robotToggle(Number(button.dataset.robot), Number(button.dataset.sensor));
    else if (action === "robot-clear") robotClear();
    else if (action === "robot-reveal") robotReveal();
    else if (action === "robot-test") robotTest();
    else if (action === "robot-fail") robotFail();
    else if (action === "qr-damage") {
      document.getElementById("qrFrame").classList.add("damaged");
      document.getElementById("qrStatus").textContent = "Signal integrity: damaged — correction data active";
    }
    else if (action === "qr-restore") {
      document.getElementById("qrFrame").classList.remove("damaged");
      document.getElementById("qrStatus").textContent = "Signal integrity: 100%";
    }
    else if (action === "final-reveal") {
      document.getElementById("finalBefore").hidden = true;
      document.getElementById("finalAnswer").hidden = false;
    }
  });

  // Initial state.
  drawParity();
  alienNew();
  doubleCorrupt();
  updateDistance();
  renderRobots();
  resetDisplay();
  showSlide(current);
})();
