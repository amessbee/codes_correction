(() => {
  "use strict";

  const DEFAULT_WORDS = [
    "0000000",
    "1101001",
    "0101010",
    "1000011",
    "1001100",
    "0100101",
    "1100110",
    "0001111",
    "1110000",
    "0011001",
    "1011010",
    "0110011",
    "0111100",
    "1010101",
    "0010110",
    "1111111",
  ];

  const NS = "http://www.w3.org/2000/svg";
  const form = document.getElementById("wordForm");
  const input = document.getElementById("wordInput");
  const inputCount = document.getElementById("inputCount");
  const inputError = document.getElementById("inputError");
  const restoreButton = document.getElementById("restoreButton");
  const arrangeButton = document.getElementById("arrangeButton");
  const themeToggle = document.getElementById("themeToggle");
  const graphStage = document.getElementById("graphStage");
  const svg = document.getElementById("neighborGraph");
  const graphDescription = document.getElementById("graphDescription");
  const graphSummary = document.getElementById("graphSummary");
  const selectionReadout = document.getElementById("selectionReadout");

  let graph = null;
  let animationFrame = null;
  let resizeTimer = null;
  let drag = null;

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });
    return element;
  }

  function hammingDistance(a, b) {
    let distance = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) distance += 1;
    }
    return distance;
  }

  function parseWords(raw) {
    const tokens = raw.trim().split(/[\s,;]+/).filter(Boolean);
    const invalid = tokens.find((word) => !/^[01]+$/.test(word));
    if (invalid) {
      throw new Error(`“${invalid}” is not a binary string. Use only 0 and 1.`);
    }

    const words = [...new Set(tokens)];
    if (words.length < 2) {
      throw new Error("Enter at least two different binary strings.");
    }
    const bitLength = words[0].length;
    const wrongLength = words.find((word) => word.length !== bitLength);
    if (wrongLength) {
      throw new Error(
        `All strings must have ${bitLength} bits. “${wrongLength}” has ${wrongLength.length}.`,
      );
    }
    return { words, duplicateCount: tokens.length - words.length };
  }

  function buildGraph(words) {
    const distances = Array.from({ length: words.length }, () =>
      Array(words.length).fill(0),
    );
    for (let i = 0; i < words.length; i += 1) {
      for (let j = i + 1; j < words.length; j += 1) {
        const distance = hammingDistance(words[i], words[j]);
        distances[i][j] = distance;
        distances[j][i] = distance;
      }
    }

    const nodes = words.map((word, index) => {
      const candidates = distances[index].filter((_, other) => other !== index);
      const nearestDistance = Math.min(...candidates);
      const nearest = distances[index]
        .map((distance, other) => (other !== index && distance === nearestDistance ? other : -1))
        .filter((other) => other >= 0);
      return {
        index,
        word,
        displayWord: word.length > 15 ? `${word.slice(0, 7)}…${word.slice(-7)}` : word,
        nearestDistance,
        nearest,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      };
    });

    const edgeMap = new Map();
    nodes.forEach((node) => {
      node.nearest.forEach((other) => {
        const source = Math.min(node.index, other);
        const target = Math.max(node.index, other);
        const key = `${source}:${target}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source,
            target,
            distance: distances[source][target],
          });
        }
      });
    });

    const edges = [...edgeMap.values()].map((edge) => ({
      ...edge,
      mutual:
        nodes[edge.source].nearest.includes(edge.target) &&
        nodes[edge.target].nearest.includes(edge.source),
    }));

    return {
      words,
      nodes,
      edges,
      width: 0,
      height: 0,
      selected: null,
      edgeElements: [],
      labelElements: [],
      nodeElements: [],
    };
  }

  function measureGraph() {
    const rect = graphStage.getBoundingClientRect();
    return {
      width: Math.max(300, Math.round(rect.width)),
      height: Math.max(500, Math.round(rect.height)),
    };
  }

  function seedPositions() {
    if (!graph) return;
    const { width, height, nodes } = graph;
    const radiusX = Math.max(72, width * 0.37);
    const radiusY = Math.max(145, height * 0.38);
    const centerX = width / 2;
    const centerY = height / 2;
    const phase = -Math.PI / 2;

    nodes.forEach((node, index) => {
      const angle = phase + (Math.PI * 2 * index) / nodes.length;
      const ripple = 1 + 0.055 * Math.sin(index * 2.399);
      node.x = centerX + Math.cos(angle) * radiusX * ripple;
      node.y = centerY + Math.sin(angle) * radiusY * ripple;
      node.vx = 0;
      node.vy = 0;
    });
  }

  function edgeGeometry(edge) {
    const a = graph.nodes[edge.source];
    const b = graph.nodes[edge.target];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const direction = ((edge.source * 19 + edge.target * 31) % 5) - 2;
    const bend = direction * Math.min(12, length * 0.035);
    const controlX = (a.x + b.x) / 2 - (dy / length) * bend;
    const controlY = (a.y + b.y) / 2 + (dx / length) * bend;
    const t = 0.3 + (((edge.source * 23 + edge.target * 37) % 9) / 8) * 0.4;
    const u = 1 - t;
    return {
      path: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
      labelX: (u * u * a.x + 2 * u * t * controlX + t * t * b.x).toFixed(2),
      labelY: (u * u * a.y + 2 * u * t * controlY + t * t * b.y).toFixed(2),
    };
  }

  function updateGeometry() {
    if (!graph) return;
    graph.edges.forEach((edge, index) => {
      const geometry = edgeGeometry(edge);
      graph.edgeElements[index].setAttribute("d", geometry.path);
      graph.labelElements[index].setAttribute("x", geometry.labelX);
      graph.labelElements[index].setAttribute("y", geometry.labelY);
    });
    graph.nodes.forEach((node, index) => {
      graph.nodeElements[index].setAttribute(
        "transform",
        `translate(${node.x.toFixed(2)} ${node.y.toFixed(2)})`,
      );
    });
  }

  function updateSelection() {
    if (!graph) return;
    const selected = graph.selected;
    const connected = new Set();
    if (selected != null) {
      connected.add(selected);
      graph.edges.forEach((edge) => {
        if (edge.source === selected) connected.add(edge.target);
        if (edge.target === selected) connected.add(edge.source);
      });
    }

    graph.edges.forEach((edge, index) => {
      const active = selected != null && (edge.source === selected || edge.target === selected);
      graph.edgeElements[index].classList.toggle("is-active", active);
      graph.edgeElements[index].classList.toggle("is-dim", selected != null && !active);
      graph.labelElements[index].classList.toggle("is-active", active);
      graph.labelElements[index].classList.toggle("is-dim", selected != null && !active);
    });

    graph.nodes.forEach((node, index) => {
      const element = graph.nodeElements[index];
      element.classList.toggle("is-selected", index === selected);
      element.classList.toggle("is-neighbor", selected != null && connected.has(index) && index !== selected);
      element.classList.toggle("is-dim", selected != null && !connected.has(index));
    });

    if (selected == null) {
      selectionReadout.textContent = "Select a node to spotlight its closest connections.";
      return;
    }

    const node = graph.nodes[selected];
    const neighborWords = node.nearest.map((index) => graph.nodes[index].word);
    const shown = neighborWords.slice(0, 10).join(", ");
    const rest = neighborWords.length > 10 ? `, plus ${neighborWords.length - 10} more` : "";
    selectionReadout.replaceChildren();
    const code = document.createElement("code");
    code.textContent = node.word;
    selectionReadout.append(
      code,
      document.createTextNode(
        ` has ${neighborWords.length} closest ${neighborWords.length === 1 ? "neighbor" : "neighbors"} at distance ${node.nearestDistance}: ${shown}${rest}`,
      ),
    );
  }

  function renderGraph() {
    if (!graph) return;
    svg.replaceChildren(graphDescription);
    svg.setAttribute("viewBox", `0 0 ${graph.width} ${graph.height}`);

    const edgeLayer = svgElement("g", { "aria-hidden": "true" });
    const labelLayer = svgElement("g", { "aria-hidden": "true" });
    const nodeLayer = svgElement("g");
    graph.edgeElements = [];
    graph.labelElements = [];
    graph.nodeElements = [];

    graph.edges.forEach((edge) => {
      const path = svgElement("path", {
        class: `graph-edge${edge.mutual ? "" : " one-way"}`,
      });
      const label = svgElement("text", { class: "edge-label" });
      label.textContent = String(edge.distance);
      edgeLayer.appendChild(path);
      labelLayer.appendChild(label);
      graph.edgeElements.push(path);
      graph.labelElements.push(label);
    });

    graph.nodes.forEach((node) => {
      const width = Math.max(66, 22 + node.displayWord.length * 7.8);
      const group = svgElement("g", {
        class: "graph-node",
        role: "button",
        tabindex: "0",
        "aria-label": `${node.word}. Closest distance ${node.nearestDistance}.`,
      });
      const rect = svgElement("rect", {
        x: -width / 2,
        y: -17,
        width,
        height: 34,
      });
      const text = svgElement("text", { y: 0.5 });
      text.textContent = node.displayWord;
      const title = svgElement("title");
      title.textContent = `${node.word} · closest distance ${node.nearestDistance}`;
      group.append(rect, text, title);
      group.addEventListener("click", () => {
        if (drag?.moved) return;
        graph.selected = node.index;
        updateSelection();
      });
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          graph.selected = node.index;
          updateSelection();
        }
      });
      group.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        group.setPointerCapture(event.pointerId);
        drag = {
          index: node.index,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        };
      });
      nodeLayer.appendChild(group);
      graph.nodeElements.push(group);
    });

    svg.append(edgeLayer, labelLayer, nodeLayer);
    updateGeometry();
    updateSelection();
  }

  function simulationStep(alpha) {
    const { nodes, edges, width, height } = graph;
    const centerX = width / 2;
    const centerY = height / 2;
    const charge = Math.min(5600, 1900 + nodes.length * 100);
    const springLength = Math.max(88, Math.min(185, Math.sqrt((width * height) / nodes.length) * 0.64));

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 1) {
          dx = 0.5 + ((i * 17 + j * 29) % 7) * 0.1;
          dy = 0.5 + ((i * 31 + j * 13) % 5) * 0.1;
          distanceSquared = dx * dx + dy * dy;
        }
        const force = (charge * alpha) / distanceSquared;
        a.vx -= dx * force;
        a.vy -= dy * force;
        b.vx += dx * force;
        b.vy += dy * force;
      }
    }

    edges.forEach((edge) => {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = (distance - springLength) * 0.012 * alpha;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    });

    nodes.forEach((node) => {
      node.vx += (centerX - node.x) * 0.0026 * alpha;
      node.vy += (centerY - node.y) * 0.0026 * alpha;
      node.vx *= 0.82;
      node.vy *= 0.82;
      node.x += node.vx;
      node.y += node.vy;
      const horizontalMargin = Math.min(82, width * 0.22);
      node.x = Math.max(horizontalMargin, Math.min(width - horizontalMargin, node.x));
      node.y = Math.max(30, Math.min(height - 30, node.y));
    });
  }

  function startSimulation() {
    if (!graph) return;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    let tick = 0;
    const maxTicks = graph.nodes.length > 80 ? 90 : 170;

    const animate = () => {
      const alpha = Math.max(0.08, 1 - tick / maxTicks);
      simulationStep(alpha);
      updateGeometry();
      tick += 1;
      if (tick < maxTicks) animationFrame = requestAnimationFrame(animate);
      else animationFrame = null;
    };
    animationFrame = requestAnimationFrame(animate);
  }

  function updateSummary(duplicateCount = 0) {
    const nearestDistances = graph.nodes.map((node) => node.nearestDistance);
    const min = Math.min(...nearestDistances);
    const max = Math.max(...nearestDistances);
    const distanceText = min === max ? `nearest distance ${min}` : `nearest distances ${min}–${max}`;
    graphSummary.textContent = `${graph.nodes.length} nodes · ${graph.edges.length} edges · ${distanceText}${
      duplicateCount ? ` · ${duplicateCount} duplicate${duplicateCount === 1 ? "" : "s"} removed` : ""
    }`;
    graphDescription.textContent = `Graph of ${graph.nodes.length} binary strings with ${graph.edges.length} closest-neighbor edges. Every edge carries its Hamming distance.`;
  }

  function drawFromInput() {
    inputError.hidden = true;
    try {
      const parsed = parseWords(input.value);
      graph = buildGraph(parsed.words);
      const size = measureGraph();
      graph.width = size.width;
      graph.height = size.height;
      seedPositions();
      renderGraph();
      updateSummary(parsed.duplicateCount);
      inputCount.textContent = `${parsed.words.length} strings`;
      startSimulation();
    } catch (error) {
      inputError.textContent = error instanceof Error ? error.message : String(error);
      inputError.hidden = false;
    }
  }

  function pointInSvg(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId || !graph) return;
    const point = pointInSvg(event);
    const node = graph.nodes[drag.index];
    node.x = Math.max(42, Math.min(graph.width - 42, point.x));
    node.y = Math.max(24, Math.min(graph.height - 24, point.y));
    node.vx = 0;
    node.vy = 0;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) {
      drag.moved = true;
    }
    updateGeometry();
  });

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = drag.moved;
    window.setTimeout(() => {
      if (drag?.pointerId === event.pointerId) drag = null;
    }, moved ? 0 : 20);
  }

  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
  svg.addEventListener("click", (event) => {
    if (!graph || event.target.closest(".graph-node")) return;
    graph.selected = null;
    updateSelection();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    drawFromInput();
  });

  input.addEventListener("input", () => {
    const count = input.value.trim() ? input.value.trim().split(/[\s,;]+/).filter(Boolean).length : 0;
    inputCount.textContent = `${count} ${count === 1 ? "string" : "strings"}`;
  });

  input.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      drawFromInput();
    }
  });

  restoreButton.addEventListener("click", () => {
    input.value = DEFAULT_WORDS.join("\n");
    drawFromInput();
  });

  arrangeButton.addEventListener("click", () => {
    seedPositions();
    updateGeometry();
    startSimulation();
  });

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "light" ? "Use dark theme" : "Use light theme";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#eef2f8" : "#050816");
    try {
      localStorage.setItem("glitch-graph-theme", theme);
    } catch (_) {}
  }

  let initialTheme = "dark";
  try {
    initialTheme = localStorage.getItem("glitch-graph-theme") || "dark";
  } catch (_) {}
  applyTheme(initialTheme === "light" ? "light" : "dark");

  themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  });

  new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!graph) return;
      const previousWidth = graph.width || 1;
      const previousHeight = graph.height || 1;
      const next = measureGraph();
      graph.nodes.forEach((node) => {
        node.x *= next.width / previousWidth;
        node.y *= next.height / previousHeight;
      });
      graph.width = next.width;
      graph.height = next.height;
      svg.setAttribute("viewBox", `0 0 ${graph.width} ${graph.height}`);
      updateGeometry();
    }, 90);
  }).observe(graphStage);

  drawFromInput();
})();
