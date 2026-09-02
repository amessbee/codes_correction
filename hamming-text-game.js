(() => {
  "use strict";

  const WEBPAGE_SOURCE = `<!doctype html>
<html lang="en">
<head><title>World Wide Web</title></head>
<body>
  <h1>World Wide Web</h1>
  <p>Welcome to a tiny recreation of the first website.</p>
  <p>It is 1991: no pop-ups, no autoplay, no cookie banner—just links.</p>
  <h2>Things you can explore</h2>
  <ul>
    <li><a href="#">What is hypertext?</a></li>
    <li><a href="#">People who helped build the Web</a></li>
    <li><a href="#">How to make your own page</a></li>
    <li><a href="#">A surprisingly short list of websites</a></li>
  </ul>
  <p><em>This locally authored classroom recreation is inspired by CERN's first website.</em></p>
</body>
</html>`;

  const BOOK_PREVIEW = `WAR AND PEACE\n\nBy Leo Tolstoy\n\nBOOK ONE: 1805\n\nCHAPTER I\n\n“Well, Prince, so Genoa and Lucca are now just family estates of the Buonapartes...”`;
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder("utf-8", { fatal: false });
  const panels = [...document.querySelectorAll("[data-hamming-game]")];
  const states = new WeakMap();

  const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));
  const bit = (word, position) => (word >> (position - 1)) & 1;

  function encodeNibble(nibble) {
    let word = 0;
    const set = (position, value) => { if (value) word |= 1 << (position - 1); };
    set(3, (nibble >> 3) & 1);
    set(5, (nibble >> 2) & 1);
    set(6, (nibble >> 1) & 1);
    set(7, nibble & 1);
    set(1, bit(word, 3) ^ bit(word, 5) ^ bit(word, 7));
    set(2, bit(word, 3) ^ bit(word, 6) ^ bit(word, 7));
    set(4, bit(word, 5) ^ bit(word, 6) ^ bit(word, 7));
    return word;
  }

  function decodeWord(received) {
    const syndrome =
      (bit(received, 1) ^ bit(received, 3) ^ bit(received, 5) ^ bit(received, 7)) +
      2 * (bit(received, 2) ^ bit(received, 3) ^ bit(received, 6) ^ bit(received, 7)) +
      4 * (bit(received, 4) ^ bit(received, 5) ^ bit(received, 6) ^ bit(received, 7));
    const repaired = syndrome ? received ^ (1 << (syndrome - 1)) : received;
    return {
      nibble:
        (bit(repaired, 3) << 3) |
        (bit(repaired, 5) << 2) |
        (bit(repaired, 6) << 1) |
        bit(repaired, 7),
      syndrome,
      repaired,
    };
  }

  function extractNibble(word) {
    return (
      (bit(word, 3) << 3) |
      (bit(word, 5) << 2) |
      (bit(word, 6) << 1) |
      bit(word, 7)
    );
  }

  function verifyCodec() {
    for (let nibble = 0; nibble < 16; nibble++) {
      const encoded = encodeNibble(nibble);
      if (decodeWord(encoded).nibble !== nibble) throw new Error("Hamming codec self-check failed");
      for (let position = 0; position < 7; position++) {
        if (decodeWord(encoded ^ (1 << position)).nibble !== nibble) {
          throw new Error("Hamming single-error repair self-check failed");
        }
      }
    }
  }

  verifyCodec();

  function wordBits(word) {
    return Array.from({ length: 7 }, (_, index) => bit(word, index + 1)).join("");
  }

  function formatBytes(bytes) {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
    return `${bytes} B`;
  }

  function setBusy(panel, busy, label = "") {
    panel.classList.toggle("is-busy", busy);
    panel.querySelector("[data-noise-rate]").disabled = busy;
    if (busy) {
      panel.querySelectorAll("button[data-hamming-action]").forEach((button) => {
        button.disabled = true;
      });
    }
    if (busy) panel.querySelector("[data-game-status]").textContent = label;
  }

  function updateButtons(panel, stage, busy = false) {
    panel.querySelectorAll("button[data-hamming-action]").forEach((button) => {
      const action = button.dataset.hammingAction;
      button.disabled = busy ||
        (action === "corrupt" && stage < 1) ||
        (action === "repair" && stage < 2);
    });
  }

  function setProgress(panel, fraction) {
    panel.querySelector("[data-game-progress]").style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  }

  function setMetric(panel, name, value) {
    const target = panel.querySelector(`[data-metric="${name}"]`);
    if (target) target.textContent = value;
  }

  function showBitSample(panel, original, damaged, repaired = null) {
    const sample = panel.querySelector("[data-bit-sample]");
    const count = Math.min(8, original.length);
    const rows = [];
    for (let index = 0; index < count; index++) {
      const before = wordBits(original[index]);
      const after = wordBits(damaged ? damaged[index] : original[index]);
      const fixed = repaired ? wordBits(repaired[index]) : "·······";
      rows.push(`<span>${before}</span><b>→</b><span class="${before === after ? "" : "damaged-bits"}">${after}</span><b>→</b><span class="${repaired && before === fixed ? "fixed-bits" : ""}">${fixed}</span>`);
    }
    sample.innerHTML = rows.join("");
  }

  function getSourceText(panel) {
    const type = panel.dataset.source;
    if (type === "web") return WEBPAGE_SOURCE;
    if (type === "book") return window.__WAR_AND_PEACE_TEXT__ || "";
    return panel.querySelector("[data-source-input]").value;
  }

  function getNoiseRate(panel) {
    return Number(panel.querySelector("[data-noise-rate]").value) / 100;
  }

  function updateNoiseControl(panel) {
    const percentage = Number(panel.querySelector("[data-noise-rate]").value);
    panel.querySelector("[data-noise-output]").textContent = `${percentage}%`;
    panel.querySelector('[data-hamming-action="corrupt"]').textContent = `2 · Flip ${percentage}%`;
  }

  function showDecodedOutput(output, text, placeholder) {
    if (output.tagName === "IFRAME") output.srcdoc = text || placeholder;
    else output.textContent = text ? text.slice(0, 2400) : placeholder;
  }

  function damagedPreview(state) {
    const byteCount = Math.min(state.bytes.length, 2400);
    const bytes = new Uint8Array(byteCount);
    for (let index = 0; index < byteCount; index++) {
      bytes[index] =
        (extractNibble(state.damaged[index * 2]) << 4) |
        extractNibble(state.damaged[index * 2 + 1]);
    }
    return textDecoder.decode(bytes);
  }

  async function loadBook(panel) {
    if (window.__WAR_AND_PEACE_TEXT__) return true;
    panel.querySelector("[data-game-status]").textContent = "Loading the complete 3.36 MB book…";
    return new Promise((resolve) => {
      const existing = document.querySelector('script[data-war-and-peace]');
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.__WAR_AND_PEACE_TEXT__)), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "war-and-peace-data.js";
      script.dataset.warAndPeace = "true";
      script.onload = () => resolve(Boolean(window.__WAR_AND_PEACE_TEXT__));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async function encode(panel) {
    const state = states.get(panel);
    setBusy(panel, true, panel.dataset.source === "book"
      ? "Loading the complete 3.36 MB book…"
      : "Preparing source text…");
    if (panel.dataset.source === "book" && !(await loadBook(panel))) {
      panel.querySelector("[data-game-status]").textContent = "The local book file could not be loaded.";
      setBusy(panel, false);
      updateButtons(panel, 0);
      return;
    }
    const source = getSourceText(panel);
    const bytes = textEncoder.encode(source);
    const encoded = new Uint8Array(bytes.length * 2);
    setBusy(panel, true, `Encoding ${formatBytes(bytes.length)} with Hamming(7,4)…`);
    setProgress(panel, 0);
    for (let index = 0; index < bytes.length; index++) {
      encoded[index * 2] = encodeNibble(bytes[index] >> 4);
      encoded[index * 2 + 1] = encodeNibble(bytes[index] & 15);
      if (index > 0 && index % 120_000 === 0) {
        setProgress(panel, index / bytes.length);
        await nextFrame();
      }
    }
    state.source = source;
    state.bytes = bytes;
    state.encoded = encoded;
    state.damaged = null;
    state.repairedWords = null;
    setMetric(panel, "source", formatBytes(bytes.length));
    setMetric(panel, "encoded", formatBytes(encoded.length * 7 / 8));
    setMetric(panel, "flips", "0");
    setMetric(panel, "recovery", "—");
    setProgress(panel, 1);
    showBitSample(panel, encoded, null);
    panel.querySelector("[data-game-status]").textContent = `${bytes.length.toLocaleString()} bytes became ${encoded.length.toLocaleString()} seven-bit codewords.`;
    panel.dataset.stage = "1";
    setBusy(panel, false);
    updateButtons(panel, 1);
  }

  async function corrupt(panel) {
    const state = states.get(panel);
    if (!state.encoded) return;
    const noiseRate = getNoiseRate(panel);
    const noisePercentage = noiseRate * 100;
    const damaged = state.encoded.slice();
    let flips = 0;
    let untouched = 0;
    let singleError = 0;
    let multipleErrors = 0;
    setBusy(panel, true, `Radiation is independently flipping ${noisePercentage}% of transmitted bits…`);
    setProgress(panel, 0);
    for (let index = 0; index < damaged.length; index++) {
      let mask = 0;
      let blockFlips = 0;
      for (let position = 0; position < 7; position++) {
        if (Math.random() < noiseRate) {
          mask |= 1 << position;
          blockFlips += 1;
        }
      }
      damaged[index] ^= mask;
      flips += blockFlips;
      if (blockFlips === 0) untouched += 1;
      else if (blockFlips === 1) singleError += 1;
      else multipleErrors += 1;
      if (index > 0 && index % 220_000 === 0) {
        setProgress(panel, index / damaged.length);
        await nextFrame();
      }
    }
    state.damaged = damaged;
    state.repairedWords = null;
    state.noise = { flips, untouched, singleError, multipleErrors };
    const transmittedBits = damaged.length * 7;
    setMetric(panel, "flips", `${flips.toLocaleString()} (${(flips / transmittedBits * 100).toFixed(2)}%)`);
    setMetric(panel, "recovery", "not decoded");
    setProgress(panel, 1);
    showBitSample(panel, state.encoded, damaged);
    showDecodedOutput(
      panel.querySelector("[data-damaged-output]"),
      damagedPreview(state),
      "Damaged text will appear here.",
    );
    panel.querySelector("[data-game-status]").textContent = `${multipleErrors.toLocaleString()} codewords received two or more flips—beyond this code's guarantee.`;
    panel.dataset.stage = "2";
    setBusy(panel, false);
    updateButtons(panel, 2);
  }

  async function repair(panel) {
    const state = states.get(panel);
    if (!state.damaged) return;
    const decoded = new Uint8Array(state.bytes.length);
    const repairedWords = new Uint8Array(state.damaged.length);
    let syndromeRepairs = 0;
    let exactBytes = 0;
    setBusy(panel, true, "Running parity checks, repairing, and comparing every byte…");
    setProgress(panel, 0);
    for (let index = 0; index < decoded.length; index++) {
      const high = decodeWord(state.damaged[index * 2]);
      const low = decodeWord(state.damaged[index * 2 + 1]);
      repairedWords[index * 2] = high.repaired;
      repairedWords[index * 2 + 1] = low.repaired;
      if (high.syndrome) syndromeRepairs += 1;
      if (low.syndrome) syndromeRepairs += 1;
      decoded[index] = (high.nibble << 4) | low.nibble;
      if (decoded[index] === state.bytes[index]) exactBytes += 1;
      if (index > 0 && index % 180_000 === 0) {
        setProgress(panel, index / decoded.length);
        await nextFrame();
      }
    }
    const recovered = textDecoder.decode(decoded);
    const recovery = state.bytes.length ? exactBytes / state.bytes.length * 100 : 100;
    state.repairedWords = repairedWords;
    setMetric(panel, "recovery", `${recovery.toFixed(2)}% exact`);
    setProgress(panel, 1);
    showBitSample(panel, state.encoded, state.damaged, repairedWords);
    showDecodedOutput(
      panel.querySelector("[data-recovered-output]"),
      recovered,
      "Recovered text will appear here.",
    );
    panel.querySelector("[data-game-status]").textContent = `${syndromeRepairs.toLocaleString()} codewords triggered a repair; ${exactBytes.toLocaleString()} of ${state.bytes.length.toLocaleString()} bytes are exact.`;
    panel.dataset.stage = "3";
    setBusy(panel, false);
    updateButtons(panel, 3);
  }

  function reset(panel) {
    const state = states.get(panel);
    state.bytes = null;
    state.encoded = null;
    state.damaged = null;
    state.repairedWords = null;
    state.noise = null;
    panel.dataset.stage = "0";
    setProgress(panel, 0);
    setMetric(panel, "source", panel.dataset.source === "book" ? "3.36 MB" : "—");
    setMetric(panel, "encoded", "—");
    setMetric(panel, "flips", "—");
    setMetric(panel, "recovery", "—");
    panel.querySelector("[data-game-status]").textContent = "Ready. Encode the source to begin.";
    panel.querySelector("[data-bit-sample]").innerHTML = "<em>original</em><b>→</b><em>damaged</em><b>→</b><em>repaired</em>";
    const webpagePlaceholder = "<p style='font-family:system-ui;padding:1rem;color:#667'>Preview will appear here.</p>";
    showDecodedOutput(
      panel.querySelector("[data-damaged-output]"),
      "",
      panel.dataset.source === "web" ? webpagePlaceholder : "Damaged text will appear here.",
    );
    showDecodedOutput(
      panel.querySelector("[data-recovered-output]"),
      "",
      panel.dataset.source === "web" ? webpagePlaceholder : "Recovered text will appear here.",
    );
    updateButtons(panel, 0);
  }

  panels.forEach((panel) => {
    states.set(panel, {});
    if (panel.dataset.source === "web") {
      const sourceFrame = panel.querySelector("[data-source-preview]");
      sourceFrame.srcdoc = WEBPAGE_SOURCE;
    } else if (panel.dataset.source === "book") {
      panel.querySelector("[data-source-preview]").textContent = BOOK_PREVIEW;
    }
    panel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-hamming-action]");
      if (!button) return;
      const action = button.dataset.hammingAction;
      if (action === "encode") encode(panel);
      else if (action === "corrupt") corrupt(panel);
      else if (action === "repair") repair(panel);
      else if (action === "reset") reset(panel);
    });
    panel.querySelector("[data-source-input]")?.addEventListener("input", () => reset(panel));
    panel.querySelector("[data-noise-rate]").addEventListener("input", () => updateNoiseControl(panel));
    updateNoiseControl(panel);
    reset(panel);
  });
})();
