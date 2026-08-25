import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = "/Users/lupin/work/mudassir/codes_correction/hamming_circle/Hamming_74_Signal_Rescue_Lab.pptx";
const HERO = "/Users/lupin/work/mudassir/codes_correction/hamming_circle/assets/hamming-signal-hero.png";
const PREVIEW_DIR = "/Users/lupin/work/mudassir/codes_correction/.build_hamming/deck_previews";

const W = 1280;
const H = 720;
const C = {
  white: "#FFFFFF",
  ink: "#000000",
  panel: "#EDEDED",
  panel2: "#F6F7F8",
  rule: "#B8BCC4",
  muted: "#59616D",
  cyan: "#6DCBF4",
  blue: "#3D8DFF",
  bluePale: "#D0EDFA",
  navy: "#071A3A",
  coral: "#FF625E",
  coralPale: "#FFE3E1",
  green: "#158F63",
  greenPale: "#DDF5E9",
  amber: "#D88900",
  amberPale: "#FFF0C9",
};

const SOURCE = `[Sources]\n- R. W. Hamming, “Error Detecting and Error Correcting Codes,” Bell System Technical Journal 29(2), 1950. https://doi.org/10.1002/j.1538-7305.1950.tb00463.x\n[/Sources]`;
const SOURCE_COVER = `[Sources]\n- Hero illustration generated for this deck with OpenAI ImageGen on 2026-08-25; no external asset.\n- Session theme continues the local GLITCH! math-circle deck in this workspace.\n[/Sources]`;

function addBox(slide, { x, y, w, h, fill = C.panel, line = C.rule, radius = false, name = "box" }) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 },
    ...(radius ? { borderRadius: "rounded-xl" } : {}),
  });
}

function addLine(slide, x, y, w, color = C.rule, width = 1) {
  return slide.shapes.add({
    geometry: "straightConnector1",
    position: { left: x, top: y, width: w, height: 0.1 },
    fill: "none",
    line: { style: "solid", fill: color, width },
  });
}

function addText(slide, text, { x, y, w, h, size = 24, color = C.ink, bold = false, align = "left", valign = "top", name = "text", italic = false, fill = "none" }) {
  const s = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: "none", width: 0 },
  });
  s.text = text;
  s.text.style = {
    fontSize: size,
    typeface: "Helvetica Neue",
    color,
    bold,
    italic,
    alignment: align,
    verticalAlignment: valign,
    autoFit: "shrinkText",
    wrap: "square",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return s;
}

function addHeader(slide, title, section, num, { titleSize = 48 } = {}) {
  addText(slide, section.toUpperCase(), { x: 42, y: 28, w: 300, h: 24, size: 15, color: C.muted, bold: true, name: `section-${num}` });
  addText(slide, title, { x: 42, y: 61, w: 1196, h: 80, size: titleSize, bold: true, name: `title-${num}` });
  addLine(slide, 42, 153, 1196, C.rule, 1);
  addText(slide, String(num).padStart(2, "0"), { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.muted, align: "right", name: `page-${num}` });
}

function setNotes(slide, minutes, text, { source = true } = {}) {
  slide.speakerNotes.textFrame.setText(`Timing: ${minutes} minute${minutes === 1 ? "" : "s"}.\n\n${text}${source ? `\n\n${SOURCE}` : ""}`);
  slide.speakerNotes.setVisible(true);
}

function addBitRow(slide, bits, { y = 280, x = 110, cell = 130, gap = 22, labels = true, corrupt = 0, fixed7 = false, showRoles = true, name = "bits" } = {}) {
  const roles = ["check 1", "check 2", "data 1", "check 4", "data 2", "data 3", fixed7 ? "fixed 0" : "data 4"];
  for (let i = 0; i < 7; i++) {
    const px = x + i * (cell + gap);
    const pos = i + 1;
    const check = [1, 2, 4].includes(pos);
    const bad = pos === corrupt;
    addText(slide, String(pos), { x: px, y: y - 38, w: cell, h: 25, size: 18, color: C.muted, align: "center", bold: true, name: `${name}-pos-${pos}` });
    addBox(slide, { x: px, y, w: cell, h: cell, fill: bad ? C.coralPale : (check ? C.bluePale : C.white), line: bad ? C.coral : (check ? C.blue : C.ink), radius: true, name: `${name}-cell-${pos}` });
    addText(slide, bits[i] ?? "?", { x: px, y: y + 24, w: cell, h: 70, size: 48, bold: true, align: "center", valign: "middle", color: bad ? C.coral : C.ink, name: `${name}-bit-${pos}` });
    if (labels && showRoles) addText(slide, roles[i], { x: px - 6, y: y + cell + 15, w: cell + 12, h: 32, size: 18, color: check ? C.blue : C.muted, align: "center", bold: check, name: `${name}-role-${pos}` });
  }
}

function addCoverageMap(slide, { y = 225, memberships = false } = {}) {
  const sets = [
    { label: "check 1", positions: [1, 3, 5, 7], color: C.cyan },
    { label: "check 2", positions: [2, 3, 6, 7], color: C.blue },
    { label: "check 4", positions: [4, 5, 6, 7], color: "#7B61FF" },
  ];
  const startX = 250;
  const cell = 100;
  const gap = 20;
  for (let pos = 1; pos <= 7; pos++) {
    addText(slide, String(pos), { x: startX + (pos - 1) * (cell + gap), y: y - 39, w: cell, h: 24, size: 20, bold: true, align: "center", color: C.muted, name: `map-pos-${pos}` });
  }
  sets.forEach((set, row) => {
    const yy = y + row * 112;
    addText(slide, set.label, { x: 42, y: yy + 27, w: 170, h: 35, size: 26, bold: true, color: set.color, name: `map-label-${row}` });
    for (let pos = 1; pos <= 7; pos++) {
      const active = set.positions.includes(pos);
      addBox(slide, { x: startX + (pos - 1) * (cell + gap), y: yy, w: cell, h: 86, fill: active ? set.color : C.panel2, line: active ? set.color : C.rule, radius: false, name: `map-${row}-${pos}` });
      addText(slide, memberships ? (active ? "YES" : "") : (active ? "●" : ""), { x: startX + (pos - 1) * (cell + gap), y: yy + 22, w: cell, h: 42, size: memberships ? 20 : 30, bold: true, align: "center", color: active ? C.white : C.muted, name: `map-mark-${row}-${pos}` });
    }
  });
}

function addParityCount(slide, bits, parity, { y = 270, label = "Make the total even" } = {}) {
  const all = [...bits.split(""), parity];
  const startX = 262;
  all.forEach((b, i) => {
    addBox(slide, { x: startX + i * 160, y, w: 120, h: 120, fill: i === all.length - 1 ? C.bluePale : C.white, line: i === all.length - 1 ? C.blue : C.ink, radius: true, name: `parity-${i}` });
    addText(slide, b, { x: startX + i * 160, y: y + 24, w: 120, h: 72, size: 48, bold: true, align: "center", valign: "middle", name: `parity-bit-${i}` });
  });
  addText(slide, "+ check", { x: startX + bits.length * 160, y: y + 134, w: 120, h: 28, size: 18, color: C.blue, bold: true, align: "center" });
  addText(slide, label, { x: 300, y: y + 205, w: 680, h: 50, size: 30, bold: true, align: "center" });
}

function addFourStep(slide, steps, { y = 222 } = {}) {
  const colW = 266;
  const gap = 32;
  steps.forEach((s, i) => {
    const x = 42 + i * (colW + gap);
    addText(slide, String(i + 1), { x, y, w: colW, h: 70, size: 54, bold: true, color: C.blue, name: `step-num-${i}` });
    addLine(slide, x, y + 82, colW, i === steps.length - 1 ? C.coral : C.rule, 3);
    addText(slide, s.title, { x, y: y + 110, w: colW, h: 70, size: 27, bold: true, name: `step-title-${i}` });
    addText(slide, s.body, { x, y: y + 198, w: colW, h: 170, size: 22, color: C.muted, name: `step-body-${i}` });
  });
}

function addPromptBadge(slide, text, { x = 930, y = 176, w = 308, color = C.blue } = {}) {
  addBox(slide, { x, y, w, h: 56, fill: color, line: color, radius: true, name: "prompt-badge" });
  addText(slide, text, { x: x + 16, y: y + 12, w: w - 32, h: 32, size: 21, color: C.white, bold: true, align: "center", name: "prompt-badge-text" });
}

async function imageBytes(path) {
  const bytes = await fs.readFile(path);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });
const hero = await imageBytes(HERO);

// Curiosity-first revision: every ingredient answers a problem raised just before it.
// The previous version remains below as an archival reference, but this block exports
// the revised deck and exits before the archival build executes.
{
  function addBinaryStrip(slide, patterns, { y = 278, showZero = true, highlight = -1 } = {}) {
    const items = showZero ? patterns : patterns.slice(1);
    const start = showZero ? 62 : 114;
    const gap = showZero ? 18 : 22;
    const cell = showZero ? 128 : 132;
    items.forEach((pattern, index) => {
      const number = showZero ? index : index + 1;
      const x = start + index * (cell + gap);
      addText(slide, String(number), { x, y: y - 44, w: cell, h: 28, size: 20, color: C.muted, bold: true, align: "center" });
      addBox(slide, { x, y, w: cell, h: 105, fill: number === highlight ? C.coralPale : (number === 0 ? C.panel2 : C.white), line: number === highlight ? C.coral : C.rule, radius: true });
      addText(slide, pattern, { x, y: y + 25, w: cell, h: 52, size: 31, bold: true, align: "center", color: number === highlight ? C.coral : C.ink });
    });
  }

  function addQuestionRows(slide, { y = 230, answers = false } = {}) {
    const rows = [
      { label: "question 1", set: "1, 3, 5, 7", color: C.cyan },
      { label: "question 2", set: "2, 3, 6, 7", color: C.blue },
      { label: "question 4", set: "4, 5, 6, 7", color: "#7B61FF" },
    ];
    rows.forEach((row, index) => {
      const yy = y + index * 112;
      addText(slide, row.label, { x: 78, y: yy + 17, w: 260, h: 45, size: 29, bold: true, color: row.color });
      addLine(slide, 365, yy + 42, 100, row.color, 3);
      addText(slide, answers ? (index === 0 ? "NO" : "YES") : `covers ${row.set}`, { x: 500, y: yy + 13, w: 650, h: 54, size: answers ? 34 : 30, bold: true, color: answers && index > 0 ? C.coral : (answers ? C.green : C.ink) });
    });
  }

  // 1
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addText(s, "GLITCH! // LEVEL 2", { x: 42, y: 38, w: 510, h: 34, size: 18, color: C.blue, bold: true });
    addText(s, "Can a message point to its own mistake?", { x: 42, y: 108, w: 570, h: 240, size: 68, bold: true, valign: "middle", name: "cover-title" });
    addText(s, "Today you will design the idea—not just learn the recipe.", { x: 42, y: 390, w: 540, h: 100, size: 29, color: C.muted });
    addText(s, "A two-hour math circle • Grades 9–10", { x: 42, y: 564, w: 540, h: 40, size: 21, bold: true });
    addBox(s, { x: 658, y: 42, w: 582, h: 588, fill: C.bluePale, line: C.rule, radius: true });
    s.images.add({ blob: hero, contentType: "image/png", alt: "Seven binary tiles travel through three scanning beams; one tile is visibly corrupted", fit: "cover", geometry: "roundRect", borderRadius: "rounded-xl", position: { left: 658, top: 42, width: 582, height: 588 }, crop: { left: 0, top: 0.08, right: 0, bottom: 0.1 } });
    addText(s, "01", { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.muted, align: "right" });
    setNotes(s, 2, "Ask students to inspect the image. What could the three beams be doing? Do not name parity or Hamming codes. Say: our goal is to invent a message that helps the receiver locate one damaged bit.", { source: false });
    s.speakerNotes.append(`\n\n${SOURCE_COVER}`);
  }

  // 2
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why can’t the receiver recover a missing bit?", "The information problem", 2);
    addText(s, "1 0 1 ? 1 1 0", { x: 100, y: 244, w: 1080, h: 105, size: 70, bold: true, align: "center" });
    addText(s, "Both 0 and 1 fit what the receiver can see.", { x: 230, y: 410, w: 820, h: 60, size: 34, bold: true, align: "center" });
    addText(s, "Once information disappears, clever guessing cannot bring it back.", { x: 230, y: 503, w: 820, h: 55, size: 27, color: C.muted, align: "center" });
    addPromptBadge(s, "WHAT EXTRA INFORMATION WOULD HELP?", { x: 393, y: 590, w: 494, color: C.coral });
    setNotes(s, 4, "Give silent think time, then pairs. Ask for two different original messages consistent with the damaged string. The proof of impossibility is that both choices fit. The design lesson: correction requires redundancy sent before the damage happens. Worksheet 1A.");
  }

  // 3
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "What must the extra bits tell us?", "Engineering constraint", 3);
    addText(s, "The channel may flip at most one of seven transmitted bits.", { x: 95, y: 214, w: 1090, h: 58, size: 35, bold: true, align: "center" });
    addLine(s, 130, 315, 1020, C.rule, 2);
    addText(s, "NO ERROR", { x: 80, y: 372, w: 300, h: 52, size: 34, bold: true, color: C.green, align: "center" });
    addText(s, "+", { x: 410, y: 365, w: 90, h: 70, size: 50, bold: true, color: C.muted, align: "center" });
    addText(s, "ERROR AT 1, 2, 3, 4, 5, 6, OR 7", { x: 520, y: 372, w: 680, h: 52, size: 32, bold: true, color: C.coral, align: "center" });
    addText(s, "The receiver must distinguish eight possible states.", { x: 220, y: 523, w: 840, h: 58, size: 36, bold: true, align: "center" });
    setNotes(s, 3, "Have students count the possibilities aloud: one no-error state plus seven possible error positions. Ask what kind of information could name one of eight states. Do not answer yet.");
  }

  // 4
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why isn’t one parity check enough?", "Try the obvious idea", 4);
    addParityCount(s, "101", "0", { y: 228, label: "Even before sending" });
    addText(s, "After one flip, parity changes to odd.", { x: 250, y: 492, w: 780, h: 48, size: 31, bold: true, align: "center", color: C.coral });
    addText(s, "It answers “Did something change?”—not “Where?”", { x: 180, y: 573, w: 920, h: 52, size: 32, bold: true, align: "center" });
    setNotes(s, 4, "Model even parity, then use Worksheet 1B. Ask students to imagine each of four positions flipping: every case makes parity odd. One parity answer collapses all error locations into the same alarm. Detection is not location.");
  }

  // 5
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why are three yes/no checks exactly enough?", "Counting information", 5);
    addText(s, "1 question", { x: 80, y: 232, w: 300, h: 48, size: 30, bold: true, color: C.cyan, align: "center" });
    addText(s, "2 outcomes", { x: 80, y: 300, w: 300, h: 70, size: 48, bold: true, align: "center" });
    addText(s, "2 questions", { x: 490, y: 232, w: 300, h: 48, size: 30, bold: true, color: C.blue, align: "center" });
    addText(s, "4 outcomes", { x: 490, y: 300, w: 300, h: 70, size: 48, bold: true, align: "center" });
    addText(s, "3 questions", { x: 900, y: 232, w: 300, h: 48, size: 30, bold: true, color: "#7B61FF", align: "center" });
    addText(s, "8 outcomes", { x: 900, y: 300, w: 300, h: 70, size: 48, bold: true, align: "center", color: C.green });
    addLine(s, 110, 421, 1060, C.rule, 2);
    addText(s, "Three answers can name exactly: no error + seven positions.", { x: 180, y: 472, w: 920, h: 60, size: 36, bold: true, align: "center" });
    addText(s, "Could you invent eight different three-answer fingerprints?", { x: 220, y: 575, w: 840, h: 44, size: 26, color: C.muted, align: "center" });
    setNotes(s, 5, "Let students predict the third number before revealing 8. Each yes/no question doubles the number of distinguishable cases. Three is both sufficient and minimal for eight states. This is the first reason Hamming(7,4) needs three check bits.");
  }

  // 6
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Can you invent seven unique error fingerprints?", "Design challenge", 6, { titleSize: 46 });
    addText(s, "Give each state a different pattern of three answers.", { x: 160, y: 198, w: 960, h: 46, size: 29, bold: true, align: "center" });
    const labels = ["no error", "bit 1", "bit 2", "bit 3", "bit 4", "bit 5", "bit 6", "bit 7"];
    labels.forEach((label, index) => {
      const x = 72 + index * 149;
      addText(s, label, { x, y: 297, w: 132, h: 34, size: 17, bold: true, align: "center", color: index === 0 ? C.green : C.muted });
      addLine(s, x + 8, 367, 116, C.rule, 2);
      addLine(s, x + 8, 420, 116, C.rule, 2);
      addLine(s, x + 8, 473, 116, C.rule, 2);
    });
    addText(s, "Rule: no two columns may match.", { x: 325, y: 551, w: 630, h: 52, size: 34, bold: true, align: "center", color: C.coral });
    addPromptBadge(s, "PAIRS • 3 MINUTES • MANY DESIGNS WORK", { x: 370, y: 621, w: 540 });
    setNotes(s, 6, "Pairs invent eight distinct three-answer patterns on scrap paper or Worksheet 1C. Do not insist on binary order. After three minutes, compare designs: all successful solutions use every possible pattern exactly once. Ask which pattern naturally means no error.");
  }

  // 7
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Binary gives every state a three-answer name", "A natural naming system", 7);
    addBinaryStrip(s, ["000", "001", "010", "011", "100", "101", "110", "111"], { y: 272, showZero: true });
    addText(s, "NO ERROR", { x: 62, y: 410, w: 128, h: 30, size: 17, bold: true, color: C.green, align: "center" });
    addText(s, "Each position’s number is also its answer fingerprint.", { x: 220, y: 503, w: 840, h: 58, size: 36, bold: true, align: "center" });
    addText(s, "Read the three answers as the 4s, 2s, and 1s digits.", { x: 260, y: 584, w: 760, h: 42, size: 25, color: C.muted, align: "center" });
    setNotes(s, 4, "Reveal binary as a naming convenience, not a prerequisite. Read 6 as 110: yes to the 4-question, yes to the 2-question, no to the 1-question. Students may instead think of adding labels 4+2.");
  }

  // 8
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "The names tell us what each question must cover", "From addresses to check groups", 8, { titleSize: 46 });
    addCoverageMap(s, { y: 218, memberships: true });
    addText(s, "Question 1 asks about positions whose 1s digit is 1; question 2 uses the 2s digit; question 4 uses the 4s digit.", { x: 128, y: 584, w: 1024, h: 62, size: 24, bold: true, align: "center" });
    setNotes(s, 5, "Before showing each row, ask students to derive it from the binary names. Position 5=101 belongs to questions 1 and 4. Position 7=111 belongs to all three. The overlapping sets are not magic; they are the columns of the address system.");
  }

  // 9
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Three questions can locate someone you cannot see", "Human address game", 9, { titleSize: 46 });
    addText(s, "Secret position: 6", { x: 75, y: 217, w: 310, h: 54, size: 36, bold: true });
    addBox(s, { x: 83, y: 302, w: 235, h: 235, fill: C.navy, line: C.navy, radius: true });
    addText(s, "6", { x: 83, y: 344, w: 235, h: 130, size: 92, color: C.white, bold: true, align: "center", valign: "middle" });
    addQuestionRows(s, { y: 220, answers: true });
    addText(s, "NO, YES, YES → 0 + 2 + 4 = 6", { x: 410, y: 574, w: 760, h: 50, size: 32, bold: true, align: "center" });
    setNotes(s, 6, "Play with seven volunteers or pairs choosing secret positions. Ask only the three fixed membership questions. Students should experience the address pattern identifying the position before parity is introduced as the way to store those answers in a transmitted message.");
  }

  // 10
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why parity makes the questions travel with the message", "Store the expected answers", 10, { titleSize: 45 });
    addText(s, "Question 1 group", { x: 92, y: 215, w: 370, h: 42, size: 28, bold: true, color: C.cyan });
    addText(s, "positions 1, 3, 5, 7", { x: 92, y: 272, w: 430, h: 48, size: 31, bold: true });
    addText(s, "Choose its check bit so the group is EVEN.", { x: 92, y: 343, w: 490, h: 72, size: 28 });
    addLine(s, 635, 210, 0, C.rule, 1);
    addText(s, "If one covered bit flips…", { x: 700, y: 215, w: 430, h: 42, size: 28, bold: true, color: C.coral });
    addText(s, "EVEN → ODD", { x: 700, y: 280, w: 430, h: 68, size: 48, bold: true, color: C.coral });
    addText(s, "That question’s answer changes from no to yes.", { x: 700, y: 374, w: 430, h: 72, size: 27 });
    addText(s, "Parity works because every single flip toggles odd/even.", { x: 196, y: 548, w: 888, h: 58, size: 35, bold: true, align: "center" });
    setNotes(s, 4, "Ask why even/odd is a good stored answer. A single bit flip changes a count by exactly one, so it always toggles parity. Each check group carries one durable yes/no answer. The three answers together carry an address.");
  }

  // 11
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "A self-checking message needs three adjustable bits", "Build the seven-slot machine", 11, { titleSize: 45 });
    addBitRow(s, ["?", "?", "d₁", "?", "d₂", "d₃", "d₄"], { y: 260, x: 82, cell: 132, gap: 39, labels: true, name: "slots" });
    addText(s, "Four slots hold the message. Three slots are knobs that force the three parity promises to be true.", { x: 160, y: 527, w: 960, h: 72, size: 30, bold: true, align: "center" });
    setNotes(s, 3, "Ask students to identify how many adjustable bits are needed to set three independent parity answers. The data bits are fixed by the message; the check bits are the three available knobs.");
  }

  // 12
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why the check bits live at positions 1, 2, and 4", "Independent knobs", 12, { titleSize: 45 });
    addText(s, "1 = 001", { x: 90, y: 244, w: 320, h: 70, size: 48, bold: true, color: C.cyan, align: "center" });
    addText(s, "only question 1", { x: 90, y: 332, w: 320, h: 42, size: 25, align: "center", color: C.muted });
    addText(s, "2 = 010", { x: 480, y: 244, w: 320, h: 70, size: 48, bold: true, color: C.blue, align: "center" });
    addText(s, "only question 2", { x: 480, y: 332, w: 320, h: 42, size: 25, align: "center", color: C.muted });
    addText(s, "4 = 100", { x: 870, y: 244, w: 320, h: 70, size: 48, bold: true, color: "#7B61FF", align: "center" });
    addText(s, "only question 4", { x: 870, y: 332, w: 320, h: 42, size: 25, align: "center", color: C.muted });
    addLine(s, 120, 420, 1040, C.rule, 2);
    addText(s, "Each check bit changes only its own parity equation.", { x: 210, y: 468, w: 860, h: 58, size: 36, bold: true, align: "center" });
    addText(s, "That is why powers of two are the cleanest places for the knobs.", { x: 220, y: 566, w: 840, h: 44, size: 26, color: C.muted, align: "center" });
    setNotes(s, 4, "This is the crucial why behind positions 1,2,4. Their binary addresses contain exactly one 1, so each belongs to only one check group. Adjusting p1 cannot disturb checks 2 or 4, and similarly for the others.");
  }

  // 13
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Can we practice with one data slot locked?", "Restricted warm-up", 13);
    addBitRow(s, ["p₁", "p₂", "d₁", "p₄", "d₂", "d₃", "0"], { y: 260, x: 82, cell: 132, gap: 39, fixed7: true, labels: true, name: "warmup" });
    addText(s, "Use three message bits in positions 3, 5, 6. Fix position 7 at zero.", { x: 210, y: 530, w: 860, h: 55, size: 31, bold: true, align: "center" });
    addText(s, "This is practice inside the full machine—not a standard Hamming(7,3) code.", { x: 210, y: 601, w: 860, h: 32, size: 18, color: C.muted, italic: true, align: "center" });
    setNotes(s, 2, "Explain that locking one data slot reduces cognitive load without changing the check groups. Worksheet 2B uses this restricted subcode.");
  }

  // 14
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Build the first self-checking word", "Encode 1 0 1", 14);
    addBitRow(s, ["?", "?", "1", "?", "0", "1", "0"], { y: 250, x: 82, cell: 132, gap: 39, fixed7: true, labels: true, name: "warm-try" });
    addText(s, "For each question: count the known 1s, then choose its knob to make the total even.", { x: 170, y: 520, w: 940, h: 66, size: 29, bold: true, align: "center" });
    addPromptBadge(s, "WHY CAN EACH KNOB BE SOLVED SEPARATELY?", { x: 360, y: 609, w: 560, color: C.coral });
    setNotes(s, 5, "Pairs solve 101. Use a hint ladder rather than giving formulas. Ask the displayed why: positions 1,2,4 each belong only to their own question. Expected p1=1, p2=0, p4=1. Worksheet 2B.");
  }

  // 15
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Every check is even because we chose it that way", "Warm-up reveal", 15, { titleSize: 46 });
    addBitRow(s, ["1", "0", "1", "1", "0", "1", "0"], { y: 245, x: 82, cell: 132, gap: 39, fixed7: true, labels: true, name: "warm-reveal" });
    addText(s, "Q1: 1+1+0+0=2", { x: 80, y: 515, w: 340, h: 38, size: 23, bold: true, color: C.cyan, align: "center" });
    addText(s, "Q2: 0+1+1+0=2", { x: 470, y: 515, w: 340, h: 38, size: 23, bold: true, color: C.blue, align: "center" });
    addText(s, "Q4: 1+0+1+0=2", { x: 860, y: 515, w: 340, h: 38, size: 23, bold: true, color: "#7B61FF", align: "center" });
    addText(s, "The codeword carries three promises about itself.", { x: 230, y: 594, w: 820, h: 48, size: 31, bold: true, color: C.green, align: "center" });
    setNotes(s, 2, "Have three students each audit one group. Ask what the receiver expects before any error: three even totals, equivalent to fingerprint 000.");
  }

  // 16
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why seven protected bits carry at most four data bits", "A perfect packing", 16, { titleSize: 44 });
    addText(s, "2⁷ = 128", { x: 60, y: 244, w: 330, h: 66, size: 48, bold: true, color: C.blue, align: "center" });
    addText(s, "possible received strings", { x: 60, y: 326, w: 330, h: 42, size: 23, color: C.muted, align: "center" });
    addText(s, "÷ 8", { x: 465, y: 244, w: 330, h: 66, size: 48, bold: true, color: C.coral, align: "center" });
    addText(s, "one clean word + seven one-flip versions", { x: 435, y: 326, w: 390, h: 62, size: 22, color: C.muted, align: "center" });
    addText(s, "= 16", { x: 870, y: 244, w: 330, h: 66, size: 48, bold: true, color: C.green, align: "center" });
    addText(s, "protected messages", { x: 870, y: 326, w: 330, h: 42, size: 23, color: C.muted, align: "center" });
    addLine(s, 120, 425, 1040, C.rule, 2);
    addText(s, "16 messages = 2⁴ choices = four data bits", { x: 200, y: 476, w: 880, h: 72, size: 42, bold: true, align: "center" });
    addText(s, "Hamming(7,4) fills the space exactly: no room is wasted.", { x: 240, y: 579, w: 800, h: 44, size: 26, color: C.muted, align: "center" });
    setNotes(s, 5, "Ask each count before revealing it. Every valid codeword must own eight possible received strings: itself and its seven single-bit neighbors. The 128 total strings can therefore protect at most 16 messages, exactly four bits. This is the intuitive Hamming bound and why (7,4) is called perfect.");
  }

  // 17
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Unlocking the final slot gives Hamming(7,4)", "The full code", 17, { titleSize: 46 });
    addBitRow(s, ["p₁", "p₂", "d₁", "p₄", "d₂", "d₃", "d₄"], { y: 260, x: 82, cell: 132, gap: 39, labels: true, name: "full" });
    addText(s, "3 address bits + 4 message bits = 7 transmitted bits", { x: 190, y: 533, w: 900, h: 58, size: 36, bold: true, align: "center", color: C.blue });
    setNotes(s, 2, "Now the notation should feel earned: seven transmitted positions, four free message bits, and three check bits forced by the parity promises.");
  }

  // 18
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Can you reconstruct the encoder from its job?", "Derive the routine", 18);
    addFourStep(s, [
      { title: "Name slots", body: "Write positions 1–7 and mark 1,2,4 as checks." },
      { title: "Place data", body: "Put the four message bits in 3,5,6,7." },
      { title: "Keep promises", body: "Choose p₁,p₂,p₄ so their groups are even." },
      { title: "Audit", body: "Verify all three expected answers are NO." },
    ], { y: 205 });
    setNotes(s, 3, "Ask students to propose the steps before revealing them. The routine should be reconstructed from the purpose of the code, not memorized as an arbitrary recipe. Worksheet 3A.");
  }

  // 19
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Pair challenge: encode 1 0 1 1", "Use your design", 19);
    addBitRow(s, ["?", "?", "1", "?", "0", "1", "1"], { y: 255, x: 82, cell: 132, gap: 39, labels: true, name: "encode" });
    addText(s, "Builder chooses the three knobs. Auditor explains why each promise is true.", { x: 190, y: 530, w: 900, h: 62, size: 30, bold: true, align: "center" });
    addPromptBadge(s, "WORKSHEET 3B • DO NOT GUESS THE CHECK BITS", { x: 345, y: 612, w: 590, color: C.coral });
    setNotes(s, 6, "Pairs encode 1011. Require reasoning in terms of the three questions. Expected p1=0, p2=1, p4=0. The auditor must explain why each even total means the receiver will expect a no-error fingerprint of 000.");
  }

  // 20
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Three checks prove the codeword is ready", "Encoding reveal", 20);
    addBitRow(s, ["0", "1", "1", "0", "0", "1", "1"], { y: 245, x: 82, cell: 132, gap: 39, labels: true, name: "reveal" });
    addText(s, "Q1 even", { x: 120, y: 515, w: 280, h: 40, size: 27, bold: true, color: C.cyan, align: "center" });
    addText(s, "Q2 even", { x: 500, y: 515, w: 280, h: 40, size: 27, bold: true, color: C.blue, align: "center" });
    addText(s, "Q4 even", { x: 880, y: 515, w: 280, h: 40, size: 27, bold: true, color: "#7B61FF", align: "center" });
    addText(s, "Expected receiver fingerprint: 000", { x: 280, y: 593, w: 720, h: 48, size: 32, bold: true, color: C.green, align: "center" });
    setNotes(s, 2, "Verify each group. Ask where the original data is hiding: positions 3,5,6,7. The all-pass fingerprint 000 is now visibly built into the word.");
  }

  // 21
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Test whether your method transfers", "Encoding sprint", 21);
    const tasks = [["0 0 0 0", "_______"], ["1 1 1 1", "_______"], ["0 1 0 1", "_______"], ["1 1 0 0", "_______"]];
    tasks.forEach((task, index) => {
      const x = 88 + (index % 2) * 610;
      const y = 212 + Math.floor(index / 2) * 188;
      addText(s, task[0], { x, y, w: 250, h: 50, size: 36, bold: true, color: index === 3 ? C.coral : C.blue });
      addText(s, task[1], { x: x + 295, y, w: 250, h: 50, size: 32, color: C.muted });
      addLine(s, x, y + 70, 545, C.rule, 1);
    });
    addText(s, "If two teammates disagree, audit the three promises instead of voting.", { x: 210, y: 587, w: 860, h: 48, size: 27, bold: true, align: "center" });
    setNotes(s, 5, "Teams divide Worksheet 3C and cross-audit. Answers: 0000000; 1111111; 0100101; 0111100. The point is transfer: the groups and logic remain fixed while the message changes.");
  }

  // 22
  {
    const s = deck.slides.add(); s.background.fill = C.navy;
    addText(s, "PAUSE THE SIGNAL", { x: 42, y: 43, w: 520, h: 40, size: 20, color: C.cyan, bold: true });
    addText(s, "05:00", { x: 200, y: 198, w: 880, h: 190, size: 122, color: C.white, bold: true, align: "center", valign: "middle" });
    addText(s, "When you return: we use the same three questions to find a flip.", { x: 190, y: 458, w: 900, h: 82, size: 32, color: C.white, align: "center", bold: true });
    addText(s, "Stretch • water • keep your worksheet", { x: 340, y: 583, w: 600, h: 42, size: 23, color: C.cyan, align: "center" });
    addText(s, "22", { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.bluePale, align: "right" });
    setNotes(s, 5, "Take a real five-minute break. Resume by asking: Why were three questions enough? Why were positions 1,2,4 special?", { source: false });
  }

  // 23
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Which questions noticed the flip?", "Received word 0 1 1 0 0 0 1", 23);
    addBitRow(s, ["0", "1", "1", "0", "0", "0", "1"], { y: 248, x: 82, cell: 132, gap: 39, labels: true, corrupt: 6, name: "received" });
    addText(s, "Do not hunt by eye. Ask the same three parity questions.", { x: 190, y: 518, w: 900, h: 54, size: 31, bold: true, align: "center" });
    addPromptBadge(s, "Q1?  Q2?  Q4?", { x: 474, y: 603, w: 332 });
    setNotes(s, 4, "Students run the checks on Worksheet 4A. Q1 passes with two ones; Q2 and Q4 fail with three ones. Ask why a flipped bit changes exactly the questions that contain its position.");
  }

  // 24
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why the failed questions spell the error address", "The syndrome", 24, { titleSize: 46 });
    addText(s, "Q1", { x: 90, y: 224, w: 250, h: 42, size: 30, bold: true, color: C.cyan, align: "center" });
    addText(s, "PASS → 0", { x: 90, y: 290, w: 250, h: 60, size: 36, bold: true, color: C.green, align: "center" });
    addText(s, "Q2", { x: 515, y: 224, w: 250, h: 42, size: 30, bold: true, color: C.blue, align: "center" });
    addText(s, "FAIL → 2", { x: 515, y: 290, w: 250, h: 60, size: 36, bold: true, color: C.coral, align: "center" });
    addText(s, "Q4", { x: 940, y: 224, w: 250, h: 42, size: 30, bold: true, color: "#7B61FF", align: "center" });
    addText(s, "FAIL → 4", { x: 940, y: 290, w: 250, h: 60, size: 36, bold: true, color: C.coral, align: "center" });
    addLine(s, 150, 397, 980, C.rule, 2);
    addText(s, "answers 110₂ = 4 + 2 = 6", { x: 220, y: 438, w: 840, h: 74, size: 48, bold: true, color: C.blue, align: "center" });
    addText(s, "The error reproduces the fingerprint of its position.", { x: 240, y: 566, w: 800, h: 48, size: 30, bold: true, align: "center" });
    setNotes(s, 5, "This is the core explanation of the syndrome. Position 6 belongs to Q2 and Q4, so a flip there makes exactly those questions fail. The failed-answer pattern is 110, the binary name of 6. Adding failed labels is simply another way to read the same address.");
  }

  // 25
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why one flip repairs the word", "Correction is the inverse", 25);
    addText(s, "flip at position 6", { x: 65, y: 250, w: 350, h: 54, size: 34, bold: true, color: C.coral, align: "center" });
    addText(s, "→", { x: 430, y: 244, w: 90, h: 70, size: 52, bold: true, color: C.blue, align: "center" });
    addText(s, "syndrome points to 6", { x: 535, y: 250, w: 360, h: 54, size: 34, bold: true, color: C.blue, align: "center" });
    addText(s, "→", { x: 910, y: 244, w: 90, h: 70, size: 52, bold: true, color: C.blue, align: "center" });
    addText(s, "flip 6 back", { x: 1010, y: 250, w: 220, h: 54, size: 34, bold: true, color: C.green, align: "center" });
    addLine(s, 130, 380, 1020, C.rule, 2);
    addText(s, "The second flip toggles the same checks back to even.", { x: 200, y: 431, w: 880, h: 60, size: 37, bold: true, align: "center" });
    addText(s, "Repair first. Then read the message from positions 3, 5, 6, 7.", { x: 210, y: 551, w: 860, h: 52, size: 29, color: C.muted, align: "center" });
    setNotes(s, 3, "Ask students to explain why flipping the addressed bit, rather than replacing it with a guessed value, works. A binary flip is its own inverse. Then emphasize repair before extraction.");
  }

  // 26
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Two packets, same logic", "Repair race", 26);
    addText(s, "Packet A", { x: 42, y: 212, w: 230, h: 45, size: 33, bold: true, color: C.blue });
    addText(s, "0 1 0 1 1 0 1", { x: 42, y: 278, w: 530, h: 64, size: 44, bold: true });
    addText(s, "Which questions fail?", { x: 42, y: 369, w: 530, h: 42, size: 25, color: C.muted });
    addLine(s, 42, 444, 530, C.rule, 2);
    addText(s, "Packet B", { x: 666, y: 212, w: 230, h: 45, size: 33, bold: true, color: C.coral });
    addText(s, "0 1 1 1 1 0 1", { x: 666, y: 278, w: 530, h: 64, size: 44, bold: true });
    addText(s, "Which questions fail?", { x: 666, y: 369, w: 530, h: 42, size: 25, color: C.muted });
    addLine(s, 666, 444, 530, C.rule, 2);
    addText(s, "Explain why the failed-question fingerprint identifies the bit.", { x: 190, y: 535, w: 900, h: 58, size: 31, bold: true, align: "center" });
    addPromptBadge(s, "WORKSHEET 4B", { x: 500, y: 612, w: 280 });
    setNotes(s, 6, "Packet A: only Q4 fails → position 4 → corrected 0100101 → message 0101. Packet B: all fail → position 7 → corrected 0111100 → message 1100. Require the causal explanation, not only the arithmetic.");
  }

  // 27
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Invent a codeword your partner can rescue", "Create • corrupt • explain", 27, { titleSize: 46 });
    addFourStep(s, [
      { title: "Choose", body: "Invent any four-bit message." },
      { title: "Encode", body: "Build three even parity promises." },
      { title: "Flip", body: "Corrupt exactly one secret position." },
      { title: "Explain", body: "Partner repairs it and justifies the address." },
    ], { y: 205 });
    addText(s, "A successful rescue reproduces the sender’s message for the right reason.", { x: 190, y: 604, w: 900, h: 42, size: 25, bold: true, color: C.green, align: "center" });
    setNotes(s, 6, "Use Worksheet 5. Keep this shorter than the previous deck so there is time for the conceptual why. Receivers must say which parity questions failed and why those answers name the sender’s secret position.");
  }

  // 28
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Why two errors can impersonate a third", "The boundary—and the eighth bit", 28, { titleSize: 46 });
    addText(s, "errors at 2 and 4", { x: 70, y: 220, w: 360, h: 52, size: 34, bold: true, color: C.coral, align: "center" });
    addText(s, "their fingerprints combine", { x: 455, y: 220, w: 370, h: 52, size: 30, bold: true, color: C.muted, align: "center" });
    addText(s, "syndrome 6", { x: 850, y: 220, w: 360, h: 52, size: 34, bold: true, color: C.blue, align: "center" });
    addText(s, "010 ⊕ 100 = 110", { x: 350, y: 306, w: 580, h: 68, size: 48, bold: true, align: "center" });
    addLine(s, 140, 414, 1000, C.rule, 2);
    addText(s, "Hamming(7,4) may wrongly flip bit 6.", { x: 80, y: 462, w: 530, h: 48, size: 29, bold: true, color: C.coral, align: "center" });
    addText(s, "An eighth overall parity bit separates odd flips from even flips.", { x: 660, y: 448, w: 540, h: 78, size: 29, bold: true, color: C.green, align: "center" });
    addText(s, "That is the intuition behind extended Hamming(8,4).", { x: 250, y: 584, w: 780, h: 44, size: 25, color: C.muted, align: "center" });
    setNotes(s, 3, "Show why the one-error promise matters: two error fingerprints XOR into another valid address. The optional eighth overall parity bit reveals whether the total number of flips is odd or even, enabling double-error detection.");
  }

  // 29
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addHeader(s, "Can you do the whole job alone?", "Solo certification", 29);
    addText(s, "Part A", { x: 42, y: 204, w: 210, h: 44, size: 30, bold: true, color: C.blue });
    addText(s, "Encode message 1 0 0 1", { x: 42, y: 269, w: 550, h: 62, size: 38, bold: true });
    addText(s, "Explain why all three checks pass.", { x: 42, y: 358, w: 550, h: 52, size: 25, color: C.muted });
    addText(s, "Part B", { x: 666, y: 204, w: 210, h: 44, size: 30, bold: true, color: C.coral });
    addText(s, "Repair 0 0 1 1 1 0 1", { x: 666, y: 269, w: 550, h: 62, size: 38, bold: true });
    addText(s, "Explain why the syndrome names the error.", { x: 666, y: 358, w: 550, h: 52, size: 25, color: C.muted });
    addLine(s, 42, 478, 1196, C.rule, 2);
    addText(s, "Method matters: roles → parity promises → address → repair → extract", { x: 160, y: 527, w: 960, h: 54, size: 30, bold: true, align: "center" });
    addPromptBadge(s, "WORKSHEET 6A • 5 MINUTES", { x: 450, y: 610, w: 380, color: C.green });
    setNotes(s, 5, "Students work independently. Part A: 0011001. Part B: Q1 and Q4 fail → position 5 → corrected 0011001 → message 1001. Score the explanation as well as the result.");
  }

  // 30
  {
    const s = deck.slides.add(); s.background.fill = C.white;
    addText(s, "SIGNAL RESTORED", { x: 42, y: 42, w: 430, h: 35, size: 18, color: C.green, bold: true });
    addText(s, "You did not memorize Hamming(7,4). You derived it.", { x: 42, y: 135, w: 1110, h: 140, size: 58, bold: true });
    addText(s, "8 states", { x: 42, y: 359, w: 240, h: 50, size: 32, bold: true, color: C.cyan });
    addText(s, "→ 3 questions", { x: 310, y: 359, w: 290, h: 50, size: 32, bold: true, color: C.blue });
    addText(s, "→ binary address", { x: 630, y: 359, w: 320, h: 50, size: 32, bold: true, color: "#7B61FF" });
    addText(s, "→ parity promises", { x: 980, y: 359, w: 250, h: 50, size: 30, bold: true, color: C.coral });
    addLine(s, 42, 444, 1196, C.rule, 2);
    addText(s, "Check: Part A 0011001 • Part B error at 5 → message 1001", { x: 180, y: 500, w: 920, h: 52, size: 27, bold: true, align: "center", color: C.green });
    addText(s, "Exit whisper: Which design choice now feels inevitable?", { x: 220, y: 586, w: 840, h: 46, size: 27, bold: true, align: "center" });
    addText(s, "30", { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.muted, align: "right" });
    setNotes(s, 1, "Students name one why they can now explain: three checks, the overlap sets, positions 1/2/4, or the syndrome. The close resolves the opening question: the message points to damage because its three parity promises form an address.");
  }

  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(`${PREVIEW_DIR}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(`${PREVIEW_DIR}/${stem}.layout.json`, await layout.text());
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(`${PREVIEW_DIR}/deck-montage.webp`, new Uint8Array(await montage.arrayBuffer()));
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(OUT);
  console.log(`Created curiosity-first ${OUT} with ${deck.slides.items.length} slides.`);
  process.exit(0);
}

// 1 — Cover (Codex Grid slide 08 silhouette)
{
  const s = deck.slides.add();
  s.background.fill = C.white;
  addText(s, "GLITCH! // LEVEL 2", { x: 42, y: 38, w: 510, h: 34, size: 18, color: C.blue, bold: true });
  addText(s, "Signal Rescue Lab", { x: 42, y: 115, w: 560, h: 180, size: 76, bold: true, valign: "bottom", name: "cover-title" });
  addText(s, "Build a message that can find and fix its own one-bit mistake.", { x: 42, y: 342, w: 540, h: 130, size: 30, color: C.muted, name: "cover-subtitle" });
  addText(s, "A two-hour math circle • Grades 9–10", { x: 42, y: 564, w: 540, h: 40, size: 21, bold: true });
  addBox(s, { x: 658, y: 42, w: 582, h: 588, fill: C.bluePale, line: C.rule, radius: true, name: "hero-backing" });
  s.images.add({ blob: hero, contentType: "image/png", alt: "Seven binary tiles travel through three scanning beams; one tile is visibly corrupted", fit: "cover", geometry: "roundRect", borderRadius: "rounded-xl", position: { left: 658, top: 42, width: 582, height: 588 }, crop: { left: 0, top: 0.08, right: 0, bottom: 0.1 } });
  addText(s, "01", { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.muted, align: "right" });
  setNotes(s, 2, "Welcome students as returning signal engineers. Ask them to silently count the seven tiles and spot the corrupted one. Say: Today the challenge is not merely to notice damage; it is to make the message tell us exactly where the damage happened. Do not name Hamming codes yet.", { source: false });
  s.speakerNotes.append(`\n\n${SOURCE_COVER}`);
}

// 2
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Your mission has one precise finish line", "Mission briefing", 2);
  addText(s, "By the end, you will be able to…", { x: 42, y: 215, w: 520, h: 54, size: 30, bold: true, color: C.muted });
  addText(s, "ENCODE", { x: 42, y: 316, w: 340, h: 55, size: 42, bold: true, color: C.blue });
  addText(s, "four message bits into seven", { x: 42, y: 378, w: 360, h: 80, size: 27 });
  addText(s, "REPAIR", { x: 465, y: 316, w: 340, h: 55, size: 42, bold: true, color: C.coral });
  addText(s, "any single flipped bit", { x: 465, y: 378, w: 340, h: 80, size: 27 });
  addText(s, "PROVE IT", { x: 888, y: 316, w: 350, h: 55, size: 42, bold: true, color: C.green });
  addText(s, "with a solo final challenge", { x: 888, y: 378, w: 350, h: 80, size: 27 });
  addText(s, "You will invent every ingredient along the way.", { x: 42, y: 566, w: 920, h: 50, size: 30, bold: true });
  setNotes(s, 2, "Read the three verbs aloud. Students give a thumbs-sideways or thumbs-up for how possible this feels. Tell them the solo challenge is open-note and the worksheet is their lab notebook.");
}

// 3
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "A damaged message cannot explain itself", "The impossible repair", 3);
  addText(s, "1 0 1 ? 1 1 0", { x: 100, y: 248, w: 1080, h: 105, size: 70, bold: true, align: "center", name: "damaged-message" });
  addText(s, "What was the missing bit?", { x: 260, y: 404, w: 760, h: 60, size: 38, bold: true, align: "center" });
  addText(s, "Convince someone who disagrees.", { x: 320, y: 500, w: 640, h: 44, size: 25, color: C.muted, align: "center" });
  addPromptBadge(s, "THINK → PAIR → SHARE", { x: 448, y: 590, w: 384, color: C.coral });
  setNotes(s, 4, "Give 30 seconds of silence, then pairs discuss. Accept both 0 and 1 as possible. Key conclusion: without extra structure, the receiver cannot know. Ask: What extra information could we add without sending the whole message twice? Worksheet 1A.");
}

// 4
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "One extra bit can make a promise", "Parity sprint", 4);
  addParityCount(s, "101", "0", { y: 238, label: "2 ones already → add 0" });
  addText(s, "EVEN PARITY: the total number of 1s must be even.", { x: 210, y: 556, w: 860, h: 48, size: 29, bold: true, align: "center", color: C.blue });
  addPromptBadge(s, "Worksheet 1B • race all four", { x: 889, y: 167, w: 349 });
  setNotes(s, 5, "Model 101. Then teams complete 111, 000, and 0101 on Worksheet 1B. Answers: 111 needs 1; 000 needs 0; 0101 needs 0. Ask teams to hold up fingers 0 or 1 together. Emphasize the convention is even parity.");
}

// 5
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Parity raises an alarm—but gives no address", "What parity can do", 5);
  addText(s, "Sent", { x: 90, y: 225, w: 180, h: 40, size: 25, bold: true, color: C.muted });
  addText(s, "1 0 1 0", { x: 90, y: 282, w: 450, h: 75, size: 52, bold: true });
  addText(s, "even ✓", { x: 90, y: 375, w: 240, h: 40, size: 27, bold: true, color: C.green });
  addText(s, "Received", { x: 710, y: 225, w: 220, h: 40, size: 25, bold: true, color: C.muted });
  addText(s, "1 1 1 0", { x: 710, y: 282, w: 450, h: 75, size: 52, bold: true });
  addText(s, "odd !", { x: 710, y: 375, w: 240, h: 40, size: 27, bold: true, color: C.coral });
  addText(s, "Which position changed?", { x: 348, y: 500, w: 584, h: 55, size: 38, bold: true, align: "center" });
  addText(s, "One check gives one yes/no answer. We need several overlapping checks.", { x: 226, y: 582, w: 828, h: 45, size: 24, color: C.muted, align: "center" });
  setNotes(s, 3, "Ask students to name all four possible single-bit changes that could create odd parity. Conclude that one alarm detects a problem but cannot locate it. This creates the need for overlapping checks.");
}

// 6
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Three yes/no questions can name any position 1–7", "Address detective", 6, { titleSize: 46 });
  addText(s, "Secret position", { x: 42, y: 207, w: 270, h: 38, size: 26, color: C.muted, bold: true });
  addBox(s, { x: 42, y: 266, w: 225, h: 225, fill: C.navy, line: C.navy, radius: true });
  addText(s, "?", { x: 42, y: 301, w: 225, h: 140, size: 94, bold: true, color: C.white, align: "center", valign: "middle" });
  addText(s, "Is it in 1, 3, 5, 7?", { x: 370, y: 225, w: 650, h: 55, size: 34, bold: true, color: C.cyan });
  addText(s, "Is it in 2, 3, 6, 7?", { x: 370, y: 330, w: 650, h: 55, size: 34, bold: true, color: C.blue });
  addText(s, "Is it in 4, 5, 6, 7?", { x: 370, y: 435, w: 650, h: 55, size: 34, bold: true, color: "#7B61FF" });
  addText(s, "Challenge: choose a secret position. Your partner asks only these three questions.", { x: 370, y: 555, w: 820, h: 58, size: 25, bold: true });
  setNotes(s, 6, "Pairs play three rounds. Partner A chooses a position 1–7; Partner B asks the three displayed questions and records yes/no. They should discover each position has a unique pattern. If stuck, suggest writing the three answers next to each number on Worksheet 1C. Do not introduce binary notation unless students mention it.");
}

// 7
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "The failed checks spell the position’s address", "Three overlapping check groups", 7, { titleSize: 46 });
  addCoverageMap(s, { y: 228, memberships: true });
  addText(s, "Example: position 6 answers NO, YES, YES → 2 + 4 = 6", { x: 218, y: 590, w: 844, h: 44, size: 27, bold: true, align: "center" });
  setNotes(s, 3, "Have the room read down the column for position 6: check 1 no, check 2 yes, check 4 yes. The labels of the YES rows add to 6. Ask for the address of positions 3, 5, and 7. Answers: 1+2=3; 1+4=5; 1+2+4=7. Worksheet 1C.");
}

// 8
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Become the seven-position machine", "Human code game", 8);
  addBitRow(s, ["1", "0", "1", "1", "0", "0", "1"], { y: 265, x: 82, cell: 132, gap: 39, labels: false, showRoles: false, name: "human" });
  addText(s, "Round 1: stand if check 1 covers you.", { x: 42, y: 508, w: 540, h: 45, size: 28, bold: true, color: C.cyan });
  addText(s, "Round 2: stand if check 2 covers you.", { x: 42, y: 566, w: 540, h: 45, size: 28, bold: true, color: C.blue });
  addText(s, "Round 3: stand if check 4 covers you.", { x: 658, y: 508, w: 540, h: 45, size: 28, bold: true, color: "#7B61FF" });
  addText(s, "Finale: one person flips their bit. Which checks become odd?", { x: 658, y: 566, w: 540, h: 60, size: 27, bold: true, color: C.coral });
  setNotes(s, 7, "Invite seven volunteers and give each a position card 1–7. For each check, students in that group stand or raise a card. Then secretly tap one volunteer to flip their bit card. The class counts each check group and uses the labels of odd groups to name the volunteer. Rotate volunteers if time. This physicalizes the syndrome before any formal encoding.");
}

// 9
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Powers of two become the check-bit stations", "Build the seven-slot machine", 9, { titleSize: 46 });
  addBitRow(s, ["p₁", "p₂", "d₁", "p₄", "d₂", "d₃", "d₄"], { y: 268, x: 82, cell: 132, gap: 39, labels: true, showRoles: false, name: "roles" });
  addText(s, "CHECK BITS", { x: 90, y: 520, w: 438, h: 42, size: 28, bold: true, color: C.blue, align: "center" });
  addText(s, "positions 1, 2, 4", { x: 90, y: 568, w: 438, h: 38, size: 24, align: "center", color: C.muted });
  addText(s, "MESSAGE BITS", { x: 746, y: 520, w: 438, h: 42, size: 28, bold: true, color: C.ink, align: "center" });
  addText(s, "positions 3, 5, 6, 7", { x: 746, y: 568, w: 438, h: 38, size: 24, align: "center", color: C.muted });
  setNotes(s, 3, "Name the positions and roles. Ask why 1, 2, and 4 are special: they are exactly the check labels and each belongs to only its own check group. Students fill the role row on Worksheet 2A.");
}

// 10
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Each check bit controls its own overlapping group", "Coverage map", 10);
  addCoverageMap(s, { y: 230, memberships: false });
  addText(s, "Your rule: choose each check bit so its whole row has an even number of 1s.", { x: 166, y: 596, w: 948, h: 42, size: 27, bold: true, align: "center" });
  setNotes(s, 3, "Point out that each check includes its own check-bit position. Students trace the three sets on Worksheet 2A. Quick call-and-response: Does check 1 cover 6? no. Does check 2 cover 6? yes. Does check 4 cover 6? yes.");
}

// 11
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Training wheels: use three message bits first", "Restricted warm-up", 11);
  addBitRow(s, ["?", "?", "d₁", "?", "d₂", "d₃", "0"], { y: 270, x: 82, cell: 132, gap: 39, fixed7: true, labels: true, name: "warm-roles" });
  addText(s, "Place data in 3, 5, 6. Lock position 7 at zero.", { x: 223, y: 539, w: 834, h: 46, size: 30, bold: true, align: "center" });
  addText(s, "This is a restricted practice version—not the standard Hamming(7,3) code.", { x: 223, y: 608, w: 834, h: 30, size: 18, color: C.muted, align: "center", italic: true });
  setNotes(s, 2, "Explain the accuracy note briefly: we are taking the full seven-slot machine and simply fixing the last message slot at 0. That lets students practice all three parity checks with less cognitive load. Worksheet 2B.");
}

// 12
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Encode the three bits 1 0 1", "Training-wheels challenge", 12);
  addBitRow(s, ["?", "?", "1", "?", "0", "1", "0"], { y: 270, x: 82, cell: 132, gap: 39, fixed7: true, labels: true, name: "warm-try" });
  addText(s, "Find p₁, p₂, p₄ so every check group is even.", { x: 218, y: 540, w: 844, h: 50, size: 31, bold: true, align: "center" });
  addPromptBadge(s, "Worksheet 2B • build all 7 bits", { x: 879, y: 173, w: 359 });
  setNotes(s, 5, "Pairs solve without a formula. Hint ladder: (1) start with check 1 positions 1,3,5,7; (2) count the known 1s; (3) choose p1 to make that count even; repeat for checks 2 and 4. Expected p1=1, p2=0, p4=1. Do not reveal until most pairs have committed.");
}

// 13
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "The warm-up codeword is 1 0 1 1 0 1 0", "Training-wheels reveal", 13, { titleSize: 46 });
  addBitRow(s, ["1", "0", "1", "1", "0", "1", "0"], { y: 262, x: 82, cell: 132, gap: 39, fixed7: true, labels: true, name: "warm-reveal" });
  addText(s, "check 1: 1+1+0+0 = 2", { x: 42, y: 526, w: 370, h: 38, size: 23, bold: true, color: C.cyan });
  addText(s, "check 2: 0+1+1+0 = 2", { x: 455, y: 526, w: 370, h: 38, size: 23, bold: true, color: C.blue });
  addText(s, "check 4: 1+0+1+0 = 2", { x: 868, y: 526, w: 370, h: 38, size: 23, bold: true, color: "#7B61FF" });
  addText(s, "All three totals are even ✓", { x: 330, y: 600, w: 620, h: 44, size: 30, bold: true, color: C.green, align: "center" });
  setNotes(s, 2, "Have three students each verify one check aloud. Ask what would change if the original three bits were different: only the count in the groups, not the groups themselves.");
}

// 14
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Now unlock position 7: this is Hamming(7,4)", "Full code", 14, { titleSize: 46 });
  addBitRow(s, ["p₁", "p₂", "d₁", "p₄", "d₂", "d₃", "d₄"], { y: 266, x: 82, cell: 132, gap: 39, labels: true, name: "full-roles" });
  addText(s, "4 message bits", { x: 111, y: 526, w: 380, h: 55, size: 38, bold: true, color: C.ink, align: "center" });
  addText(s, "→", { x: 571, y: 521, w: 138, h: 62, size: 50, bold: true, color: C.blue, align: "center" });
  addText(s, "7 transmitted bits", { x: 790, y: 526, w: 380, h: 55, size: 38, bold: true, color: C.blue, align: "center" });
  addText(s, "The same three checks still do all the work.", { x: 290, y: 604, w: 700, h: 38, size: 25, color: C.muted, align: "center" });
  setNotes(s, 3, "Reveal the notation: Hamming(7,4) means seven transmitted bits carry four message bits. The three check bits are the redundancy that buys single-error correction. Students circle the four data stations on Worksheet 3A.");
}

// 15
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Encoding is a four-move routine", "Hamming(7,4) recipe", 15);
  addFourStep(s, [
    { title: "Label 1–7", body: "Keep the address above every slot." },
    { title: "Place data", body: "Write d₁,d₂,d₃,d₄ in 3,5,6,7." },
    { title: "Set checks", body: "Choose p₁,p₂,p₄ so each group is even." },
    { title: "Verify", body: "Recount all three groups before sending." },
  ]);
  setNotes(s, 3, "Students write this recipe in their own words on Worksheet 3A. Stress that the order of p1, p2, p4 does not matter mathematically because each is in only its own check position, but a consistent order prevents mistakes.");
}

// 16
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Pair challenge: encode 1 0 1 1", "Full Hamming(7,4)", 16);
  addBitRow(s, ["?", "?", "1", "?", "0", "1", "1"], { y: 270, x: 82, cell: 132, gap: 39, labels: true, name: "encode-try" });
  addText(s, "One partner sets the checks. The other partner audits all three groups.", { x: 190, y: 536, w: 900, h: 56, size: 28, bold: true, align: "center" });
  addPromptBadge(s, "Worksheet 3B • audit all 3 checks", { x: 850, y: 173, w: 388, color: C.coral });
  setNotes(s, 7, "Pairs encode 1011. Hint ladder: p1 checks positions 1,3,5,7; p2 checks 2,3,6,7; p4 checks 4,5,6,7. Expected p1=0, p2=1, p4=0. Ask auditors to mark each check even before the reveal.");
}

// 17
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "1 0 1 1 becomes the codeword 0 1 1 0 0 1 1", "Encoding reveal", 17, { titleSize: 44 });
  addBitRow(s, ["0", "1", "1", "0", "0", "1", "1"], { y: 260, x: 82, cell: 132, gap: 39, labels: true, name: "encode-reveal" });
  addText(s, "p₁=0", { x: 158, y: 525, w: 250, h: 43, size: 30, bold: true, color: C.cyan, align: "center" });
  addText(s, "p₂=1", { x: 515, y: 525, w: 250, h: 43, size: 30, bold: true, color: C.blue, align: "center" });
  addText(s, "p₄=0", { x: 872, y: 525, w: 250, h: 43, size: 30, bold: true, color: "#7B61FF", align: "center" });
  addText(s, "Extract positions 3,5,6,7 → 1 0 1 1", { x: 320, y: 601, w: 640, h: 40, size: 26, bold: true, align: "center", color: C.green });
  setNotes(s, 2, "Verify all three groups. Ask students to point to the original message bits in the codeword. This prepares later extraction after repair.");
}

// 18
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Speed round: can your team encode without hints?", "Fluency check", 18, { titleSize: 46 });
  const tasks = [
    ["0 0 0 0", "codeword: _______"],
    ["1 1 1 1", "codeword: _______"],
    ["0 1 0 1", "codeword: _______"],
    ["1 1 0 0", "codeword: _______"],
  ];
  tasks.forEach((t, i) => {
    const x = 42 + (i % 2) * 616;
    const y = 207 + Math.floor(i / 2) * 196;
    addText(s, t[0], { x, y, w: 260, h: 50, size: 36, bold: true, color: i === 3 ? C.coral : C.blue });
    addLine(s, x, y + 67, 540, C.rule, 1);
    addText(s, t[1], { x, y: y + 86, w: 540, h: 50, size: 25, color: C.muted });
  });
  addPromptBadge(s, "Worksheet 3C • one each", { x: 894, y: 586, w: 344 });
  setNotes(s, 6, "Assign one message per teammate, then cross-audit. Answers: 0000→0000000; 1111→1111111; 0101→0100101; 1100→0111100. If a team finishes early, have them prove why 1111 maps to seven 1s.");
}

// 19
{
  const s = deck.slides.add(); s.background.fill = C.navy;
  addText(s, "PAUSE THE SIGNAL", { x: 42, y: 43, w: 520, h: 40, size: 20, color: C.cyan, bold: true });
  addText(s, "05:00", { x: 200, y: 198, w: 880, h: 190, size: 122, color: C.white, bold: true, align: "center", valign: "middle" });
  addText(s, "When you return: we make the message point to its own mistake.", { x: 212, y: 458, w: 856, h: 82, size: 32, color: C.white, align: "center", bold: true });
  addText(s, "Stretch • water • keep your worksheet", { x: 340, y: 583, w: 600, h: 42, size: 23, color: C.cyan, align: "center" });
  addText(s, "19", { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.bluePale, align: "right" });
  setNotes(s, 5, "Take a real five-minute break. Leave the slide projected. Resume by asking students to restate the encoding roles from memory.", { source: false });
}

// 20
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "A corrupted codeword makes specific checks fail", "Error hunt", 20);
  addBitRow(s, ["0", "1", "1", "0", "0", "0", "1"], { y: 252, x: 82, cell: 132, gap: 39, labels: true, corrupt: 6, name: "received" });
  addText(s, "Received: 0 1 1 0 0 0 1", { x: 42, y: 506, w: 500, h: 43, size: 29, bold: true });
  addText(s, "Run all three parity checks again.", { x: 42, y: 570, w: 500, h: 43, size: 27, color: C.muted });
  addText(s, "check 1", { x: 760, y: 504, w: 150, h: 35, size: 25, bold: true, color: C.cyan });
  addText(s, "PASS", { x: 987, y: 504, w: 180, h: 35, size: 25, bold: true, color: C.green });
  addText(s, "check 2", { x: 760, y: 553, w: 150, h: 35, size: 25, bold: true, color: C.blue });
  addText(s, "FAIL", { x: 987, y: 553, w: 180, h: 35, size: 25, bold: true, color: C.coral });
  addText(s, "check 4", { x: 760, y: 602, w: 150, h: 35, size: 25, bold: true, color: "#7B61FF" });
  addText(s, "FAIL", { x: 987, y: 602, w: 180, h: 35, size: 25, bold: true, color: C.coral });
  setNotes(s, 4, "Students recount each check group for received 0110001. Check 1 has two ones and passes; checks 2 and 4 each have three ones and fail. Ask: Which position belongs to check 2 and check 4 but not check 1? Worksheet 4A.");
}

// 21
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Failed labels 2 + 4 point to position 6", "Syndrome address", 21);
  addText(s, "check 1", { x: 96, y: 244, w: 250, h: 45, size: 30, bold: true, color: C.cyan, align: "center" });
  addText(s, "PASS → 0", { x: 96, y: 311, w: 250, h: 60, size: 36, bold: true, align: "center", color: C.green });
  addText(s, "check 2", { x: 515, y: 244, w: 250, h: 45, size: 30, bold: true, color: C.blue, align: "center" });
  addText(s, "FAIL → 2", { x: 515, y: 311, w: 250, h: 60, size: 36, bold: true, align: "center", color: C.coral });
  addText(s, "check 4", { x: 934, y: 244, w: 250, h: 45, size: 30, bold: true, color: "#7B61FF", align: "center" });
  addText(s, "FAIL → 4", { x: 934, y: 311, w: 250, h: 60, size: 36, bold: true, align: "center", color: C.coral });
  addLine(s, 145, 430, 990, C.ink, 2);
  addText(s, "0 + 2 + 4 = 6", { x: 260, y: 467, w: 760, h: 86, size: 58, bold: true, align: "center", color: C.blue });
  addText(s, "Flip bit 6, then verify all checks pass.", { x: 305, y: 586, w: 670, h: 43, size: 28, bold: true, align: "center" });
  setNotes(s, 5, "Name this three-check result the syndrome. The most beginner-friendly rule is to add the labels of failed checks. Optionally connect to binary: fail pattern check4-check2-check1 is 110₂ = 6. Students correct position 6 from 0 back to 1 and recover 0110011.");
}

// 22
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "The syndrome is a seven-way pointer", "Why correction works", 22);
  addCoverageMap(s, { y: 225, memberships: true });
  addText(s, "No failed checks → address 0 → no error", { x: 42, y: 586, w: 530, h: 42, size: 26, bold: true, color: C.green });
  addText(s, "Any nonzero address 1–7 → flip that position", { x: 650, y: 586, w: 588, h: 42, size: 26, bold: true, color: C.blue, align: "right" });
  setNotes(s, 2, "Connect back to the address detective game: an error at one position flips exactly the checks that cover that position, so the failed-check pattern is unique. Emphasize the one-error assumption.");
}

// 23
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Repair first; read the message second", "Decode routine", 23);
  addFourStep(s, [
    { title: "Run checks", body: "Mark each group pass or fail." },
    { title: "Find address", body: "Add labels of the failed checks." },
    { title: "Flip once", body: "Change the bit at that address." },
    { title: "Extract data", body: "Read positions 3,5,6,7." },
  ]);
  setNotes(s, 2, "Students copy the decode routine onto Worksheet 4A. Make them say the order aloud: checks, address, flip, extract. Warn that extracting before repairing can preserve the wrong data bit.");
}

// 24
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Packet repair race: two corrupted transmissions", "Team challenge", 24);
  addText(s, "Packet A", { x: 42, y: 215, w: 240, h: 48, size: 34, bold: true, color: C.blue });
  addText(s, "0 1 0 1 1 0 1", { x: 42, y: 282, w: 530, h: 66, size: 44, bold: true });
  addText(s, "Find error → correct → message", { x: 42, y: 370, w: 530, h: 48, size: 25, color: C.muted });
  addLine(s, 42, 446, 530, C.rule, 2);
  addText(s, "Packet B", { x: 666, y: 215, w: 240, h: 48, size: 34, bold: true, color: C.coral });
  addText(s, "0 1 1 1 1 0 1", { x: 666, y: 282, w: 530, h: 66, size: 44, bold: true });
  addText(s, "Find error → correct → message", { x: 666, y: 370, w: 530, h: 48, size: 25, color: C.muted });
  addLine(s, 666, 446, 530, C.rule, 2);
  addText(s, "Every teammate must be able to explain one failed check.", { x: 207, y: 540, w: 866, h: 50, size: 30, bold: true, align: "center" });
  addPromptBadge(s, "Worksheet 4B • show all three counts", { x: 833, y: 607, w: 405 });
  setNotes(s, 7, "Teams repair both. Packet A 0101101 has only check 4 failing, so error position 4; corrected 0100101; message 0101. Packet B 0111101 has all checks failing, so error position 7; corrected 0111100; message 1100. Require visible check counts, not guesses.");
}

// 25
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Create, corrupt, swap, rescue", "Partner packet exchange", 25);
  addFourStep(s, [
    { title: "Choose", body: "Invent any four-bit message." },
    { title: "Encode", body: "Build a valid seven-bit codeword." },
    { title: "Corrupt", body: "Flip exactly one position; record it secretly." },
    { title: "Rescue", body: "Swap papers. Repair and recover the message." },
  ], { y: 210 });
  addText(s, "Success = corrected codeword + recovered message + explanation", { x: 220, y: 612, w: 840, h: 40, size: 25, bold: true, align: "center", color: C.green });
  setNotes(s, 12, "Use Worksheet 5A. First partner creates while the other audits, then both secretly flip one bit and swap. Receiver shows all checks and the syndrome. Sender verifies the recovered message. If a pair finishes, repeat with a check-bit error and compare with a data-bit error. This is the longest independent practice before the solo task.");
}

// 26
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "One-error correction has a sharp boundary", "System limits", 26);
  addText(s, "0 errors", { x: 42, y: 216, w: 360, h: 48, size: 34, bold: true });
  addText(s, "syndrome 0\nleave the word alone", { x: 42, y: 288, w: 360, h: 112, size: 26, color: C.green });
  addText(s, "1 error", { x: 460, y: 216, w: 360, h: 48, size: 34, bold: true });
  addText(s, "syndrome 1–7\nflip that address", { x: 460, y: 288, w: 360, h: 112, size: 26, color: C.blue });
  addText(s, "2 errors", { x: 878, y: 216, w: 360, h: 48, size: 34, bold: true });
  addText(s, "may imitate one error\ndo not trust the repair", { x: 878, y: 288, w: 360, h: 112, size: 26, color: C.coral });
  addBox(s, { x: 42, y: 475, w: 1196, h: 118, fill: C.amberPale, line: C.amber, radius: false, name: "limit-callout" });
  addText(s, "Guarantee: Hamming(7,4) corrects any single-bit error—not every possible pattern of damage.", { x: 82, y: 504, w: 1116, h: 62, size: 30, bold: true, align: "center", color: C.ink });
  setNotes(s, 4, "Have students predict what two errors might do, then state the guarantee precisely. A standard Hamming(7,4) decoder can miscorrect a double error because the two error addresses combine into a third nonzero syndrome. Avoid implying it reliably detects two errors.");
}

// 27
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Bonus eighth bit: detect two errors", "Extended Hamming(8,4)", 27);
  addText(s, "Positions 1–7", { x: 42, y: 218, w: 500, h: 46, size: 32, bold: true });
  addText(s, "the Hamming(7,4) codeword", { x: 42, y: 278, w: 500, h: 48, size: 26, color: C.muted });
  addText(s, "+", { x: 571, y: 250, w: 100, h: 70, size: 54, bold: true, color: C.blue, align: "center" });
  addText(s, "Position 8", { x: 718, y: 218, w: 500, h: 46, size: 32, bold: true });
  addText(s, "one overall even-parity bit", { x: 718, y: 278, w: 500, h: 48, size: 26, color: C.muted });
  addLine(s, 42, 369, 1196, C.rule, 2);
  addText(s, "Syndrome ≠ 0 + overall parity odd", { x: 42, y: 419, w: 560, h: 44, size: 25, bold: true, color: C.blue });
  addText(s, "→ correct one error in positions 1–7", { x: 42, y: 472, w: 560, h: 44, size: 23 });
  addText(s, "Syndrome ≠ 0 + overall parity even", { x: 678, y: 419, w: 560, h: 44, size: 25, bold: true, color: C.coral });
  addText(s, "→ detect two errors; do not correct", { x: 678, y: 472, w: 560, h: 44, size: 23 });
  addText(s, "The extra bit turns single-error correction into SECDED: single-error correction, double-error detection.", { x: 126, y: 578, w: 1028, h: 60, size: 25, bold: true, align: "center" });
  setNotes(s, 4, "Treat this as optional enrichment, not required mastery. Ask students to add an eighth overall parity bit to 0110011: it contains four ones, so bit 8 is 0. Explain the four decoding cases only if time; Worksheet 6B contains the complete table.");
}

// 28
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Solo certification: encode, then rescue", "Final challenge", 28);
  addText(s, "Part A", { x: 42, y: 205, w: 220, h: 45, size: 30, bold: true, color: C.blue });
  addText(s, "Encode the message 1 0 0 1.", { x: 42, y: 268, w: 545, h: 60, size: 38, bold: true });
  addText(s, "Show p₁, p₂, p₄ and audit all checks.", { x: 42, y: 356, w: 545, h: 74, size: 25, color: C.muted });
  addText(s, "Part B", { x: 666, y: 205, w: 220, h: 45, size: 30, bold: true, color: C.coral });
  addText(s, "Repair 0 0 1 1 1 0 1.", { x: 666, y: 268, w: 545, h: 60, size: 38, bold: true });
  addText(s, "Name the bad position and recover the message.", { x: 666, y: 356, w: 545, h: 74, size: 25, color: C.muted });
  addLine(s, 42, 482, 1196, C.rule, 2);
  addText(s, "No partner. Notes allowed. Every check must be visible.", { x: 240, y: 528, w: 800, h: 50, size: 30, bold: true, align: "center" });
  addPromptBadge(s, "Worksheet 6A • 5 minutes", { x: 470, y: 608, w: 340, color: C.green });
  setNotes(s, 5, "Students work alone. Part A expected codeword 0011001. Part B: checks 1 and 4 fail, so error position 5; correct to 0011001; extract 1001. Use this as the learning-outcome check. Provide only process prompts: roles, check sets, add failed labels.");
}

// 29
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addHeader(s, "Certification check", "Answer check", 29);
  addText(s, "Part A", { x: 42, y: 210, w: 220, h: 44, size: 30, bold: true, color: C.blue });
  addText(s, "0 0 1 1 0 0 1", { x: 42, y: 275, w: 560, h: 62, size: 42, bold: true });
  addText(s, "message 1 0 0 1 • p₁=0, p₂=0, p₄=1", { x: 42, y: 366, w: 560, h: 45, size: 23, color: C.muted });
  addText(s, "Part B", { x: 666, y: 210, w: 220, h: 44, size: 30, bold: true, color: C.coral });
  addText(s, "error at position 5", { x: 666, y: 275, w: 560, h: 62, size: 38, bold: true });
  addText(s, "corrected 0011001 • message 1001", { x: 666, y: 366, w: 560, h: 54, size: 24, color: C.muted });
  addBox(s, { x: 42, y: 505, w: 1196, h: 112, fill: C.greenPale, line: C.green, radius: false });
  addText(s, "If your method found both answers, you can do Hamming(7,4).", { x: 112, y: 536, w: 1056, h: 52, size: 34, bold: true, align: "center", color: C.green });
  setNotes(s, 1, "Students self-check in a different color and fix any process error. Collect or glance at Part B to see who independently met the outcome. Do not frame corrections as failure; the visible method identifies exactly where the thinking diverged.");
}

// 30
{
  const s = deck.slides.add(); s.background.fill = C.white;
  addText(s, "SIGNAL RESTORED", { x: 42, y: 42, w: 430, h: 35, size: 18, color: C.green, bold: true });
  addText(s, "You built a message that points to its own mistake.", { x: 42, y: 174, w: 1080, h: 155, size: 64, bold: true, name: "closing-title" });
  addText(s, "parity", { x: 42, y: 414, w: 280, h: 50, size: 33, bold: true, color: C.cyan });
  addText(s, "overlapping checks", { x: 365, y: 414, w: 360, h: 50, size: 33, bold: true, color: C.blue });
  addText(s, "syndrome address", { x: 781, y: 414, w: 390, h: 50, size: 33, bold: true, color: C.coral });
  addLine(s, 42, 495, 1130, C.rule, 2);
  addText(s, "Exit whisper: What is the one step you are least likely to forget?", { x: 140, y: 548, w: 1000, h: 60, size: 28, bold: true, align: "center" });
  addText(s, "30", { x: 1184, y: 672, w: 54, h: 20, size: 14, color: C.muted, align: "right" });
  setNotes(s, 1, "Pairs share one memorable step. Close by naming Hamming's achievement: not magic, but three deliberately overlapping parity questions. Invite students to keep the worksheet as a reusable decoder guide.");
}

await fs.mkdir(PREVIEW_DIR, { recursive: true });
for (const [index, slide] of deck.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await deck.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(`${PREVIEW_DIR}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${PREVIEW_DIR}/${stem}.layout.json`, await layout.text());
}
const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(`${PREVIEW_DIR}/deck-montage.webp`, new Uint8Array(await montage.arrayBuffer()));

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(OUT);
console.log(`Created ${OUT} with ${deck.slides.items.length} slides.`);
