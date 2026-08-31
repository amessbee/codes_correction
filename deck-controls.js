/* deck-controls.js — presentation control bar for the GLITCH deck.
 *
 * Behaviour ported from ../f26/web/app/presentation/core/PresentationDeck.tsx
 * (the "portable subset": navigation, overview, speaker notes, blank-notes
 * scratchpad, slide-text editing, pen/highlighter/blackout annotations, slide
 * transitions, class timer, hide/skip slides, fill-window + browser fullscreen,
 * PDF export, keyboard help, and a hideable bar). Restyled for this deck.
 *
 * It drives navigation through window.__glitchDeck, which app.js exposes.
 */
(() => {
  "use strict";

  const deck = window.__glitchDeck;
  const deckEl = document.getElementById("deck");
  if (!deck || !deckEl) return;

  const slides = deck.slides;
  const total = deck.total;
  const $ = (tag, cls, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  };
  const clampSlide = (n) => Math.max(1, Math.min(total, Math.round(n) || 1));

  /* ---------------------------------------------------------------- icons */
  const SPRITE = `
<symbol id="di-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
<symbol id="di-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
<symbol id="di-house" viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></symbol>
<symbol id="di-notebook-tabs" viewBox="0 0 24 24"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M15 2v20"/><path d="M15 7h5"/><path d="M15 12h5"/><path d="M15 17h5"/></symbol>
<symbol id="di-sticky-note" viewBox="0 0 24 24"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M16 3v5h5"/></symbol>
<symbol id="di-type" viewBox="0 0 24 24"><path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/></symbol>
<symbol id="di-pen-tool" viewBox="0 0 24 24"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/></symbol>
<symbol id="di-highlighter" viewBox="0 0 24 24"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></symbol>
<symbol id="di-paint-blob" viewBox="0 0 24 24"><path d="m14 5 5 5"/><path d="m12.5 6.5 5 5-7.2 7.2a3.5 3.5 0 0 1-5-5z"/><path d="M7.1 15.9c-2.6-.2-4.2 1.3-4.6 4.6 3.3-.4 4.8-2 4.6-4.6Z"/></symbol>
<symbol id="di-sparkles" viewBox="0 0 24 24"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></symbol>
<symbol id="di-timer" viewBox="0 0 24 24"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></symbol>
<symbol id="di-eye" viewBox="0 0 24 24"><path d="M2.1 12a10.8 10.8 0 0 1 19.8 0 10.8 10.8 0 0 1-19.8 0"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="di-eye-off" viewBox="0 0 24 24"><path d="m2 2 20 20"/><path d="M6.7 6.7A10.7 10.7 0 0 0 2.1 12a10.8 10.8 0 0 0 15.2 5.3"/><path d="M10.7 10.7a2 2 0 0 0 2.6 2.6"/><path d="M14.6 5.2A10.8 10.8 0 0 1 21.9 12a10.9 10.9 0 0 1-1.6 2.6"/></symbol>
<symbol id="di-gallery-horizontal-end" viewBox="0 0 24 24"><path d="M2 7v10"/><path d="M6 5v14"/><rect width="12" height="18" x="10" y="3" rx="2"/></symbol>
<symbol id="di-maximize-2" viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></symbol>
<symbol id="di-minimize-2" viewBox="0 0 24 24"><path d="M4 14h6v6"/><path d="m3 21 7-7"/><path d="m21 3-7 7"/><path d="M14 4h6v6"/></symbol>
<symbol id="di-maximize" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></symbol>
<symbol id="di-file-down" viewBox="0 0 24 24"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></symbol>
<symbol id="di-circle-question-mark" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></symbol>
<symbol id="di-palette" viewBox="0 0 24 24"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></symbol>
<symbol id="di-panel-bottom-close" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/><path d="m9 10 3 3 3-3"/></symbol>
<symbol id="di-panel-bottom-open" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/><path d="m15 12-3-3-3 3"/></symbol>
<symbol id="di-undo-2" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></symbol>
<symbol id="di-trash-2" viewBox="0 0 24 24"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>
<symbol id="di-x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>`;
  const spriteHost = $("div", "dc-sprite");
  spriteHost.setAttribute("aria-hidden", "true");
  spriteHost.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${SPRITE}</svg>`;
  document.body.appendChild(spriteHost);
  const ic = (name) =>
    `<svg class="deck-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#di-${name}"/></svg>`;

  /* ------------------------------------------------------------- storage */
  const store = {
    get(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {}
    },
  };
  const KEY = {
    edits: "glitch-deck-slide-edits-v1",
    annotations: "glitch-deck-annotations-v1",
    hidden: "glitch-deck-hidden-slides-v1",
    includeHidden: "glitch-deck-include-hidden-v1",
    transition: "glitch-deck-slide-transition",
    theme: "glitch-deck-theme",
  };

  // [id, label, isLight, swatch-ground, swatch-accent]
  const THEMES = [
    ["midnight", "Midnight", false, "#050816", "#6fffe9"],
    ["abyss", "Abyss", false, "#04060d", "#5aa2ff"],
    ["nebula", "Nebula", false, "#0e0a1d", "#b49bff"],
    ["slate", "Slate", false, "#1a2130", "#7fd8ff"],
    ["graphite", "Graphite", false, "#23262e", "#d7dbe2"],
    ["daylight", "Daylight", true, "#eef2f8", "#0a6b62"],
    ["paper", "Paper", true, "#f6f2e9", "#7a5300"],
    ["parchment", "Parchment", true, "#efe6d3", "#5a3ab8"],
  ];
  const DEFAULT_THEME = "midnight";

  const TRANSITIONS = [
    ["morph", "Slow morph", "Blur and reshape"],
    ["crossfade", "Crossfade", "Quiet blend"],
    ["dissolve", "Dissolve", "Soft diffusion"],
    ["slide-left", "Slide left", "Glide forward"],
    ["slide-right", "Slide right", "Glide backward"],
    ["push-up", "Push up", "Vertical lift"],
    ["push-down", "Push down", "Vertical drop"],
    ["zoom-in", "Zoom in", "Move closer"],
    ["zoom-out", "Zoom out", "Pull away"],
    ["flip", "Flip", "Turn the page"],
    ["cube", "Cube", "Rotate the room"],
    ["iris", "Iris", "Circular reveal"],
    ["blur", "Blur", "Focus shift"],
    ["cut", "Cut", "No transition"],
  ];
  const DEFAULT_TRANSITION = "slide-left";

  /* --------------------------------------------------------------- state */
  let idx = deck.current;
  let hiddenSet = new Set(
    (store.get(KEY.hidden, []) || []).filter(
      (n) => Number.isInteger(n) && n >= 0 && n < total,
    ),
  );
  let includeHidden = store.get(KEY.includeHidden, false) === true;
  const savedTransition = store.get(KEY.transition, DEFAULT_TRANSITION);
  let slideTransition = TRANSITIONS.some((t) => t[0] === savedTransition)
    ? savedTransition
    : DEFAULT_TRANSITION;
  document.documentElement.dataset.slideTransition = slideTransition;

  const savedTheme = store.get(KEY.theme, DEFAULT_THEME);
  let theme = THEMES.some((t) => t[0] === savedTheme) ? savedTheme : DEFAULT_THEME;

  let notesOpen = false;
  let overviewOpen = false;
  let helpOpen = false;
  let transitionsOpen = false;
  let themeOpen = false;
  let pdfOpen = false;
  let editMode = false;
  let tool = "none"; // none | pen | hl | blackout
  let scratchpadOpen = false;
  let controlsHidden = false;
  let fillWindow = false;

  let annotations = store.get(KEY.annotations, {}) || {};
  let penColor = "#ff646b";
  let penWidth = 4;
  let hlColor = "#ffd166";
  let hlWidth = 22;
  let blackoutWidth = 120;
  let pdfRange = { from: 1, to: total };

  let timerOpen = false;
  let timerRunning = false;
  let durationSeconds = 600;
  let remainingSeconds = 600;
  let timerDeadline = null;
  let timerTick = null;

  /* --------------------------------------------- visible-slide helpers */
  function visibleIndexes() {
    const out = [];
    for (let i = 0; i < total; i += 1) {
      if (includeHidden || !hiddenSet.has(i)) out.push(i);
    }
    return out.length ? out : Array.from({ length: total }, (_, i) => i);
  }
  function neighbour(from, dir) {
    const vis = visibleIndexes();
    return dir === 1
      ? (vis.find((i) => i > from) ?? from)
      : ([...vis].reverse().find((i) => i < from) ?? from);
  }

  window.__deckResolveStep = (from, dir) => neighbour(from, dir);
  window.__deckFirst = () => visibleIndexes()[0] ?? 0;
  window.__deckLast = () => visibleIndexes().at(-1) ?? total - 1;

  function applyTheme(next) {
    const row = THEMES.find((t) => t[0] === next) || THEMES[0];
    theme = row[0];
    document.body.dataset.deckTheme = theme;
    document.body.classList.toggle("deck-light", row[2]);
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", row[3]);
    // keep the display panel's projector toggle out of the way of the theme system
    if (document.body.classList.contains("projector-mode")) {
      document.body.classList.remove("projector-mode");
      const pt = document.getElementById("projectorToggle");
      if (pt) pt.setAttribute("aria-pressed", "false");
    }
  }
  // let app.js's "flip colors for projector" control route through the theme system
  window.__deckSetTheme = (id) => {
    applyTheme(id);
    store.set(KEY.theme, theme);
    if (typeof renderPanel === "function") renderPanel();
    if (typeof refreshBar === "function") refreshBar();
  };

  let activeViewTransition = null;
  window.__deckTransition = (direction, commit) => {
    const canViewTransition = typeof document.startViewTransition === "function";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canViewTransition || reduced || slideTransition === "cut") {
      commit();
      return;
    }
    const root = document.documentElement;
    root.dataset.slideTransition = slideTransition;
    root.dataset.slideDirection = direction;
    try {
      activeViewTransition?.skipTransition();
    } catch (_) {}
    try {
      const t = document.startViewTransition(commit);
      activeViewTransition = t;
      const clear = () => {
        if (activeViewTransition === t) activeViewTransition = null;
      };
      t.finished.then(clear, clear);
    } catch (_) {
      commit();
    }
  };

  /* ----------------------------------------------------------- DOM build */
  // progress bar
  const progressEl = $("div", "dc-progress");
  progressEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(progressEl);

  // annotation layer (fixed, full viewport, above slides)
  const layer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  layer.setAttribute("class", "dc-annotation-layer");
  layer.setAttribute("viewBox", "0 0 1000 1000");
  layer.setAttribute("preserveAspectRatio", "none");
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);

  // blank-notes scratchpad overlay
  const scratchEl = $(
    "div",
    "dc-scratchpad",
    `<header><p>BLANK NOTES</p><span>Draw anywhere · press W to return</span></header>`,
  );
  scratchEl.hidden = true;
  document.body.insertBefore(scratchEl, layer);

  // reuse the deck's existing facilitator-notes panel
  const notesPanel = document.getElementById("notesPanel");
  const notesText = document.getElementById("notesText");
  // keep the bar's notes button in sync when notes are toggled via keyboard / the panel's own close button
  if (notesPanel) {
    new MutationObserver(() => {
      notesOpen = !notesPanel.hidden;
      btnNotes.classList.toggle("dc-on", notesOpen);
    }).observe(notesPanel, { attributes: true, attributeFilter: ["hidden"] });
  }

  // control bar
  const bar = $("nav", "dc-controls");
  bar.setAttribute("aria-label", "Presentation controls");
  const revealZone = $("button", "dc-reveal-zone");
  revealZone.type = "button";
  revealZone.setAttribute("aria-label", "Show presentation controls");
  revealZone.tabIndex = -1;
  document.body.appendChild(revealZone);
  document.body.appendChild(bar);

  const mkBtn = (name, label, onClick) => {
    const b = $("button", null, ic(name));
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.title = label;
    b.addEventListener("click", onClick);
    b._icon = name;
    return b;
  };
  const setIcon = (b, name) => {
    if (b._icon !== name) {
      b._icon = name;
      b.innerHTML = ic(name);
    }
  };

  const btnPrev = mkBtn("chevron-left", "Previous slide", () => deck.prev());
  const btnCounter = $("button", "dc-counter", "1 / 1");
  btnCounter.type = "button";
  btnCounter.setAttribute("aria-label", "Open slide overview");
  btnCounter.addEventListener("click", () => setOverview(true));
  const btnNext = mkBtn("chevron-right", "Next slide", () => deck.next());
  const btnHome = mkBtn("house", "Title slide", () => deck.go(window.__deckFirst()));
  const btnNotes = mkBtn("notebook-tabs", "Speaker notes (N)", () => toggleNotes());
  const btnScratch = mkBtn("sticky-note", "Blank notes with pen (W)", () =>
    setScratchpad(!scratchpadOpen),
  );
  const btnEdit = mkBtn("type", "Edit slide text (E)", () => setEditMode(!editMode));
  const btnPen = mkBtn("pen-tool", "Pen (P)", () => setTool("pen"));
  const btnHl = mkBtn("highlighter", "Highlighter (H)", () => setTool("hl"));
  const btnBlackout = mkBtn("paint-blob", "Blackout mask (B)", () => setTool("blackout"));
  const btnTransitions = mkBtn("sparkles", "Slide transitions (V)", () =>
    setTransitions(!transitionsOpen),
  );
  const btnTheme = mkBtn("palette", "Colour theme (T)", () => setThemePanel(!themeOpen));
  const btnTimer = mkBtn("timer", "Class timer", () => openTimer());
  const btnHideSlide = mkBtn("eye-off", "Hide this slide", () => toggleHideCurrent());
  const btnIncludeHidden = mkBtn(
    "gallery-horizontal-end",
    "Include hidden slides",
    () => toggleIncludeHidden(),
  );
  const btnFill = mkBtn("maximize-2", "Fill window with slide", () =>
    setFillWindow(!fillWindow),
  );
  const btnFullscreen = mkBtn("maximize", "Fullscreen (F)", () => toggleFullscreen());
  const btnPdf = mkBtn("file-down", "Export slides to PDF", () => setPdf(!pdfOpen));
  const btnHelp = mkBtn("circle-question-mark", "Keyboard help (?)", () =>
    setHelp(!helpOpen),
  );
  const btnHideBar = mkBtn("panel-bottom-close", "Hide control bar", () =>
    setControlsHidden(!controlsHidden),
  );

  bar.append(btnPrev, btnCounter, btnNext, $("span", "dc-divider"));
  bar.append(btnHome, btnNotes, btnScratch, btnEdit, btnPen, btnHl, btnBlackout);
  bar.append(btnTransitions, btnTheme, btnTimer, btnHideSlide, btnIncludeHidden);
  bar.append(btnFill, btnFullscreen, btnPdf, btnHelp, btnHideBar);

  /* --------------------------------------------------- context toolbar */
  const ctxToolbar = $("aside", "dc-context-toolbar");
  ctxToolbar.setAttribute("aria-label", "Editing tools");
  ctxToolbar.hidden = true;
  document.body.appendChild(ctxToolbar);

  function renderContextToolbar() {
    if (editMode) {
      ctxToolbar.className = "dc-context-toolbar";
      ctxToolbar.hidden = false;
      ctxToolbar.innerHTML = "";
      ctxToolbar.append(
        $("b", null, "EDIT MODE"),
        $("span", null, "Click text, then type · autosaves on this device"),
      );
      const restore = $("button", null, "Restore slide");
      restore.type = "button";
      restore.addEventListener("click", restoreSlide);
      const done = $("button", "dc-done", "Done");
      done.type = "button";
      done.addEventListener("click", () => setEditMode(false));
      ctxToolbar.append(restore, done);
      return;
    }
    if (tool !== "none") {
      const isBlackout = tool === "blackout";
      ctxToolbar.className = `dc-context-toolbar${isBlackout ? " dc-blackout" : ""}`;
      ctxToolbar.hidden = false;
      ctxToolbar.innerHTML = "";
      ctxToolbar.append(
        $("b", null, tool === "pen" ? "PEN" : tool === "hl" ? "HIGHLIGHTER" : "BLACKOUT MASK"),
      );
      if (!isBlackout) {
        const colorLabel = $("label", null, "Color ");
        const color = document.createElement("input");
        color.type = "color";
        color.value = tool === "hl" ? hlColor : penColor;
        color.addEventListener("input", () => {
          if (tool === "hl") hlColor = color.value;
          else penColor = color.value;
        });
        colorLabel.appendChild(color);
        ctxToolbar.appendChild(colorLabel);
      }
      const sizeLabel = $("label", null, isBlackout ? "Blob size " : "Size ");
      const size = document.createElement("input");
      size.type = "range";
      size.min = isBlackout ? 40 : 2;
      size.max = isBlackout ? 240 : 32;
      size.step = isBlackout ? 10 : 1;
      size.value = isBlackout ? blackoutWidth : tool === "hl" ? hlWidth : penWidth;
      size.addEventListener("input", () => {
        const v = Number(size.value);
        if (isBlackout) blackoutWidth = v;
        else if (tool === "hl") hlWidth = v;
        else penWidth = v;
      });
      sizeLabel.appendChild(size);
      ctxToolbar.appendChild(sizeLabel);

      const undo = $("button", null, `${ic("undo-2")}${isBlackout ? "Remove last" : "Undo"}`);
      undo.type = "button";
      undo.addEventListener("click", undoAnnotation);
      const clear = $("button", null, `${ic("trash-2")}${isBlackout ? "Clear masks" : "Clear"}`);
      clear.type = "button";
      clear.addEventListener("click", clearAnnotations);
      const has = (annotations[annotationKey()] || []).some((s) =>
        isBlackout ? s.tool === "blackout" : true,
      );
      undo.disabled = !has;
      clear.disabled = !has;
      const done = $("button", "dc-done", `${ic("x")}Done`);
      done.type = "button";
      done.addEventListener("click", () => setTool("none"));
      ctxToolbar.append(undo, clear, done);
      return;
    }
    ctxToolbar.hidden = true;
  }

  /* ------------------------------------------------------- floating panel */
  const panel = $("aside", "dc-panel");
  panel.hidden = true;
  document.body.appendChild(panel);

  function panelHeader(title, subtitle, onClose) {
    const head = $("div", "dc-panel-title");
    head.innerHTML = `<div><b>${title}</b><span>${subtitle}</span></div>`;
    const close = $("button", null, "×");
    close.type = "button";
    close.setAttribute("aria-label", `Close ${title.toLowerCase()}`);
    close.addEventListener("click", onClose);
    head.appendChild(close);
    return head;
  }

  function renderPanel() {
    if (themeOpen) {
      panel.hidden = false;
      panel.className = "dc-panel dc-theme-panel";
      panel.innerHTML = "";
      panel.appendChild(
        panelHeader("COLOUR THEME", "Saved on this device", () => setThemePanel(false)),
      );
      const grid = $("div", "dc-theme-grid");
      THEMES.forEach(([id, label, isLight, ground, accent]) => {
        const b = $(
          "button",
          theme === id ? "dc-on" : "",
          `<i class="dc-theme-swatch" style="background:${ground}">` +
            `<span style="background:${accent}"></span></i>` +
            `<span class="dc-theme-name">${label}<small>${isLight ? "Light" : "Dark"}</small></span>`,
        );
        b.type = "button";
        b.addEventListener("click", () => {
          applyTheme(id);
          store.set(KEY.theme, theme);
          renderPanel();
          refreshBar();
        });
        grid.appendChild(b);
      });
      panel.appendChild(grid);
      return;
    }
    if (transitionsOpen) {
      panel.hidden = false;
      panel.className = "dc-panel dc-transition-panel";
      panel.innerHTML = "";
      panel.appendChild(
        panelHeader("SLIDE TRANSITIONS", "Saved on this device", () =>
          setTransitions(false),
        ),
      );
      const grid = $("div", "dc-transition-grid");
      TRANSITIONS.forEach(([id, label, desc]) => {
        const b = $(
          "button",
          slideTransition === id ? "dc-on" : "",
          `<i class="dc-swatch s-${id}"></i><span><b>${label}</b><small>${desc}</small></span>`,
        );
        b.type = "button";
        b.addEventListener("click", () => {
          slideTransition = id;
          store.set(KEY.transition, id);
          document.documentElement.dataset.slideTransition = id;
          renderPanel();
        });
        grid.appendChild(b);
      });
      panel.appendChild(grid);
      return;
    }
    if (pdfOpen) {
      panel.hidden = false;
      panel.className = "dc-panel dc-pdf-panel";
      panel.innerHTML = "";
      panel.appendChild(
        panelHeader("EXPORT PDF", "Choose deck slide numbers", () => setPdf(false)),
      );
      const presets = $("div", "dc-pdf-presets");
      const preset = (text, from, to) => {
        const b = $("button", null, text);
        b.type = "button";
        b.addEventListener("click", () => {
          pdfRange = { from: clampSlide(from), to: clampSlide(to) };
          renderPanel();
        });
        return b;
      };
      presets.append(
        preset("All slides", 1, total),
        preset("Through current", 1, idx + 1),
        preset("Current only", idx + 1, idx + 1),
      );
      panel.appendChild(presets);

      const range = $("div", "dc-pdf-range");
      const field = (labelText, edge) => {
        const label = $("label", null, `<span>${labelText}</span>`);
        const input = document.createElement("input");
        input.type = "number";
        input.min = 1;
        input.max = total;
        input.value = pdfRange[edge];
        input.addEventListener("change", () => {
          const v = clampSlide(Number(input.value));
          pdfRange =
            edge === "from"
              ? { from: v, to: Math.max(v, pdfRange.to) }
              : { from: Math.min(pdfRange.from, v), to: v };
          renderPanel();
        });
        label.appendChild(input);
        return label;
      };
      range.append(field("FROM", "from"), $("i", null, "→"), field("TO", "to"));
      panel.appendChild(range);

      const count = pdfCount();
      const summary = $(
        "p",
        "dc-pdf-summary",
        `<b>${count}</b> slide${count === 1 ? "" : "s"} selected`,
      );
      panel.appendChild(summary);

      const go = $("button", "dc-pdf-go", "Export selected slides to PDF");
      go.type = "button";
      go.disabled = count === 0;
      go.addEventListener("click", runPdf);
      panel.appendChild(go);
      return;
    }
    panel.hidden = true;
  }

  function pdfCount() {
    let n = 0;
    for (let i = pdfRange.from; i <= pdfRange.to; i += 1) {
      if (includeHidden || !hiddenSet.has(i - 1)) n += 1;
    }
    return n;
  }

  /* ----------------------------------------------------------- overlays */
  const overlay = $("div", "dc-modal");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.hidden = true;
  document.body.appendChild(overlay);

  function renderOverlay() {
    if (overviewOpen) {
      overlay.hidden = false;
      overlay.className = "dc-modal dc-overview";
      overlay.setAttribute("aria-label", "Slide overview");
      overlay.innerHTML = "";
      const close = $("button", "dc-modal-close", "×");
      close.type = "button";
      close.setAttribute("aria-label", "Close slide overview");
      close.addEventListener("click", () => setOverview(false));
      overlay.appendChild(close);
      const grid = $("div", "dc-overview-grid");
      const vis = visibleIndexes();
      slides.forEach((slide, i) => {
        if (!includeHidden && hiddenSet.has(i)) return;
        const pos = vis.indexOf(i);
        const b = $(
          "button",
          `${i === idx ? "dc-current" : ""} ${hiddenSet.has(i) ? "dc-hidden" : ""}`,
          `<span>${String(pos + 1).padStart(2, "0")}</span>` +
            `<b>${slide.dataset.chapter || `Slide ${i + 1}`}</b>` +
            `<small>${hiddenSet.has(i) ? "HIDDEN · " : ""}slide ${i + 1}${
              slide.dataset.time ? " · " + slide.dataset.time : ""
            }</small>`,
        );
        b.type = "button";
        b.addEventListener("click", () => {
          setOverview(false);
          deck.go(i);
        });
        grid.appendChild(b);
      });
      overlay.appendChild(grid);
      return;
    }
    if (helpOpen) {
      overlay.hidden = false;
      overlay.className = "dc-modal dc-help";
      overlay.setAttribute("aria-label", "Keyboard shortcuts");
      overlay.innerHTML = "";
      const close = $("button", "dc-modal-close", "×");
      close.type = "button";
      close.setAttribute("aria-label", "Close keyboard help");
      close.addEventListener("click", () => setHelp(false));
      overlay.appendChild(close);
      overlay.insertAdjacentHTML(
        "beforeend",
        `<div class="dc-help-inner"><h2>Presentation controls</h2><dl>
          <dt>← → / Space</dt><dd>Navigate</dd>
          <dt>Home / End</dt><dd>First / last slide</dd>
          <dt>N</dt><dd>Speaker notes</dd>
          <dt>O</dt><dd>Slide overview</dd>
          <dt>E</dt><dd>Edit slide text</dd>
          <dt>P / H / B</dt><dd>Pen / highlighter / blackout mask</dd>
          <dt>W</dt><dd>Blank notes with pen ready</dd>
          <dt>V</dt><dd>Slide transitions</dd>
          <dt>T</dt><dd>Colour theme</dd>
          <dt>F</dt><dd>Fullscreen</dd>
          <dt>D / C</dt><dd>Display panel / projector colors</dd>
          <dt>Swipe</dt><dd>Swipe left / right for next / previous</dd>
        </dl></div>`,
      );
      return;
    }
    overlay.hidden = true;
  }

  /* ------------------------------------------------------------- timer */
  const timerEl = $("aside", "dc-timer");
  timerEl.setAttribute("role", "dialog");
  timerEl.setAttribute("aria-modal", "true");
  timerEl.setAttribute("aria-label", "Presentation timer");
  timerEl.hidden = true;
  document.body.appendChild(timerEl);

  function fmtTime(seconds) {
    const s = Math.max(0, seconds);
    const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
    return parts.map((v) => String(v).padStart(2, "0")).join(":");
  }
  function renderTimer() {
    if (!timerOpen) return;
    const finished = remainingSeconds === 0;
    timerEl.className = `dc-timer${finished ? " dc-finished" : ""}`;
    const minutes = durationSeconds / 60;
    timerEl.innerHTML = `
      <button class="dc-timer-close" type="button" aria-label="Close timer">×</button>
      <div class="dc-timer-inner">
        <p class="dc-timer-kicker">CLASS TIMER</p>
        <h2>${finished ? "Time’s up!" : timerRunning ? "Time remaining" : "Timer paused"}</h2>
        <output class="dc-timer-clock">${fmtTime(remainingSeconds)}</output>
        <div class="dc-timer-presets">
          ${[5, 10, 15, 20]
            .map(
              (m) =>
                `<button type="button" data-min="${m}" class="${
                  minutes === m ? "dc-on" : ""
                }" ${timerRunning ? "disabled" : ""}>${m} min</button>`,
            )
            .join("")}
          <label>Minutes <input type="number" min="1" max="180" step="1" value="${minutes}" ${
            timerRunning ? "disabled" : ""
          }></label>
        </div>
        <div class="dc-timer-actions">
          <button class="dc-primary" type="button" data-act="toggle">${
            timerRunning ? "Pause" : finished ? "Start again" : "Resume"
          }</button>
          <button type="button" data-act="add5">+ 5 minutes</button>
          <button type="button" data-act="reset">Reset</button>
        </div>
        <p class="dc-timer-hint">Close this view any time — the countdown keeps running.</p>
      </div>`;
    timerEl.querySelector(".dc-timer-close").addEventListener("click", closeTimer);
    timerEl.querySelectorAll("[data-min]").forEach((b) =>
      b.addEventListener("click", () => setTimerDuration(Number(b.dataset.min))),
    );
    const custom = timerEl.querySelector('input[type="number"]');
    custom.addEventListener("change", () => setTimerDuration(Number(custom.value)));
    timerEl.querySelector('[data-act="toggle"]').addEventListener("click", () =>
      timerRunning ? pauseTimer() : startTimer(),
    );
    timerEl.querySelector('[data-act="add5"]').addEventListener("click", addFiveMinutes);
    timerEl.querySelector('[data-act="reset"]').addEventListener("click", resetTimer);
  }
  function timerLoop() {
    window.clearInterval(timerTick);
    timerTick = window.setInterval(() => {
      if (timerDeadline == null) return;
      remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      if (remainingSeconds === 0) {
        timerDeadline = null;
        timerRunning = false;
        window.clearInterval(timerTick);
      }
      renderTimer();
    }, 250);
  }
  function startTimer() {
    const seconds = remainingSeconds > 0 ? remainingSeconds : durationSeconds;
    remainingSeconds = seconds;
    timerDeadline = Date.now() + seconds * 1000;
    timerRunning = true;
    timerLoop();
    renderTimer();
    refreshBar();
  }
  function pauseTimer() {
    if (timerDeadline != null) {
      remainingSeconds = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    }
    timerDeadline = null;
    timerRunning = false;
    window.clearInterval(timerTick);
    renderTimer();
    refreshBar();
  }
  function resetTimer() {
    timerDeadline = null;
    timerRunning = false;
    window.clearInterval(timerTick);
    remainingSeconds = durationSeconds;
    renderTimer();
    refreshBar();
  }
  function addFiveMinutes() {
    remainingSeconds += 300;
    if (timerDeadline != null) timerDeadline += 300000;
    renderTimer();
  }
  function setTimerDuration(minutes) {
    const safe = Math.max(1, Math.min(180, Math.round(minutes) || 1));
    durationSeconds = safe * 60;
    timerDeadline = null;
    timerRunning = false;
    window.clearInterval(timerTick);
    remainingSeconds = durationSeconds;
    renderTimer();
    refreshBar();
  }
  function openTimer() {
    timerOpen = true;
    timerEl.hidden = false;
    if (!timerRunning) startTimer();
    else renderTimer();
    refreshBar();
  }
  function closeTimer() {
    timerOpen = false;
    timerEl.hidden = true;
    refreshBar();
  }

  /* --------------------------------------------------------- annotations */
  function annotationKey() {
    return scratchpadOpen ? `__blank-notes__-${idx + 1}` : String(idx + 1);
  }
  function renderAnnotations() {
    const list = annotations[annotationKey()] || [];
    layer.innerHTML = list
      .map((s) => {
        const pts = s.points.map((p) => p.join(",")).join(" ");
        const stroke = s.tool === "blackout" ? "#05070d" : s.color;
        const opacity = s.tool === "hl" ? 0.32 : s.tool === "blackout" ? 1 : 0.95;
        const cls = s.tool === "hl" ? "dc-hl" : "";
        const cap = s.tool === "hl" ? "square" : "round";
        return `<polyline class="${cls}" points="${pts}" fill="none" stroke="${stroke}" stroke-width="${s.width}" stroke-linecap="${cap}" stroke-linejoin="round" opacity="${opacity}"/>`;
      })
      .join("");
  }
  function pointFromEvent(event) {
    const rect = layer.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000)),
      Math.max(0, Math.min(1000, ((event.clientY - rect.top) / rect.height) * 1000)),
    ];
  }
  let activeStroke = null;
  layer.addEventListener("pointerdown", (event) => {
    if (tool === "none") return;
    event.preventDefault();
    layer.setPointerCapture(event.pointerId);
    const start = pointFromEvent(event);
    activeStroke = {
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      tool,
      color: tool === "hl" ? hlColor : tool === "blackout" ? "#05070d" : penColor,
      width: tool === "hl" ? hlWidth : tool === "blackout" ? blackoutWidth : penWidth,
      points: [start, [start[0] + 0.01, start[1] + 0.01]],
    };
    const key = annotationKey();
    annotations[key] = annotations[key] || [];
    annotations[key].push(activeStroke);
    renderAnnotations();
  });
  layer.addEventListener("pointermove", (event) => {
    if (!activeStroke) return;
    event.preventDefault();
    const samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    (samples.length ? samples : [event]).forEach((sample) =>
      activeStroke.points.push(pointFromEvent(sample)),
    );
    renderAnnotations();
  });
  function endStroke() {
    if (!activeStroke) return;
    activeStroke = null;
    store.set(KEY.annotations, annotations);
    renderContextToolbar();
  }
  layer.addEventListener("pointerup", endStroke);
  layer.addEventListener("pointercancel", endStroke);
  layer.addEventListener("lostpointercapture", endStroke);

  function undoAnnotation() {
    const key = annotationKey();
    const list = annotations[key];
    if (!list || !list.length) return;
    if (tool === "blackout") {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (list[i].tool === "blackout") {
          list.splice(i, 1);
          break;
        }
      }
    } else {
      list.pop();
    }
    store.set(KEY.annotations, annotations);
    renderAnnotations();
    renderContextToolbar();
  }
  function clearAnnotations() {
    const key = annotationKey();
    const list = annotations[key] || [];
    const blackout = tool === "blackout";
    const relevant = blackout ? list.filter((s) => s.tool === "blackout") : list;
    if (!relevant.length) return;
    if (
      !window.confirm(
        blackout
          ? "Remove every blackout mask from this slide?"
          : "Clear all annotations on this slide?",
      )
    )
      return;
    annotations[key] = blackout ? list.filter((s) => s.tool !== "blackout") : [];
    store.set(KEY.annotations, annotations);
    renderAnnotations();
    renderContextToolbar();
  }

  /* ---------------------------------------------------------- edit mode */
  const EDITABLE = "h1,h2,h3,p,li,.lead,.eyebrow,.hero-subtitle,.microcopy,blockquote,figcaption";
  function editableNodes(root) {
    const nodes = [...root.querySelectorAll(EDITABLE)];
    return nodes.filter((n) => !nodes.some((o) => o !== n && n.contains(o)));
  }
  function applyEdits() {
    const active = slides[idx];
    if (!active) return;
    const saved = (store.get(KEY.edits, {}) || {})[String(idx + 1)] || {};
    editableNodes(active).forEach((node, position) => {
      node.dataset.dcEdit = String(position);
      if (!editMode) node.removeAttribute("contenteditable");
      if (saved[position] !== undefined) node.innerHTML = saved[position];
    });
  }
  deckEl.addEventListener(
    "click",
    (event) => {
      if (!editMode) return;
      const node = event.target.closest("[data-dc-edit]");
      if (!node || !slides[idx] || !slides[idx].contains(node)) return;
      deckEl.querySelectorAll("[contenteditable='true']").forEach((other) => {
        if (other !== node) other.contentEditable = "false";
      });
      node.contentEditable = "true";
      node.focus();
    },
    true,
  );
  const persistEdit = (node) => {
    if (!node || node.dataset.dcEdit === undefined) return;
    const edits = store.get(KEY.edits, {}) || {};
    const key = String(idx + 1);
    edits[key] = { ...(edits[key] || {}), [node.dataset.dcEdit]: node.innerHTML };
    store.set(KEY.edits, edits);
  };
  deckEl.addEventListener(
    "input",
    (event) => {
      if (editMode) persistEdit(event.target.closest("[data-dc-edit]"));
    },
    true,
  );
  deckEl.addEventListener(
    "blur",
    (event) => {
      if (editMode) persistEdit(event.target.closest("[data-dc-edit]"));
    },
    true,
  );
  function restoreSlide() {
    if (!window.confirm("Restore this slide's original text? The page will reload.")) return;
    const edits = store.get(KEY.edits, {}) || {};
    delete edits[String(idx + 1)];
    store.set(KEY.edits, edits);
    window.location.reload();
  }

  /* -------------------------------------------------------- toggle logic */
  function closePanels() {
    transitionsOpen = false;
    themeOpen = false;
    pdfOpen = false;
    renderPanel();
    refreshBar();
  }
  function setTransitions(open) {
    transitionsOpen = open;
    if (open) { pdfOpen = false; themeOpen = false; }
    renderPanel();
    refreshBar();
  }
  function setThemePanel(open) {
    themeOpen = open;
    if (open) { pdfOpen = false; transitionsOpen = false; }
    renderPanel();
    refreshBar();
  }
  function setPdf(open) {
    pdfOpen = open;
    if (open) { transitionsOpen = false; themeOpen = false; }
    renderPanel();
    refreshBar();
  }
  function setOverview(open) {
    if (open) {
      helpOpen = false;
    }
    overviewOpen = open;
    renderOverlay();
    refreshBar();
  }
  function setHelp(open) {
    if (open) overviewOpen = false;
    helpOpen = open;
    renderOverlay();
    refreshBar();
  }
  function toggleNotes() {
    if (!notesPanel) return;
    notesPanel.hidden = !notesPanel.hidden;
    notesOpen = !notesPanel.hidden;
    if (notesOpen && notesText) notesText.textContent = slides[idx].dataset.notes || "";
    refreshBar();
  }
  function setEditMode(next) {
    editMode = next;
    if (editMode) {
      setTool("none");
      scratchpadOpen && setScratchpad(false);
    } else {
      deckEl.querySelectorAll("[contenteditable='true']").forEach((n) => {
        n.contentEditable = "false";
      });
    }
    document.body.classList.toggle("dc-edit-mode", editMode);
    applyEdits();
    renderContextToolbar();
    refreshBar();
  }
  function setTool(next) {
    if (next !== "none" && editMode) setEditMode(false);
    tool = tool === next ? "none" : next;
    layer.classList.toggle("dc-active", tool !== "none");
    document.body.classList.toggle("dc-annotating", tool !== "none");
    renderContextToolbar();
    refreshBar();
  }
  function setScratchpad(open) {
    scratchpadOpen = open;
    scratchEl.hidden = !open;
    if (open) {
      closePanels();
      setEditMode(false);
      tool = "pen";
      layer.classList.add("dc-active");
      document.body.classList.add("dc-annotating");
      updateScratchLabel();
    } else if (tool !== "none") {
      tool = "none";
      layer.classList.remove("dc-active");
      document.body.classList.remove("dc-annotating");
    }
    renderAnnotations();
    renderContextToolbar();
    refreshBar();
  }
  function updateScratchLabel() {
    const p = scratchEl.querySelector("header p");
    if (p) p.textContent = `BLANK NOTES · SLIDE ${String(idx + 1).padStart(2, "0")}`;
  }
  function setControlsHidden(next) {
    controlsHidden = next;
    document.body.dataset.dcControlsHidden = String(next);
    revealZone.tabIndex = next ? 0 : -1;
    if (next) closePanels();
    setIcon(btnHideBar, next ? "panel-bottom-open" : "panel-bottom-close");
    btnHideBar.setAttribute(
      "aria-label",
      next ? "Keep control bar visible" : "Hide control bar",
    );
    btnHideBar.title = btnHideBar.getAttribute("aria-label");
  }
  function setFillWindow(next) {
    fillWindow = next;
    document.body.dataset.dcFullslide = String(next);
    setIcon(btnFill, next ? "minimize-2" : "maximize-2");
    btnFill.setAttribute(
      "aria-label",
      next ? "Restore framed slide" : "Fill window with slide",
    );
    btnFill.title = btnFill.getAttribute("aria-label");
    refreshBar();
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) {}
  }
  function toggleHideCurrent() {
    if (hiddenSet.has(idx)) hiddenSet.delete(idx);
    else hiddenSet.add(idx);
    store.set(KEY.hidden, [...hiddenSet].sort((a, b) => a - b));
    if (hiddenSet.has(idx) && !includeHidden) {
      const target = neighbour(idx, 1) !== idx ? neighbour(idx, 1) : neighbour(idx, -1);
      if (target !== idx) deck.go(target);
    }
    refreshBar();
    if (overviewOpen) renderOverlay();
  }
  function toggleIncludeHidden() {
    includeHidden = !includeHidden;
    store.set(KEY.includeHidden, includeHidden);
    if (!includeHidden && hiddenSet.has(idx)) {
      const target = neighbour(idx, 1) !== idx ? neighbour(idx, 1) : neighbour(idx, -1);
      if (target !== idx) deck.go(target);
    }
    refreshBar();
    if (overviewOpen) renderOverlay();
  }

  /* -------------------------------------------------------------- pdf */
  let pdfStatusEl = null;
  function runPdf() {
    const from = clampSlide(pdfRange.from);
    const to = clampSlide(pdfRange.to);
    slides.forEach((slide, i) => {
      const inRange = i + 1 >= from && i + 1 <= to && (includeHidden || !hiddenSet.has(i));
      slide.classList.toggle("dc-print-skip", !inRange);
    });
    setPdf(false);
    document.documentElement.dataset.dcPrint = "true";
    pdfStatusEl = $("div", "dc-print-status", `Preparing ${pdfCount()} slides…`);
    document.body.appendChild(pdfStatusEl);
    const finish = () => {
      document.documentElement.removeAttribute("data-dc-print");
      slides.forEach((slide) => slide.classList.remove("dc-print-skip"));
      if (pdfStatusEl) {
        pdfStatusEl.remove();
        pdfStatusEl = null;
      }
      window.removeEventListener("afterprint", finish);
    };
    window.addEventListener("afterprint", finish);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(async () => {
        try {
          await (document.fonts && document.fonts.ready);
        } catch (_) {}
        window.print();
      }),
    );
  }

  /* ------------------------------------------------------- bar refresh */
  function refreshBar() {
    const vis = visibleIndexes();
    const pos = vis.indexOf(idx);
    btnCounter.textContent = `${pos >= 0 ? pos + 1 : "H"} / ${vis.length}`;
    btnPrev.disabled = scratchpadOpen || neighbour(idx, -1) === idx;
    btnNext.disabled = scratchpadOpen || neighbour(idx, 1) === idx;
    btnNotes.classList.toggle("dc-on", !!notesPanel && !notesPanel.hidden);
    btnScratch.classList.toggle("dc-on", scratchpadOpen);
    btnEdit.classList.toggle("dc-on", editMode);
    btnEdit.disabled = scratchpadOpen;
    btnPen.classList.toggle("dc-on", tool === "pen");
    btnHl.classList.toggle("dc-on", tool === "hl");
    btnBlackout.classList.toggle("dc-on", tool === "blackout");
    btnTransitions.classList.toggle("dc-on", transitionsOpen);
    btnTheme.classList.toggle("dc-on", themeOpen);
    btnPdf.classList.toggle("dc-on", pdfOpen);
    btnTimer.classList.toggle("dc-on", timerOpen || timerRunning);
    btnFill.classList.toggle("dc-on", fillWindow);
    const hidden = hiddenSet.has(idx);
    setIcon(btnHideSlide, hidden ? "eye" : "eye-off");
    btnHideSlide.classList.toggle("dc-on", hidden);
    btnHideSlide.setAttribute("aria-label", hidden ? "Unhide this slide" : "Hide this slide");
    btnHideSlide.title = btnHideSlide.getAttribute("aria-label");
    btnHideSlide.disabled = scratchpadOpen;
    btnIncludeHidden.classList.toggle("dc-on", includeHidden);
    btnIncludeHidden.title = includeHidden
      ? "Skip hidden slides"
      : `Include ${hiddenSet.size} hidden slide${hiddenSet.size === 1 ? "" : "s"}`;
  }

  /* ----------------------------------------------------- slide changes */
  deck.subscribe((current) => {
    idx = current;
    progressEl.style.width = `${((current + 1) / total) * 100}%`;
    if (scratchpadOpen) setScratchpad(false);
    applyEdits();
    renderAnnotations();
    updateScratchLabel();
    if (notesOpen && notesText) notesText.textContent = slides[idx].dataset.notes || "";
    if (overviewOpen) renderOverlay();
    if (pdfOpen) renderPanel();
    renderContextToolbar();
    refreshBar();
  });

  /* -------------------------------------------------------- keyboard */
  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "escape") {
      if (timerOpen) return closeTimer();
      if (overviewOpen) return setOverview(false);
      if (helpOpen) return setHelp(false);
      if (transitionsOpen || themeOpen || pdfOpen) return closePanels();
      if (scratchpadOpen) return setScratchpad(false);
      if (tool !== "none") return setTool("none");
      if (editMode) return setEditMode(false);
      return;
    }
    if (event.repeat) return;
    if (key === "o") setOverview(!overviewOpen);
    else if (key === "e") setEditMode(!editMode);
    else if (key === "w") setScratchpad(!scratchpadOpen);
    else if (key === "v") setTransitions(!transitionsOpen);
    else if (key === "t") setThemePanel(!themeOpen);
    else if (key === "p") setTool("pen");
    else if (key === "h") setTool("hl");
    else if (key === "b") setTool("blackout");
    else if (key === "?") setHelp(!helpOpen);
  });

  /* ------------------------------------------------------------- init */
  applyTheme(theme);
  applyEdits();
  renderAnnotations();
  renderContextToolbar();
  renderPanel();
  renderOverlay();
  setControlsHidden(false);
  refreshBar();
})();
