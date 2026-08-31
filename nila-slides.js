/* nila-slides.js — interactive widgets for the ported NILA slides.
   Source: nila2.html <script>, with deck navigation / speaker-notes / overview
   code removed (index.html's app.js drives navigation). Element ids are
   namespaced with a `nila-` prefix to avoid clashes with the GLITCH deck. */
(() => {
  "use strict";
  if (!document.querySelector(".slide.nila")) return;

  const missionMessages = [
        { code: "0000", icon: "✅", label: "Systems normal" },
        { code: "0001", icon: "🪫", label: "Battery low" },
        { code: "0010", icon: "📷", label: "Camera ready" },
        { code: "0011", icon: "💥", label: "Camera damaged" },
        { code: "0100", icon: "🛠️", label: "Drill ready" },
        { code: "0101", icon: "⛏️", label: "Drill jammed" },
        { code: "0110", icon: "🧪", label: "Ice sample collected" },
        { code: "0111", icon: "🧂", label: "Salt detected" },
        { code: "1000", icon: "💧", label: "Liquid water detected" },
        { code: "1001", icon: "🧬", label: "Organic molecules detected" },
        {
          code: "1010",
          icon: "🦠",
          label: "Possible biological pattern",
          hot: true,
        },
        { code: "1011", icon: "🚨", label: "Mission emergency", hot: true },
        { code: "1100", icon: "☢️", label: "Radiation spike" },
        { code: "1101", icon: "🧊", label: "Surface crack opening" },
        { code: "1110", icon: "🌋", label: "Warm plume detected" },
        { code: "1111", icon: "🏠", label: "Return to shelter" },
      ];

  let toastEl = null;
  function showToast(text) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.style.cssText =
        "position:fixed;z-index:200;top:18px;left:50%;transform:translate(-50%,-16px);" +
        "padding:12px 17px;border-radius:12px;background:rgba(5,20,32,.96);" +
        "border:1px solid rgba(88,230,255,.3);color:#e9fbff;font-weight:700;" +
        "box-shadow:0 24px 70px rgba(0,0,0,.34);opacity:0;pointer-events:none;transition:.22s;";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translate(-50%,0)";
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translate(-50%,-16px)";
    }, 1600);
  }

// Fill decorative stacks and sphere-packing bubbles.
      document
        .querySelectorAll(".doubling-column .stack")
        .forEach((stack, i) => {
          if (stack.children.length === 0) {
            for (let j = 0; j < Math.min(2 ** (i + 1), 32); j++)
              stack.appendChild(document.createElement("span"));
          }
        });
      const packingBox = document.querySelector(".packing-box");
      for (let i = 1; i <= 16; i++) {
        const d = document.createElement("div");
        d.className = "sphere";
        d.textContent = i;
        packingBox.appendChild(d);
      }

      // One-light slide.
      const oneLight = document.getElementById("nila-oneLight");
      oneLight.onclick = () => oneLight.classList.toggle("red");
      function resetOneLight() {
        oneLight.classList.remove("red");
        showToast("Light reset to green");
      }

      // Human cards.
      const humanCards = [...document.querySelectorAll(".human-card")];
      humanCards.forEach(
        (c) =>
          (c.onclick = () => {
            c.classList.toggle("flipped");
            const one = c.classList.contains("flipped");
            c.textContent = one ? "1" : "0";
          }),
      );
      document.getElementById("nila-resetHumanCards").onclick = resetHumanCards;
      function resetHumanCards() {
        humanCards.forEach((c) => {
          c.classList.remove("flipped");
          c.textContent = "0";
        });
        showToast("Human transmitter reset");
      }

      // Mission codebook cards.
      const messageGrid = document.getElementById("nila-messageGrid");
      missionMessages.forEach((m, i) => {
        const c = document.createElement("article");
        c.className = `message-card${m.hot ? " hot" : ""}`;
        c.style.setProperty(
          "--card-color",
          i % 4 === 0
            ? "rgba(89,241,139,.15)"
            : i % 4 === 1
              ? "rgba(181,140,255,.15)"
              : i % 4 === 2
                ? "rgba(255,209,102,.13)"
                : "rgba(88,230,255,.13)",
        );
        c.innerHTML = `<div class="message-icon">${m.icon}</div><div class="message-label">${m.label}</div><div class="message-code">${m.code}</div>`;
        messageGrid.appendChild(c);
      });

      // Card game.
      let gameIndex = 8,
        gameState = [0, 0, 0, 0],
        gameCorrupt = -1;
      const gameBits = document.getElementById("nila-gameBits");
      function drawBitButtons(container, state, onToggle) {
        container.innerHTML = "";
        state.forEach((b, i) => {
          const btn = document.createElement("button");
          btn.className = `bit-button${b ? " one" : ""}${i === gameCorrupt ? " corrupted" : ""}`;
          btn.textContent = b;
          btn.setAttribute("aria-label", `Bit ${i + 1}: ${b}`);
          btn.onclick = () => onToggle(i);
          container.appendChild(btn);
        });
      }
      function renderGame() {
        const m = missionMessages[gameIndex];
        document.getElementById("nila-drawnIcon").textContent = m.icon;
        document.getElementById("nila-drawnLabel").textContent = m.label;
        drawBitButtons(gameBits, gameState, (i) => {
          gameState[i] ^= 1;
          gameCorrupt = -1;
          renderGame();
          document.getElementById("nila-gameStatus").className = "status-box";
          document.getElementById("nila-gameStatus").textContent =
            "Build the four-flash message.";
        });
      }
      document.getElementById("nila-newMessage").onclick = () => {
        let n;
        do {
          n = Math.floor(Math.random() * missionMessages.length);
        } while (n === gameIndex);
        gameIndex = n;
        gameState = [0, 0, 0, 0];
        gameCorrupt = -1;
        renderGame();
        const s = document.getElementById("nila-gameStatus");
        s.className = "status-box";
        s.textContent = "New secret card drawn.";
      };
      document.getElementById("nila-checkEncoding").onclick = () => {
        const actual = gameState.join("");
        const target = missionMessages[gameIndex].code;
        const s = document.getElementById("nila-gameStatus");
        if (actual === target) {
          s.className = "status-box good";
          s.textContent = `Correct: ${actual} ✓`;
        } else {
          const d = hamming(actual, target);
          s.className = "status-box bad";
          s.textContent = `Not yet—${d} light${d === 1 ? "" : "s"} differ.`;
        }
      };
      document.getElementById("nila-corruptMessage").onclick = () => {
        const target = missionMessages[gameIndex].code.split("").map(Number);
        gameState = target;
        gameCorrupt = Math.floor(Math.random() * 4);
        gameState[gameCorrupt] ^= 1;
        renderGame();
        const received = gameState.join("");
        const match = missionMessages.find((m) => m.code === received);
        const s = document.getElementById("nila-gameStatus");
        s.className = "status-box amber";
        s.textContent = match
          ? `Received ${received}: it now looks like “${match.label}”.`
          : `Received ${received}: not in the 16-card codebook.`;
      };
      function resetCardGame() {
        gameIndex = 8;
        gameState = [0, 0, 0, 0];
        gameCorrupt = -1;
        renderGame();
        const s = document.getElementById("nila-gameStatus");
        s.className = "status-box";
        s.textContent = "Tap lights to build the four-flash message.";
        showToast("Card game reset");
      }
      renderGame();

      // Capacity slider.
      const capacitySlider = document.getElementById("nila-capacitySlider");
      function updateCapacity() {
        const n = Number(capacitySlider.value),
          cap = 2 ** n;
        document.getElementById("nila-capacityResult").innerHTML =
          `${cap} <span>patterns</span>`;
        const v = document.getElementById("nila-capacityVerdict");
        v.textContent = cap >= 16 ? "Enough for 16 ✓" : "Not enough for 16";
        v.style.color = cap >= 16 ? "var(--green)" : "var(--red)";
      }
      capacitySlider.oninput = updateCapacity;
      function resetCapacity() {
        capacitySlider.value = 4;
        updateCapacity();
        showToast("Capacity lab reset");
      }
      updateCapacity();

      // Parity lab: six bits, enforce even parity initially.
      let parityState = [1, 0, 0, 1, 0],
        parityCorrupt = -1;
      const parityBits = document.getElementById("nila-parityBits");
      function renderParity() {
        gameCorrupt = parityCorrupt;
        drawBitButtons(parityBits, parityState, (i) => {
          parityState[i] ^= 1;
          parityCorrupt = -1;
          renderParity();
        });
        gameCorrupt = -1;
        const count = parityState.reduce((a, b) => a + b, 0);
        document.getElementById("nila-parityCount").textContent =
          `Green lights: ${count}`;
        const v = document.getElementById("nila-parityVerdict");
        const even = count % 2 === 0;
        v.textContent = even
          ? "Watchdog satisfied ✓"
          : "Watchdog barking! Error detected";
        v.classList.toggle("bad", !even);
      }
      document.getElementById("nila-parityFlip").onclick = () => {
        parityCorrupt = Math.floor(Math.random() * 5);
        parityState[parityCorrupt] ^= 1;
        renderParity();
      };
      function resetParity() {
        parityState = [1, 0, 0, 1, 0];
        parityCorrupt = -1;
        renderParity();
        showToast("Parity lab reset");
      }
      renderParity();

      // Distance lab.
      function hamming(a, b) {
        let d = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++)
          if (a[i] !== b[i]) d++;
        return d + Math.abs(a.length - b.length);
      }
      document.querySelectorAll("[data-pair]").forEach(
        (btn) =>
          (btn.onclick = () => {
            const [a, b] = btn.dataset.pair.split(",");
            document.getElementById("nila-distanceA").textContent = a;
            document.getElementById("nila-distanceB").textContent = b;
            document.getElementById("nila-distanceNumber").textContent = hamming(
              a,
              b,
            );
          }),
      );
      function resetDistance() {
        document.getElementById("nila-distanceA").textContent = "1010";
        document.getElementById("nila-distanceB").textContent = "1011";
        document.getElementById("nila-distanceNumber").textContent = "1";
        showToast("Distance example reset");
      }

      // Inspector maps (Hamming(7,4): checks at 1, 2, 4; data at 3, 5, 6, 7).
      const watcherSets = {
        1: [1, 3, 5, 7],
        2: [2, 3, 6, 7],
        4: [4, 5, 6, 7],
      };
      function watchedBy(pos) {
        return [1, 2, 4].filter((k) => watcherSets[k].includes(pos));
      }
      const positionMap = document.getElementById("nila-positionMap");
      for (let p = 1; p <= 7; p++) {
        const c = document.createElement("div");
        const check = [1, 2, 4].includes(p);
        c.className = `position-cell ${check ? "check" : "data"}`;
        c.dataset.watch = watchedBy(p).join("+");
        c.innerHTML = `<small>${check ? "CHECK" : "DATA"}</small><strong>${p}</strong>`;
        positionMap.appendChild(c);
      }
      function buildInspectors(container, statuses = {}) {
        container.innerHTML = "";
        [1, 2, 4].forEach((k) => {
          const d = document.createElement("article");
          const st = statuses[k] || "";
          d.className = `inspector ${st}`;
          d.innerHTML = `<div class="inspector-avatar">${st === "complain" ? "🚨" : st === "ok" ? "🙂" : "🕵️"}</div><strong>Inspector ${k}</strong><small>watches ${watcherSets[k].join(", ")}</small>`;
          container.appendChild(d);
        });
      }
      buildInspectors(document.getElementById("nila-inspectorCards"));

      // Encoding sequence (message 1010 → codeword 1011010).
      const dataBits = { 3: 1, 5: 0, 6: 1, 7: 0 };
      const completeCode = [1, 0, 1, 1, 0, 1, 0];
      let encodeStage = 0;
      function renderSlots(container, values, wrong = -1) {
        container.innerHTML = "";
        for (let p = 1; p <= 7; p++) {
          const check = [1, 2, 4].includes(p);
          const val = values[p - 1];
          const s = document.createElement("div");
          s.className = `slot ${check ? "check" : "data"}${val === "?" ? " unknown" : ""}${p === wrong ? " wrong" : ""}`;
          s.innerHTML = `<span class="role">${check ? "CHECK" : "DATA"}</span><span class="value">${val}</span><span class="pos">position ${p}</span>`;
          container.appendChild(s);
        }
      }
      function renderEncode() {
        let values = Array(7).fill("?");
        if (encodeStage >= 1)
          Object.entries(dataBits).forEach(
            ([p, v]) => (values[Number(p) - 1] = v),
          );
        if (encodeStage >= 2) values = completeCode;
        renderSlots(document.getElementById("nila-encodeSlots"), values);
        const hint = document.getElementById("nila-encodeHint");
        if (encodeStage === 0)
          hint.innerHTML =
            'Place data in positions <span class="accent">3, 5, 6, 7</span>.';
        else if (encodeStage === 1)
          hint.innerHTML =
            'Choose check bits so each inspector sees an <span class="accent">even</span> number of 1s.';
        else
          hint.innerHTML =
            'Protected transmission: <span class="accent">1011010</span>';
      }
      document.getElementById("nila-encodeStep").onclick = () => {
        encodeStage = Math.min(2, encodeStage + 1);
        renderEncode();
      };
      document.getElementById("nila-encodeReveal").onclick = () => {
        encodeStage = 2;
        renderEncode();
      };
      document.getElementById("nila-encodeReset").onclick = resetEncode;
      function resetEncode() {
        encodeStage = 0;
        renderEncode();
        showToast("Encoding activity reset");
      }
      renderEncode();

      // Syndrome demo (codeword 1011010 with position 6 flipped → 1011000).
      const received = [1, 0, 1, 1, 0, 0, 0];
      let syndromeStage = 0;
      function parityFail(bits, set) {
        return set.reduce((sum, p) => sum + bits[p - 1], 0) % 2 === 1;
      }
      function renderSyndrome() {
        renderSlots(
          document.getElementById("nila-receivedSlots"),
          syndromeStage === 2 ? completeCode : received,
          syndromeStage === 0 ? -1 : syndromeStage === 1 ? 6 : -1,
        );
        let statuses = {};
        if (syndromeStage >= 1)
          [1, 2, 4].forEach(
            (k) =>
              (statuses[k] = parityFail(received, watcherSets[k])
                ? "complain"
                : "ok"),
          );
        buildInspectors(
          document.getElementById("nila-syndromeInspectors"),
          statuses,
        );
        document.getElementById("nila-syndromeNumber").textContent =
          syndromeStage === 0
            ? "?"
            : syndromeStage === 1
              ? "2 + 4 = 6"
              : "repaired";
        document.getElementById("nila-syndromeNumber").style.fontSize =
          syndromeStage === 2 ? "clamp(44px,6vw,86px)" : "";
      }
      document.getElementById("nila-runChecks").onclick = () => {
        syndromeStage = 1;
        renderSyndrome();
      };
      document.getElementById("nila-repairError").onclick = () => {
        syndromeStage = 2;
        renderSyndrome();
      };
      document.getElementById("nila-resetSyndrome").onclick = resetSyndrome;
      function resetSyndrome() {
        syndromeStage = 0;
        renderSyndrome();
        showToast("Syndrome demo reset");
      }
      renderSyndrome();

      // Final challenge (codeword 1110000 for "1000" with position 7 flipped → 1110001).
      const finalReceived = [1, 1, 1, 0, 0, 0, 1];
      let finalStage = 0;
      const finalInspectors = document.getElementById("nila-finalInspectors");
      function renderFinal() {
        finalInspectors.innerHTML = "";
        [1, 2, 4].forEach((k) => {
          const fail = parityFail(finalReceived, watcherSets[k]);
          const b = document.createElement("div");
          b.className = `inspector-light${finalStage >= 1 && fail ? " fail" : ""}`;
          b.innerHTML = `<strong>${k}</strong><span>${finalStage === 0 ? "not checked" : fail ? "COMPLAINS" : "OK"}</span>`;
          finalInspectors.appendChild(b);
        });
        const a = document.getElementById("nila-finalAnswer");
        if (finalStage === 0) a.textContent = "";
        else if (finalStage === 1) a.textContent = "1 + 2 + 4 = 7";
        else
          a.innerHTML =
            '1110001 → 1000 → <span style="color:var(--cyan)">LIQUID WATER DETECTED</span>';
      }
      document.getElementById("nila-finalRun").onclick = () => {
        finalStage = 1;
        renderFinal();
      };
      document.getElementById("nila-finalRepair").onclick = () => {
        finalStage = 2;
        renderFinal();
      };
      document.getElementById("nila-finalReset").onclick = resetFinal;
      function resetFinal() {
        finalStage = 0;
        renderFinal();
        showToast("Final challenge reset");
      }
      renderFinal();

      // Printable mission cards.
      function printMissionCards() {
        const w = window.open("", "_blank", "width=1000,height=760");
        if (!w) {
          showToast("Allow pop-ups to print the cards");
          return;
        }
        const cards = missionMessages
          .map(
            (m) =>
              `<article><div class="icon">${m.icon}</div><h2>${m.label}</h2><code>${m.code}</code></article>`,
          )
          .join("");
        const bitCards = Array.from(
          { length: 8 },
          (_, i) =>
            `<div class="bit ${i % 2 ? "green" : "red"}"><b>${i % 2 ? 1 : 0}</b><span>${i % 2 ? "GREEN" : "RED"}</span></div>`,
        ).join("");
        w.document.write(
          `<!doctype html><html><head><title>NILA Mission Cards</title><style>@page{size:A4;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#10202a}h1{text-align:center;margin:0 0 6mm}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}article{border:2px dashed #587180;border-radius:8px;padding:4mm;min-height:44mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-inside:avoid}.icon{font-size:32px}h2{font-size:14px;margin:3mm 0}code{font-size:19px;font-weight:bold;letter-spacing:3px}.bits{display:grid;grid-template-columns:repeat(5,1fr);gap:5mm;margin-top:8mm;page-break-before:always}.bit{height:70mm;border:2px dashed #444;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white}.bit.red{background:#d94359}.bit.green{background:#31b96a}.bit b{font-size:48px}.bit span{font-weight:bold}p{text-align:center;font-size:12px}@media print{button{display:none}}</style></head><body><h1>NILA Mission Codebook Cards</h1><p>Cut along dashed borders. Red = 0, Green = 1.</p><div class="grid">${cards}</div><div class="bits">${bitCards}</div><script>window.onload=()=>window.print()<\/script></body></html>`,
        );
        w.document.close();
      }
      window.printMissionCards = printMissionCards;
})();
