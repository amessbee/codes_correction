(() => {
  "use strict";

  const { slides } = window.SIGNAL_RESCUE;
  const stage = document.getElementById("stage");
  const viewport = document.getElementById("viewport");
  const counter = document.getElementById("counter");
  const timeline = document.getElementById("timeline");
  const progress = document.querySelector("#progress span");
  const previous = document.getElementById("previous");
  const next = document.getElementById("next");
  const notesPanel = document.getElementById("notesPanel");
  const notesTiming = document.getElementById("notesTiming");
  const notesText = document.getElementById("notesText");
  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overviewGrid");
  const help = document.getElementById("help");

  const starts = [];
  let runningTotal = 0;
  slides.forEach(slide => {
    starts.push(runningTotal);
    runningTotal += slide.minutes;
  });

  function slideMarkup(slide, index) {
    const number = String(index + 1).padStart(2, "0");
    const header = slide.hideHeader ? "" : `<header class="slide-header ${slide.compact ? "compact" : ""}">
      <span class="eyebrow">${slide.section}</span>
      <h1 id="slide-title-${index + 1}">${slide.title}</h1>
    </header>`;
    return `<section class="slide ${slide.className || ""}" data-index="${index}" data-number="${number}" aria-labelledby="slide-title-${index + 1}" aria-hidden="true">
      ${header}
      <div class="${slide.hideHeader ? "" : "content"}">${slide.body}</div>
    </section>`;
  }

  stage.innerHTML = slides.map(slideMarkup).join("");
  const slideElements = [...stage.querySelectorAll(".slide")];

  overviewGrid.innerHTML = slides.map((slide, index) => {
    const start = starts[index];
    const end = start + slide.minutes;
    return `<button class="overview-card" type="button" data-go="${index}">
      <span>${String(index + 1).padStart(2, "0")} · ${slide.section.toUpperCase()}</span>
      <strong>${slide.title}</strong>
      <small>${start}–${end} min · ${slide.minutes} min</small>
    </button>`;
  }).join("");
  const overviewCards = [...overviewGrid.querySelectorAll(".overview-card")];

  const hashIndex = Number.parseInt(location.hash.replace("#", ""), 10) - 1;
  let current = Number.isFinite(hashIndex) ? Math.min(Math.max(hashIndex, 0), slides.length - 1) : 0;

  function updateCurrent(index, { updateHash = true } = {}) {
    current = Math.min(Math.max(index, 0), slides.length - 1);
    slideElements.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    overviewCards.forEach((card, cardIndex) => card.classList.toggle("current", cardIndex === current));

    const slide = slides[current];
    const start = starts[current];
    const end = start + slide.minutes;
    counter.textContent = `${String(current + 1).padStart(2, "0")} / ${slides.length}`;
    timeline.textContent = `${start}–${end} min`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    notesTiming.textContent = `Slide ${current + 1} · ${slide.minutes} minute${slide.minutes === 1 ? "" : "s"} · session ${start}–${end}`;
    notesText.textContent = slide.notes;
    document.title = `${String(current + 1).padStart(2, "0")} · ${slide.title} — Signal Rescue Lab`;
    if (updateHash) history.replaceState(null, "", `#${current + 1}`);
  }

  function go(delta) { updateCurrent(current + delta); }

  function scaleStage() {
    const scale = Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 720);
    stage.style.transform = `scale(${Math.max(scale, 0.05)})`;
  }

  function setOverlay(element, open) {
    element.classList.toggle("is-open", open);
    element.setAttribute("aria-hidden", String(!open));
  }

  function toggleNotes(force) {
    const open = typeof force === "boolean" ? force : !notesPanel.classList.contains("is-open");
    notesPanel.classList.toggle("is-open", open);
    notesPanel.setAttribute("aria-hidden", String(!open));
    document.getElementById("notesButton").setAttribute("aria-pressed", String(open));
  }

  function closeTransientOverlays() {
    setOverlay(overview, false);
    setOverlay(help, false);
  }

  previous.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  document.getElementById("notesButton").addEventListener("click", () => toggleNotes());
  document.getElementById("closeNotes").addEventListener("click", () => toggleNotes(false));
  document.getElementById("overviewButton").addEventListener("click", () => setOverlay(overview, true));
  document.getElementById("closeOverview").addEventListener("click", () => setOverlay(overview, false));
  document.getElementById("helpButton").addEventListener("click", () => setOverlay(help, true));
  document.getElementById("closeHelp").addEventListener("click", () => setOverlay(help, false));
  document.getElementById("fullscreenButton").addEventListener("click", async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  });

  overviewGrid.addEventListener("click", event => {
    const card = event.target.closest("[data-go]");
    if (!card) return;
    updateCurrent(Number(card.dataset.go));
    setOverlay(overview, false);
  });

  stage.addEventListener("click", event => {
    if (event.target.closest("button, a")) return;
    const rect = stage.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    if (relativeX < rect.width * 0.18) go(-1);
    else go(1);
  });

  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Escape") {
      closeTransientOverlays();
      toggleNotes(false);
      return;
    }
    if (overview.classList.contains("is-open") || help.classList.contains("is-open")) return;
    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        event.preventDefault(); go(1); break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault(); go(-1); break;
      case "Home":
        event.preventDefault(); updateCurrent(0); break;
      case "End":
        event.preventDefault(); updateCurrent(slides.length - 1); break;
      case "n":
      case "N":
        toggleNotes(); break;
      case "o":
      case "O":
        setOverlay(overview, true); break;
      case "f":
      case "F":
        document.getElementById("fullscreenButton").click(); break;
      case "p":
      case "P":
        window.print(); break;
      case "?":
        setOverlay(help, true); break;
      default:
        break;
    }
  });

  window.addEventListener("hashchange", () => {
    const index = Number.parseInt(location.hash.replace("#", ""), 10) - 1;
    if (Number.isFinite(index)) updateCurrent(index, { updateHash: false });
  });

  let touchStartX = null;
  stage.addEventListener("touchstart", event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", event => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
    touchStartX = null;
  }, { passive: true });

  const breakTimer = document.getElementById("breakTimer");
  const startBreak = document.getElementById("startBreak");
  const resetBreak = document.getElementById("resetBreak");
  let breakSeconds = 300;
  let breakInterval = null;
  function drawBreakTimer() {
    const minutes = Math.floor(breakSeconds / 60);
    const seconds = breakSeconds % 60;
    breakTimer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  function stopBreakTimer() {
    window.clearInterval(breakInterval);
    breakInterval = null;
  }
  startBreak.addEventListener("click", () => {
    if (breakInterval) { stopBreakTimer(); return; }
    breakInterval = window.setInterval(() => {
      breakSeconds = Math.max(0, breakSeconds - 1);
      drawBreakTimer();
      if (breakSeconds === 0) stopBreakTimer();
    }, 1000);
  });
  resetBreak.addEventListener("click", () => { stopBreakTimer(); breakSeconds = 300; drawBreakTimer(); });

  window.addEventListener("resize", scaleStage);
  window.addEventListener("beforeprint", () => { stage.style.transform = "none"; });
  window.addEventListener("afterprint", scaleStage);
  drawBreakTimer();
  updateCurrent(current);
  scaleStage();
})();
