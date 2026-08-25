(() => {
  const roles = ["check 1", "check 2", "data 1", "check 4", "data 2", "data 3", "data 4"];

  function bitRow(bits, options = {}) {
    const { corrupt = 0, labels = true, fixed7 = false, className = "" } = options;
    const rowRoles = fixed7 ? [...roles.slice(0, 6), "fixed 0"] : roles;
    return `<div class="bit-row ${className}">${bits.map((bit, index) => {
      const position = index + 1;
      const check = [1, 2, 4].includes(position);
      const bad = position === corrupt;
      return `<div class="bit-unit ${check ? "check" : ""} ${bad ? "bad" : ""}">
        <span class="bit-pos">${position}</span>
        <div class="bit-cell">${bit}</div>
        ${labels ? `<span class="bit-role">${rowRoles[index]}</span>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  function coverageMap(memberships = true) {
    const rows = [
      { label: "check 1", positions: [1, 3, 5, 7], cls: "c1 cyan" },
      { label: "check 2", positions: [2, 3, 6, 7], cls: "c2 blue" },
      { label: "check 4", positions: [4, 5, 6, 7], cls: "c4 violet" },
    ];
    let html = `<div class="coverage"><span></span>${[1,2,3,4,5,6,7].map(n => `<span class="pos">${n}</span>`).join("")}`;
    rows.forEach(row => {
      html += `<span class="label ${row.cls.split(" ")[1]}">${row.label}</span>`;
      for (let p = 1; p <= 7; p += 1) {
        const active = row.positions.includes(p);
        html += `<span class="coverage-cell ${active ? `active ${row.cls.split(" ")[0]}` : ""}">${active ? (memberships ? "YES" : "●") : ""}</span>`;
      }
    });
    return `${html}</div>`;
  }

  function steps(items) {
    return `<div class="steps">${items.map((item, index) => `<div class="step">
      <span class="step-number">${index + 1}</span>
      <div class="step-rule"></div>
      <h3>${item[0]}</h3>
      <p>${item[1]}</p>
    </div>`).join("")}</div>`;
  }

  function badge(text, cls = "") {
    return `<span class="prompt-badge ${cls}">${text}</span>`;
  }

  const archivalSlides = [
    {
      section: "Cover", title: "Signal Rescue Lab", minutes: 2, hideHeader: true, className: "cover",
      body: `<div class="cover-grid">
        <div class="cover-copy">
          <span class="cover-label">GLITCH! // LEVEL 2</span>
          <h1>Signal Rescue Lab</h1>
          <p class="cover-subtitle">Build a message that can find and fix its own one-bit mistake.</p>
          <p class="cover-meta">A two-hour math circle • Grades 9–10</p>
        </div>
        <figure class="cover-hero"><img src="assets/hamming-signal-hero.png" alt="Seven binary tiles travel through three scanning beams; one tile is corrupted"></figure>
      </div>`,
      notes: "Welcome students as returning signal engineers. Ask them to silently count the seven tiles and spot the corrupted one. Today’s challenge is not merely to notice damage; it is to make the message tell us exactly where the damage happened. Do not name Hamming codes yet."
    },
    {
      section: "Mission briefing", title: "Your mission has one precise finish line", minutes: 2,
      body: `<p class="medium bold muted">By the end, you will be able to…</p>
        <div class="mission-grid">
          <div><strong class="blue">ENCODE</strong><p>four message bits into seven</p></div>
          <div><strong class="coral">REPAIR</strong><p>any single flipped bit</p></div>
          <div><strong class="green">PROVE IT</strong><p>with a solo final challenge</p></div>
        </div>
        <p class="medium bold" style="margin-top:84px">You will invent every ingredient along the way.</p>`,
      notes: "Read the three verbs aloud. Students give a thumbs-sideways or thumbs-up for how possible this feels. Tell them the solo challenge is open-note and the worksheet is their lab notebook."
    },
    {
      section: "The impossible repair", title: "A damaged message cannot explain itself", minutes: 4,
      body: `<p class="huge center bold" style="margin-top:58px;letter-spacing:.16em">1 0 1 ? 1 1 0</p>
        <p class="big center bold" style="margin-top:50px">What was the missing bit?</p>
        <p class="body center muted">Convince someone who disagrees.</p>
        <div class="bottom-center">${badge("THINK → PAIR → SHARE", "coral-bg")}</div>`,
      notes: "Give 30 seconds of silence, then pairs discuss. Accept both 0 and 1 as possible. Key conclusion: without extra structure, the receiver cannot know. Ask what extra information could be added without sending the whole message twice. Use Worksheet 1A."
    },
    {
      section: "Parity sprint", title: "One extra bit can make a promise", minutes: 5,
      body: `<div class="top-right">${badge("Worksheet 1B • race all four")}</div>
        <div class="parity-row">
          <div class="parity-cell">1</div><div class="parity-cell">0</div><div class="parity-cell">1</div><div class="parity-cell check">0</div>
        </div>
        <p class="big center bold" style="margin-top:42px">2 ones already → add 0</p>
        <p class="medium center bold blue" style="margin-top:55px">EVEN PARITY: the total number of 1s must be even.</p>`,
      notes: "Model 101. Then teams complete 111, 000, and 0101 on Worksheet 1B. Answers: 111 needs 1; 000 needs 0; 0101 needs 0. Ask teams to hold up fingers 0 or 1 together. Emphasize the convention is even parity."
    },
    {
      section: "What parity can do", title: "Parity raises an alarm—but gives no address", minutes: 3,
      body: `<div class="split" style="margin-top:38px">
          <div><p class="body muted bold">Sent</p><p class="display bold">1 0 1 0</p><p class="medium bold green">even ✓</p></div>
          <div><p class="body muted bold">Received</p><p class="display bold">1 1 1 0</p><p class="medium bold coral">odd !</p></div>
        </div>
        <p class="big center bold" style="margin-top:50px">Which position changed?</p>
        <p class="body center muted">One check gives one yes/no answer. We need several overlapping checks.</p>`,
      notes: "Ask students to name all four possible single-bit changes that could create odd parity. Conclude that one alarm detects a problem but cannot locate it. This creates the need for overlapping checks."
    },
    {
      section: "Address detective", title: "Three yes/no questions can name any position 1–7", minutes: 6, compact: true,
      body: `<div class="split tight" style="grid-template-columns:260px 1fr;margin-top:18px">
          <div><p class="body muted bold">Secret position</p><div class="secret-card">?</div></div>
          <div class="question-stack">
            <p class="cyan">Is it in 1, 3, 5, 7?</p>
            <p class="blue">Is it in 2, 3, 6, 7?</p>
            <p class="violet">Is it in 4, 5, 6, 7?</p>
            <p class="body">Challenge: choose a secret position. Your partner asks only these three questions.</p>
          </div>
        </div>`,
      notes: "Pairs play three rounds. Partner A chooses a position 1–7; Partner B asks the three displayed questions and records yes/no. Each position has a unique pattern. If stuck, write the three answers next to each number on Worksheet 1C."
    },
    {
      section: "Three overlapping check groups", title: "The failed checks spell the position’s address", minutes: 3, compact: true,
      body: `${coverageMap(true)}
        <p class="medium center bold" style="margin-top:34px">Example: position 6 answers NO, YES, YES → 2 + 4 = 6</p>`,
      notes: "Have the room read down the column for position 6: check 1 no, check 2 yes, check 4 yes. The labels of the YES rows add to 6. Ask for positions 3, 5, and 7: 1+2, 1+4, and 1+2+4. Use Worksheet 1C."
    },
    {
      section: "Human code game", title: "Become the seven-position machine", minutes: 7,
      body: `${bitRow(["1","0","1","1","0","0","1"], { labels: false, className: "human-row" })}
        <div class="split tight" style="margin-top:58px">
          <div><p class="medium bold cyan">Round 1: stand if check 1 covers you.</p><p class="medium bold blue">Round 2: stand if check 2 covers you.</p></div>
          <div><p class="medium bold violet">Round 3: stand if check 4 covers you.</p><p class="medium bold coral">Finale: one person flips their bit. Which checks become odd?</p></div>
        </div>`,
      notes: "Invite seven volunteers and give each a position card. For each check, students in that group stand or raise a card. Secretly tap one volunteer to flip their bit. The class counts each group and uses the odd-group labels to name the volunteer."
    },
    {
      section: "Build the seven-slot machine", title: "Powers of two become the check-bit stations", minutes: 3, compact: true,
      body: `${bitRow(["p₁","p₂","d₁","p₄","d₂","d₃","d₄"], { labels: false })}
        <div class="dual-labels"><div><strong class="blue">CHECK BITS</strong><span>positions 1, 2, 4</span></div><div><strong>MESSAGE BITS</strong><span>positions 3, 5, 6, 7</span></div></div>`,
      notes: "Name the positions and roles. Ask why 1, 2, and 4 are special: they are exactly the check labels and each belongs to only its own check group. Students fill the role row on Worksheet 2A."
    },
    {
      section: "Coverage map", title: "Each check bit controls its own overlapping group", minutes: 3,
      body: `${coverageMap(false)}
        <p class="medium center bold" style="margin-top:32px">Choose each check bit so its whole row has an even number of 1s.</p>`,
      notes: "Point out that each check includes its own check-bit position. Students trace the three sets on Worksheet 2A. Quick questions: Does check 1 cover 6? No. Check 2? Yes. Check 4? Yes."
    },
    {
      section: "Restricted warm-up", title: "Training wheels: use three message bits first", minutes: 2,
      body: `${bitRow(["?","?","d₁","?","d₂","d₃","0"], { fixed7: true })}
        <p class="medium center bold" style="margin-top:40px">Place data in 3, 5, 6. Lock position 7 at zero.</p>
        <p class="small center muted italic">This is a restricted practice version—not the standard Hamming(7,3) code.</p>`,
      notes: "We are taking the full seven-slot machine and fixing the last message slot at 0. This lets students practice all three parity checks with less cognitive load. Use Worksheet 2B."
    },
    {
      section: "Training-wheels challenge", title: "Encode the three bits 1 0 1", minutes: 5,
      body: `<div class="top-right">${badge("Worksheet 2B • build all 7 bits")}</div>
        ${bitRow(["?","?","1","?","0","1","0"], { fixed7: true })}
        <p class="medium center bold" style="margin-top:42px">Find p₁, p₂, p₄ so every check group is even.</p>`,
      notes: "Pairs solve without a formula. Hint ladder: start with check 1 positions 1,3,5,7; count known 1s; choose p1 to make the count even; repeat for checks 2 and 4. Expected p1=1, p2=0, p4=1."
    },
    {
      section: "Training-wheels reveal", title: "The warm-up codeword is 1 0 1 1 0 1 0", minutes: 2, compact: true,
      body: `${bitRow(["1","0","1","1","0","1","0"], { fixed7: true })}
        <div class="three-checks">
          <p class="check-math cyan">check 1: 1+1+0+0 = 2</p>
          <p class="check-math blue">check 2: 0+1+1+0 = 2</p>
          <p class="check-math violet">check 4: 1+0+1+0 = 2</p>
        </div>
        <p class="medium center bold green" style="margin-top:25px">All three totals are even ✓</p>`,
      notes: "Have three students each verify one check aloud. Ask what changes if the original three bits change: only the count in the groups, not the groups themselves."
    },
    {
      section: "Full code", title: "Now unlock position 7: this is Hamming(7,4)", minutes: 3, compact: true,
      body: `${bitRow(["p₁","p₂","d₁","p₄","d₂","d₃","d₄"])}
        <p class="big center bold" style="margin-top:42px">4 message bits <span class="blue">→ 7 transmitted bits</span></p>
        <p class="body center muted">The same three checks still do all the work.</p>`,
      notes: "Hamming(7,4) means seven transmitted bits carry four message bits. The three check bits are the redundancy that buys single-error correction. Students circle the four data stations on Worksheet 3A."
    },
    {
      section: "Hamming(7,4) recipe", title: "Encoding is a four-move routine", minutes: 3,
      body: steps([
        ["Label 1–7", "Keep the address above every slot."],
        ["Place data", "Write d₁,d₂,d₃,d₄ in 3,5,6,7."],
        ["Set checks", "Choose p₁,p₂,p₄ so each group is even."],
        ["Verify", "Recount all three groups before sending."]
      ]),
      notes: "Students write this recipe in their own words on Worksheet 3A. A consistent order prevents mistakes."
    },
    {
      section: "Full Hamming(7,4)", title: "Pair challenge: encode 1 0 1 1", minutes: 7,
      body: `<div class="top-right">${badge("Worksheet 3B • audit all 3 checks", "coral-bg")}</div>
        ${bitRow(["?","?","1","?","0","1","1"])}
        <p class="medium center bold" style="margin-top:42px">One partner sets the checks. The other partner audits all three groups.</p>`,
      notes: "Pairs encode 1011. Hint with the three check sets if needed. Expected p1=0, p2=1, p4=0. Ask auditors to mark each check even before the reveal."
    },
    {
      section: "Encoding reveal", title: "1 0 1 1 becomes 0 1 1 0 0 1 1", minutes: 2, compact: true,
      body: `${bitRow(["0","1","1","0","0","1","1"])}
        <div class="three-checks"><p class="medium center bold cyan">p₁=0</p><p class="medium center bold blue">p₂=1</p><p class="medium center bold violet">p₄=0</p></div>
        <p class="body center bold green">Extract positions 3,5,6,7 → 1 0 1 1</p>`,
      notes: "Verify all three groups. Ask students to point to the original message bits in the codeword. This prepares extraction after repair."
    },
    {
      section: "Fluency check", title: "Speed round: can your team encode without hints?", minutes: 6, compact: true,
      body: `<div class="task-grid">
          <div class="task"><strong class="blue">0 0 0 0</strong><span>codeword: _______</span></div>
          <div class="task"><strong class="blue">1 1 1 1</strong><span>codeword: _______</span></div>
          <div class="task"><strong class="blue">0 1 0 1</strong><span>codeword: _______</span></div>
          <div class="task"><strong class="coral">1 1 0 0</strong><span>codeword: _______</span></div>
        </div>
        <div class="bottom-center">${badge("Worksheet 3C • one each")}</div>`,
      notes: "Assign one message per teammate, then cross-audit. Answers: 0000→0000000; 1111→1111111; 0101→0100101; 1100→0111100. Early finishers prove why 1111 maps to seven 1s."
    },
    {
      section: "Break", title: "Pause the signal", minutes: 5, hideHeader: true, className: "dark break-slide",
      body: `<span class="eyebrow">PAUSE THE SIGNAL</span>
        <div id="breakTimer" class="break-time" aria-live="polite">05:00</div>
        <p class="medium bold">When you return: we make the message point to its own mistake.</p>
        <p class="body cyan">Stretch • water • keep your worksheet</p>
        <div class="break-controls"><button id="startBreak" type="button">Start / pause</button><button id="resetBreak" type="button">Reset</button></div>`,
      notes: "Take a real five-minute break. Leave this slide projected. Resume by asking students to restate the encoding roles from memory."
    },
    {
      section: "Error hunt", title: "A corrupted codeword makes specific checks fail", minutes: 4,
      body: `${bitRow(["0","1","1","0","0","0","1"], { corrupt: 6 })}
        <div class="split tight" style="margin-top:34px">
          <div><p class="medium bold">Received: 0 1 1 0 0 0 1</p><p class="body muted">Run all three parity checks again.</p></div>
          <div class="status-list"><span class="cyan bold">check 1</span><strong class="green">PASS</strong><span class="blue bold">check 2</span><strong class="coral">FAIL</strong><span class="violet bold">check 4</span><strong class="coral">FAIL</strong></div>
        </div>`,
      notes: "Students recount each check group for 0110001. Check 1 has two ones and passes; checks 2 and 4 each have three ones and fail. Ask which position belongs to checks 2 and 4 but not check 1. Use Worksheet 4A."
    },
    {
      section: "Syndrome address", title: "Failed labels 2 + 4 point to position 6", minutes: 5,
      body: `<div class="syndrome-grid">
          <div><h3 class="cyan">check 1</h3><strong class="green">PASS → 0</strong></div>
          <div><h3 class="blue">check 2</h3><strong class="coral">FAIL → 2</strong></div>
          <div><h3 class="violet">check 4</h3><strong class="coral">FAIL → 4</strong></div>
        </div>
        <div class="big-rule" style="margin-top:48px"></div>
        <p class="equation">0 + 2 + 4 = 6</p>
        <p class="medium center bold">Flip bit 6, then verify all checks pass.</p>`,
      notes: "Name the three-check result the syndrome. Add the labels of failed checks. Optionally connect to binary: 110₂ = 6. Students correct position 6 from 0 back to 1 and recover 0110011."
    },
    {
      section: "Why correction works", title: "The syndrome is a seven-way pointer", minutes: 2,
      body: `${coverageMap(true)}
        <div class="split tight" style="margin-top:34px"><p class="body bold green">No failed checks → address 0 → no error</p><p class="body bold blue right">Any nonzero address 1–7 → flip that position</p></div>`,
      notes: "Connect back to the address detective game. An error flips exactly the checks that cover its position, so the failed-check pattern is unique. Emphasize the one-error assumption."
    },
    {
      section: "Decode routine", title: "Repair first; read the message second", minutes: 2,
      body: steps([
        ["Run checks", "Mark each group pass or fail."],
        ["Find address", "Add labels of the failed checks."],
        ["Flip once", "Change the bit at that address."],
        ["Extract data", "Read positions 3,5,6,7."]
      ]),
      notes: "Students copy the decode routine onto Worksheet 4A. Say the order aloud: checks, address, flip, extract. Extracting before repairing can preserve a wrong data bit."
    },
    {
      section: "Team challenge", title: "Packet repair race: two corrupted transmissions", minutes: 7,
      body: `<div class="split tight" style="margin-top:20px">
          <div><p class="big bold blue">Packet A</p><p class="display bold">0 1 0 1 1 0 1</p><p class="body muted">Find error → correct → message</p><div class="big-rule"></div></div>
          <div><p class="big bold coral">Packet B</p><p class="display bold">0 1 1 1 1 0 1</p><p class="body muted">Find error → correct → message</p><div class="big-rule"></div></div>
        </div>
        <p class="medium center bold" style="margin-top:50px">Every teammate must be able to explain one failed check.</p>
        <div class="bottom-center">${badge("Worksheet 4B • show all three counts")}</div>`,
      notes: "Packet A 0101101 has only check 4 failing: error at 4; corrected 0100101; message 0101. Packet B 0111101 has all checks failing: error at 7; corrected 0111100; message 1100. Require visible counts."
    },
    {
      section: "Partner packet exchange", title: "Create, corrupt, swap, rescue", minutes: 12,
      body: `${steps([
        ["Choose", "Invent any four-bit message."],
        ["Encode", "Build a valid seven-bit codeword."],
        ["Corrupt", "Flip exactly one position; record it secretly."],
        ["Rescue", "Swap papers. Repair and recover the message."]
      ])}
        <p class="body center bold green" style="margin-top:40px">Success = corrected codeword + recovered message + explanation</p>`,
      notes: "Use Worksheet 5A. Each partner creates, audits, flips one bit secretly, and swaps. The receiver shows all checks and the syndrome; the sender verifies the recovered message. Early finishers compare a check-bit error with a data-bit error."
    },
    {
      section: "System limits", title: "One-error correction has a sharp boundary", minutes: 4,
      body: `<div class="limit-grid">
          <div><h3>0 errors</h3><p class="green">syndrome 0<br>leave the word alone</p></div>
          <div><h3>1 error</h3><p class="blue">syndrome 1–7<br>flip that address</p></div>
          <div><h3>2 errors</h3><p class="coral">may imitate one error<br>do not trust the repair</p></div>
        </div>
        <div class="callout amber-callout medium center bold" style="margin-top:55px">Guarantee: Hamming(7,4) corrects any single-bit error—not every possible pattern of damage.</div>`,
      notes: "Have students predict what two errors might do, then state the guarantee precisely. A standard Hamming(7,4) decoder can miscorrect a double error because the two error addresses combine into a third nonzero syndrome."
    },
    {
      section: "Extended Hamming(8,4)", title: "Bonus eighth bit: detect two errors", minutes: 4,
      body: `<div class="split tight" style="margin-top:16px">
          <div><p class="big bold">Positions 1–7</p><p class="body muted">the Hamming(7,4) codeword</p></div>
          <div><p class="big bold">+ Position 8</p><p class="body muted">one overall even-parity bit</p></div>
        </div>
        <div class="big-rule" style="margin:24px 0 28px"></div>
        <div class="split tight">
          <div><p class="body bold blue">Syndrome ≠ 0 + overall parity odd</p><p class="small">→ correct one error in positions 1–7</p></div>
          <div><p class="body bold coral">Syndrome ≠ 0 + overall parity even</p><p class="small">→ detect two errors; do not correct</p></div>
        </div>
        <p class="body center bold" style="margin-top:48px">SECDED = single-error correction, double-error detection.</p>`,
      notes: "Optional enrichment. Add an eighth overall parity bit to 0110011: it has four ones, so bit 8 is 0. Explain the full four-case table only if time; Worksheet 6B contains it."
    },
    {
      section: "Final challenge", title: "Solo certification: encode, then rescue", minutes: 5,
      body: `<div class="split tight" style="margin-top:18px">
          <div><p class="medium bold blue">Part A</p><p class="big bold">Encode the message 1 0 0 1.</p><p class="body muted">Show p₁, p₂, p₄ and audit all checks.</p></div>
          <div><p class="medium bold coral">Part B</p><p class="big bold">Repair 0 0 1 1 1 0 1.</p><p class="body muted">Name the bad position and recover the message.</p></div>
        </div>
        <div class="big-rule" style="margin-top:40px"></div>
        <p class="medium center bold">No partner. Notes allowed. Every check must be visible.</p>
        <div class="bottom-center">${badge("Worksheet 6A • 5 minutes", "green-bg")}</div>`,
      notes: "Students work alone. Part A codeword: 0011001. Part B: checks 1 and 4 fail, so error position 5; correct to 0011001; extract 1001. Provide only process prompts: roles, check sets, add failed labels."
    },
    {
      section: "Answer check", title: "Certification check", minutes: 1,
      body: `<div class="split tight" style="margin-top:18px">
          <div><p class="medium bold blue">Part A</p><p class="display bold">0 0 1 1 0 0 1</p><p class="body muted">message 1 0 0 1 • p₁=0, p₂=0, p₄=1</p></div>
          <div><p class="medium bold coral">Part B</p><p class="big bold">error at position 5</p><p class="body muted">corrected 0011001 • message 1001</p></div>
        </div>
        <div class="callout green-callout big center bold green" style="margin-top:58px">If your method found both answers, you can do Hamming(7,4).</div>`,
      notes: "Students self-check in a different color and fix any process error. Collect or glance at Part B to see who independently met the outcome. Visible working shows exactly where thinking diverged."
    },
    {
      section: "Close", title: "Signal restored", minutes: 1, hideHeader: true, className: "closing",
      body: `<span class="eyebrow">SIGNAL RESTORED</span>
        <h1>You built a message that points to its own mistake.</h1>
        <div class="concept-row"><span class="cyan">parity</span><span class="blue">overlapping checks</span><span class="coral">syndrome address</span></div>
        <div class="big-rule" style="margin-top:30px"></div>
        <p class="medium center bold" style="margin-top:46px">Exit whisper: What is the one step you are least likely to forget?</p>`,
      notes: "Pairs share one memorable step. Close by naming Hamming’s achievement: not magic, but three deliberately overlapping parity questions. Invite students to keep the worksheet as a reusable decoder guide.\n\nSource: R. W. Hamming, ‘Error Detecting and Error Correcting Codes,’ Bell System Technical Journal 29(2), 1950. https://doi.org/10.1002/j.1538-7305.1950.tb00463.x"
    }
  ];

  function binaryStrip(patterns) {
    return `<div class="binary-strip">${patterns.map((pattern, index) => `<div class="binary-item ${index === 0 ? "zero" : ""}"><span>${index}</span><strong>${pattern}</strong>${index === 0 ? "<small>no error</small>" : ""}</div>`).join("")}</div>`;
  }

  const slides = [
    {
      section: "Cover", title: "Can a message point to its own mistake?", minutes: 2, hideHeader: true, className: "cover",
      body: `<div class="cover-grid">
        <div class="cover-copy">
          <span class="cover-label">GLITCH! // LEVEL 2</span>
          <h1>Can a message point to its own mistake?</h1>
          <p class="cover-subtitle">Today you will design the idea—not just learn the recipe.</p>
          <p class="cover-meta">A two-hour math circle • Grades 9–10</p>
        </div>
        <figure class="cover-hero"><img src="assets/hamming-signal-hero.png" alt="Seven binary tiles travel through three scanning beams; one tile is corrupted"></figure>
      </div>`,
      notes: "Ask students to inspect the image. What could the three beams be doing? Do not name parity or Hamming codes. Our goal is to invent a message that helps the receiver locate one damaged bit."
    },
    {
      section: "The information problem", title: "Why can’t the receiver recover a missing bit?", minutes: 4,
      body: `<p class="huge center bold" style="margin-top:55px;letter-spacing:.16em">1 0 1 ? 1 1 0</p>
        <p class="big center bold" style="margin-top:52px">Both 0 and 1 fit what the receiver can see.</p>
        <p class="body center muted">Once information disappears, clever guessing cannot bring it back.</p>
        <div class="bottom-center">${badge("WHAT EXTRA INFORMATION WOULD HELP?", "coral-bg")}</div>`,
      notes: "Give silent think time, then pairs. Ask for two different original messages consistent with the damaged string. The proof of impossibility is that both choices fit. Correction needs redundancy sent before damage happens. Worksheet 1A."
    },
    {
      section: "Engineering constraint", title: "What must the extra bits tell us?", minutes: 3,
      body: `<p class="big center bold" style="margin-top:22px">The channel may flip at most one of seven transmitted bits.</p>
        <div class="big-rule" style="margin:36px 0"></div>
        <div class="state-count">
          <div><strong class="green">NO ERROR</strong><span>one state</span></div>
          <div class="plus">+</div>
          <div><strong class="coral">ERROR AT 1, 2, 3, 4, 5, 6, OR 7</strong><span>seven states</span></div>
        </div>
        <p class="big center bold" style="margin-top:68px">The receiver must distinguish eight possible states.</p>`,
      notes: "Count the possibilities aloud: one no-error state plus seven error positions. Ask what kind of information could name one of eight states. Do not answer yet."
    },
    {
      section: "Try the obvious idea", title: "Why isn’t one parity check enough?", minutes: 4,
      body: `<div class="parity-row"><div class="parity-cell">1</div><div class="parity-cell">0</div><div class="parity-cell">1</div><div class="parity-cell check">0</div></div>
        <p class="medium center bold" style="margin-top:34px">Even before sending</p>
        <p class="big center bold coral" style="margin-top:46px">After one flip, parity becomes odd.</p>
        <p class="medium center bold">It answers “Did something change?”—not “Where?”</p>`,
      notes: "Model even parity, then use Worksheet 1B. Imagine each position flipping: every case makes parity odd. One answer collapses every error location into the same alarm. Detection is not location."
    },
    {
      section: "Counting information", title: "Why are three yes/no checks exactly enough?", minutes: 5, compact: true,
      body: `<div class="outcome-count">
          <div><span class="cyan">1 question</span><strong>2 outcomes</strong></div>
          <div><span class="blue">2 questions</span><strong>4 outcomes</strong></div>
          <div><span class="violet">3 questions</span><strong class="green">8 outcomes</strong></div>
        </div>
        <div class="big-rule" style="margin-top:56px"></div>
        <p class="big center bold">Three answers can name exactly: no error + seven positions.</p>
        <p class="body center muted">Could you invent eight different three-answer fingerprints?</p>`,
      notes: "Let students predict 8 before showing it. Each yes/no question doubles the distinguishable cases. Three is both sufficient and minimal for eight states—the first reason Hamming(7,4) needs three check bits."
    },
    {
      section: "Design challenge", title: "Can you invent seven unique error fingerprints?", minutes: 6, compact: true,
      body: `<p class="medium center bold">Give every state a different pattern of three answers.</p>
        <div class="fingerprints">${["no error","bit 1","bit 2","bit 3","bit 4","bit 5","bit 6","bit 7"].map((label,index)=>`<div><strong class="${index===0?"green":"muted"}">${label}</strong><span></span><span></span><span></span></div>`).join("")}</div>
        <p class="big center bold coral" style="margin-top:44px">Rule: no two columns may match.</p>
        <div class="bottom-center">${badge("PAIRS • 3 MINUTES • MANY DESIGNS WORK")}</div>`,
      notes: "Pairs invent eight distinct three-answer patterns on scrap paper or Worksheet 1C. Do not insist on binary order. Compare designs: all successful solutions use every possible pattern once. Ask which pattern naturally means no error."
    },
    {
      section: "A natural naming system", title: "Binary gives every state a three-answer name", minutes: 4,
      body: `${binaryStrip(["000","001","010","011","100","101","110","111"])}
        <p class="big center bold" style="margin-top:68px">Each position’s number is also its answer fingerprint.</p>
        <p class="body center muted">Read the answers as the 4s, 2s, and 1s digits.</p>`,
      notes: "Reveal binary as a naming convenience. Read 6 as 110: yes to the 4-question, yes to the 2-question, no to the 1-question. Students may instead add labels 4+2."
    },
    {
      section: "From addresses to check groups", title: "The names tell us what each question must cover", minutes: 5, compact: true,
      body: `${coverageMap(true)}
        <p class="body center bold" style="margin-top:30px">Question 1 uses the 1s digit; question 2 the 2s digit; question 4 the 4s digit.</p>`,
      notes: "Derive each row from the binary names. Position 5=101 belongs to questions 1 and 4. Position 7=111 belongs to all three. The overlapping sets are columns of an address system, not magic."
    },
    {
      section: "Human address game", title: "Three questions can locate someone you cannot see", minutes: 6, compact: true,
      body: `<div class="split tight" style="grid-template-columns:300px 1fr;margin-top:12px">
          <div><p class="body muted bold">Secret position</p><div class="secret-card">6</div></div>
          <div class="question-stack answer-stack"><p class="cyan">Question 1? <span class="green">NO</span></p><p class="blue">Question 2? <span class="coral">YES</span></p><p class="violet">Question 4? <span class="coral">YES</span></p></div>
        </div>
        <p class="big center bold" style="margin-top:20px">NO, YES, YES → 0 + 2 + 4 = 6</p>`,
      notes: "Play with seven volunteers or pairs choosing positions. Ask only the three fixed membership questions. Students experience the address pattern identifying a position before parity is introduced as the way to store those answers."
    },
    {
      section: "Store the expected answers", title: "Why parity makes the questions travel with the message", minutes: 4, compact: true,
      body: `<div class="split tight" style="margin-top:16px">
          <div><p class="medium bold cyan">Question 1 group</p><p class="big bold">positions 1, 3, 5, 7</p><p class="body">Choose its check bit so the group is <strong>EVEN</strong>.</p></div>
          <div><p class="medium bold coral">If one covered bit flips…</p><p class="display bold coral">EVEN → ODD</p><p class="body">That question’s answer changes from no to yes.</p></div>
        </div>
        <p class="big center bold" style="margin-top:55px">Every single flip toggles odd/even.</p>`,
      notes: "Why is parity a good stored answer? A single bit flip changes a count by exactly one, so it always toggles parity. Each group carries one durable yes/no answer; together they carry an address."
    },
    {
      section: "Build the seven-slot machine", title: "A self-checking message needs three adjustable bits", minutes: 3, compact: true,
      body: `${bitRow(["?","?","d₁","?","d₂","d₃","d₄"])}
        <p class="big center bold" style="margin-top:42px">Four slots hold the message. Three knobs force the parity promises to be true.</p>`,
      notes: "How many adjustable bits are needed to set three independent parity answers? The data bits are fixed by the message; the check bits are the three available knobs."
    },
    {
      section: "Independent knobs", title: "Why the check bits live at positions 1, 2, and 4", minutes: 4, compact: true,
      body: `<div class="power-grid"><div><strong class="cyan">1 = 001</strong><span>only question 1</span></div><div><strong class="blue">2 = 010</strong><span>only question 2</span></div><div><strong class="violet">4 = 100</strong><span>only question 4</span></div></div>
        <div class="big-rule" style="margin-top:54px"></div>
        <p class="big center bold">Each check bit changes only its own parity equation.</p>
        <p class="body center muted">That is why powers of two are the cleanest places for the knobs.</p>`,
      notes: "This is the crucial why behind positions 1,2,4. Their addresses contain exactly one 1, so each belongs to only one group. Adjusting p1 cannot disturb checks 2 or 4, and similarly for the others."
    },
    {
      section: "Restricted warm-up", title: "Can we practice with one data slot locked?", minutes: 2,
      body: `${bitRow(["p₁","p₂","d₁","p₄","d₂","d₃","0"], {fixed7:true})}
        <p class="medium center bold" style="margin-top:42px">Use data positions 3, 5, 6. Fix position 7 at zero.</p>
        <p class="small center muted italic">Practice inside the full machine—not a standard Hamming(7,3) code.</p>`,
      notes: "Locking one data slot reduces cognitive load without changing the check groups. Worksheet 2B uses this restricted subcode."
    },
    {
      section: "Encode 1 0 1", title: "Build the first self-checking word", minutes: 5,
      body: `${bitRow(["?","?","1","?","0","1","0"], {fixed7:true})}
        <p class="medium center bold" style="margin-top:38px">For each question: count the known 1s, then choose its knob to make the total even.</p>
        <div class="bottom-center">${badge("WHY CAN EACH KNOB BE SOLVED SEPARATELY?", "coral-bg")}</div>`,
      notes: "Pairs solve 101 with a hint ladder. Ask the displayed why: positions 1,2,4 each belong only to their own question. Expected p1=1, p2=0, p4=1. Worksheet 2B."
    },
    {
      section: "Warm-up reveal", title: "Every check is even because we chose it that way", minutes: 2, compact: true,
      body: `${bitRow(["1","0","1","1","0","1","0"], {fixed7:true})}
        <div class="three-checks"><p class="check-math cyan">Q1: 1+1+0+0=2</p><p class="check-math blue">Q2: 0+1+1+0=2</p><p class="check-math violet">Q4: 1+0+1+0=2</p></div>
        <p class="medium center bold green">The codeword carries three promises about itself.</p>`,
      notes: "Have three students audit one group each. Before error, the receiver expects fingerprint 000: three even totals."
    },
    {
      section: "A perfect packing", title: "Why seven protected bits carry at most four data bits", minutes: 5, compact: true,
      body: `<div class="packing-flow"><div><strong class="blue">2⁷ = 128</strong><span>possible received strings</span></div><b>÷</b><div><strong class="coral">8</strong><span>one clean word + seven one-flip versions</span></div><b>=</b><div><strong class="green">16</strong><span>protected messages</span></div></div>
        <div class="big-rule" style="margin-top:54px"></div>
        <p class="display center bold">16 messages = 2⁴ choices</p>
        <p class="body center muted">Hamming(7,4) fills the space exactly: no room is wasted.</p>`,
      notes: "Ask each count before revealing it. Every valid codeword owns eight possible received strings: itself and seven single-bit neighbors. 128/8=16 messages, exactly four data bits. This is the intuitive Hamming bound and why the code is perfect."
    },
    {
      section: "The full code", title: "Unlocking the final slot gives Hamming(7,4)", minutes: 2, compact: true,
      body: `${bitRow(["p₁","p₂","d₁","p₄","d₂","d₃","d₄"])}
        <p class="big center bold blue" style="margin-top:50px">3 address bits + 4 message bits = 7 transmitted bits</p>`,
      notes: "The notation should now feel earned: seven transmitted positions, four free message bits, and three check bits forced by the parity promises."
    },
    {
      section: "Derive the routine", title: "Can you reconstruct the encoder from its job?", minutes: 3,
      body: steps([["Name slots","Mark 1,2,4 as checks."],["Place data","Put data in 3,5,6,7."],["Keep promises","Choose checks for even groups."],["Audit","Expect the answer 000."]]),
      notes: "Ask students to propose the steps before revealing them. The routine should be reconstructed from the code’s purpose, not memorized as an arbitrary recipe. Worksheet 3A."
    },
    {
      section: "Use your design", title: "Pair challenge: encode 1 0 1 1", minutes: 6,
      body: `${bitRow(["?","?","1","?","0","1","1"])}
        <p class="medium center bold" style="margin-top:40px">Builder chooses the knobs. Auditor explains why each promise is true.</p>
        <div class="bottom-center">${badge("WORKSHEET 3B • DO NOT GUESS", "coral-bg")}</div>`,
      notes: "Pairs encode 1011 using the three questions. Expected p1=0, p2=1, p4=0. The auditor explains why each even total means expected fingerprint 000."
    },
    {
      section: "Encoding reveal", title: "Three checks prove the codeword is ready", minutes: 2,
      body: `${bitRow(["0","1","1","0","0","1","1"])}
        <div class="three-checks"><p class="medium center bold cyan">Q1 even</p><p class="medium center bold blue">Q2 even</p><p class="medium center bold violet">Q4 even</p></div>
        <p class="medium center bold green">Expected receiver fingerprint: 000</p>`,
      notes: "Verify each group. Locate the original data at positions 3,5,6,7. The all-pass fingerprint 000 is visibly built into the word."
    },
    {
      section: "Encoding sprint", title: "Test whether your method transfers", minutes: 5,
      body: `<div class="task-grid"><div class="task"><strong class="blue">0 0 0 0</strong><span>codeword: _______</span></div><div class="task"><strong class="blue">1 1 1 1</strong><span>codeword: _______</span></div><div class="task"><strong class="blue">0 1 0 1</strong><span>codeword: _______</span></div><div class="task"><strong class="coral">1 1 0 0</strong><span>codeword: _______</span></div></div>
        <p class="body center bold" style="margin-top:35px">If teammates disagree, audit the promises instead of voting.</p>`,
      notes: "Teams divide Worksheet 3C and cross-audit. Answers: 0000000; 1111111; 0100101; 0111100. The groups remain fixed while the message changes."
    },
    {
      section: "Break", title: "Pause the signal", minutes: 5, hideHeader: true, className: "dark break-slide",
      body: `<span class="eyebrow">PAUSE THE SIGNAL</span><div id="breakTimer" class="break-time" aria-live="polite">05:00</div><p class="medium bold">When you return: we use the same three questions to find a flip.</p><p class="body cyan">Stretch • water • keep your worksheet</p><div class="break-controls"><button id="startBreak" type="button">Start / pause</button><button id="resetBreak" type="button">Reset</button></div>`,
      notes: "Take a real five-minute break. Resume by asking: Why were three questions enough? Why were positions 1,2,4 special?"
    },
    {
      section: "Received word 0 1 1 0 0 0 1", title: "Which questions noticed the flip?", minutes: 4,
      body: `${bitRow(["0","1","1","0","0","0","1"], {corrupt:6})}
        <p class="big center bold" style="margin-top:42px">Do not hunt by eye. Ask the same three parity questions.</p>
        <div class="bottom-center">${badge("Q1?   Q2?   Q4?")}</div>`,
      notes: "Students run the checks on Worksheet 4A. Q1 passes; Q2 and Q4 fail. Ask why a flipped bit changes exactly the questions that contain its position."
    },
    {
      section: "The syndrome", title: "Why the failed questions spell the error address", minutes: 5, compact: true,
      body: `<div class="syndrome-grid"><div><h3 class="cyan">Q1</h3><strong class="green">PASS → 0</strong></div><div><h3 class="blue">Q2</h3><strong class="coral">FAIL → 2</strong></div><div><h3 class="violet">Q4</h3><strong class="coral">FAIL → 4</strong></div></div>
        <div class="big-rule" style="margin-top:40px"></div><p class="equation">110₂ = 4 + 2 = 6</p><p class="medium center bold">The error reproduces the fingerprint of its position.</p>`,
      notes: "Position 6 belongs to Q2 and Q4, so a flip there makes exactly those questions fail. The pattern 110 is the binary name of 6. Adding failed labels is another way to read the same address."
    },
    {
      section: "Correction is the inverse", title: "Why one flip repairs the word", minutes: 3,
      body: `<div class="repair-flow"><strong class="coral">flip at 6</strong><b>→</b><strong class="blue">syndrome 6</strong><b>→</b><strong class="green">flip 6 back</strong></div>
        <div class="big-rule" style="margin-top:66px"></div><p class="big center bold">The second flip toggles the same checks back to even.</p><p class="body center muted">Repair first. Then read positions 3, 5, 6, 7.</p>`,
      notes: "A binary flip is its own inverse. Ask why flipping the addressed bit works without guessing its value. Then emphasize repair before extraction."
    },
    {
      section: "Repair race", title: "Two packets, same logic", minutes: 6,
      body: `<div class="split tight" style="margin-top:18px"><div><p class="big bold blue">Packet A</p><p class="display bold">0 1 0 1 1 0 1</p><p class="body muted">Which questions fail?</p><div class="big-rule"></div></div><div><p class="big bold coral">Packet B</p><p class="display bold">0 1 1 1 1 0 1</p><p class="body muted">Which questions fail?</p><div class="big-rule"></div></div></div><p class="medium center bold" style="margin-top:46px">Explain why the fingerprint identifies the bit.</p>`,
      notes: "Packet A: Q4 only → position 4 → corrected 0100101 → message 0101. Packet B: all fail → position 7 → corrected 0111100 → message 1100. Require the causal explanation."
    },
    {
      section: "Create • corrupt • explain", title: "Invent a codeword your partner can rescue", minutes: 6, compact: true,
      body: `${steps([["Choose","Invent four data bits."],["Encode","Build three parity promises."],["Flip","Corrupt one secret position."],["Explain","Partner repairs and justifies."]])}<p class="body center bold green" style="margin-top:34px">Success means the sender’s message returns for the right reason.</p>`,
      notes: "Use Worksheet 5. Receivers must say which questions failed and why those answers name the sender’s secret position."
    },
    {
      section: "The boundary—and the eighth bit", title: "Why two errors can impersonate a third", minutes: 3, compact: true,
      body: `<div class="repair-flow"><strong class="coral">errors at 2 and 4</strong><b>→</b><strong>010 ⊕ 100</strong><b>→</b><strong class="blue">syndrome 6</strong></div>
        <div class="big-rule" style="margin-top:50px"></div><div class="split tight"><p class="medium center bold coral">Hamming(7,4) may wrongly flip bit 6.</p><p class="medium center bold green">An eighth overall parity bit separates odd flips from even flips.</p></div><p class="body center muted" style="margin-top:34px">That is the intuition behind extended Hamming(8,4).</p>`,
      notes: "Two error fingerprints XOR into another valid address. The optional eighth overall parity bit reveals whether the number of flips is odd or even, enabling double-error detection."
    },
    {
      section: "Solo certification", title: "Can you do the whole job alone?", minutes: 5,
      body: `<div class="split tight" style="margin-top:18px"><div><p class="medium bold blue">Part A</p><p class="big bold">Encode 1 0 0 1</p><p class="body muted">Explain why all checks pass.</p></div><div><p class="medium bold coral">Part B</p><p class="big bold">Repair 0 0 1 1 1 0 1</p><p class="body muted">Explain why the syndrome names the error.</p></div></div><div class="big-rule" style="margin-top:48px"></div><p class="medium center bold">roles → parity promises → address → repair → extract</p><div class="bottom-center">${badge("WORKSHEET 6A • 5 MINUTES", "green-bg")}</div>`,
      notes: "Students work independently. Part A: 0011001. Part B: Q1 and Q4 fail → position 5 → corrected 0011001 → message 1001. Score the explanation as well as the result."
    },
    {
      section: "Close", title: "Signal restored", minutes: 1, hideHeader: true, className: "closing",
      body: `<span class="eyebrow">SIGNAL RESTORED</span><h1>You did not memorize Hamming(7,4). You derived it.</h1><div class="concept-row curiosity-row"><span class="cyan">8 states</span><span class="blue">3 questions</span><span class="violet">binary address</span><span class="coral">parity promises</span></div><div class="big-rule" style="margin-top:28px"></div><p class="body center bold green">Check: Part A 0011001 • Part B error at 5 → message 1001</p><p class="medium center bold" style="margin-top:30px">Which design choice now feels inevitable?</p>`,
      notes: "Students name one why they can explain: three checks, the overlap sets, positions 1/2/4, or the syndrome. The message points to damage because its three parity promises form an address.\n\nSource: R. W. Hamming, ‘Error Detecting and Error Correcting Codes,’ Bell System Technical Journal 29(2), 1950. https://doi.org/10.1002/j.1538-7305.1950.tb00463.x"
    }
  ];

  window.SIGNAL_RESCUE = { slides };
})();
