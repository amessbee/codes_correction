# GLITCH! — Error-Correcting Codes Math Circle

**GLITCH!** is a projector-ready, interactive mathematics-circle lesson about
how information survives noise. Students begin with a parity card trick, build
their own error-detection ideas, discover Hamming distance and Hamming(7,4),
and finish with applications and extensions to repetition, Golay, and
Reed–Solomon codes.

The main lesson is designed for a roughly 90-minute session with students in
grades 6–10. It assumes no prior coding-theory or binary-arithmetic knowledge.

## Published site

- [Course overview and resources](https://amessbee.github.io/codes_correction/)
- [Launch the interactive GLITCH! slides](https://amessbee.github.io/codes_correction/slides.html)
- [Mudassir Shabbir’s homepage](https://amessbee.github.io/)

The course overview contains the slide deck, printable worksheets, an
instructor introduction, and links to foundational papers and accessible
real-world examples.

## Printable worksheets

Each worksheet includes both approachable questions and more demanding
extensions. The original codebook of 16 messages and their four-bit codes is
included for reference.

1. [Codebook and Binary](https://amessbee.github.io/codes_correction/output/pdf/worksheet-1-codebook-and-binary.pdf)
2. [Detection and Repetition](https://amessbee.github.io/codes_correction/output/pdf/worksheet-2-detection-and-repetition.pdf)
3. [Hamming Repair](https://amessbee.github.io/codes_correction/output/pdf/worksheet-3-hamming-repair.pdf)
4. [Limits and Noise](https://amessbee.github.io/codes_correction/output/pdf/worksheet-4-limits-and-noise.pdf)

## Lesson arc

- Perform the parity card trick and ask students to infer the hidden rule.
- Build a 16-message, four-bit codebook.
- Introduce a one-bit glitch and let students propose protection strategies.
- Compare watchdog parity with repetition and majority voting.
- Use Hamming distance and sphere packing to show why five and six bits fail.
- Discover suitable parity positions and construct Hamming(7,4).
- Diagnose and repair damaged messages using a syndrome.
- Stress-test encoded webpages and longer text with adjustable noise.
- Meet repetition codes, the `[23,12,7]` Golay code, and Reed–Solomon codes.

Several optional slides are hidden by default. Use **Include hidden slides** in
the presentation toolbar when you want the extended route.

## Presenting the deck

The control bar starts hidden so the projected slide remains uncluttered. Move
the pointer to the bottom edge, or focus that edge with the keyboard, to reveal
the controls.

Useful shortcuts:

- `→`, `Space`, or `Page Down`: next slide or reveal
- `←` or `Page Up`: previous slide
- `Home` / `End`: first / last visible slide
- `O`: slide overview
- `F`: fullscreen
- `N`: facilitator notes
- `D`: display controls
- `T`: colour theme
- `V`: slide transition
- `W`: blank teaching canvas
- `P`, `H`, `B`: pen, highlighter, and blackout tools
- `?`: keyboard help

The toolbar also supports slide hiding, inclusion of hidden slides, printable
slide export, a class timer, annotations, and a light projector theme. Touch
screens can navigate with horizontal swipes.

## Run locally

This is a dependency-free static site. From the repository directory, run:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open:

- `http://127.0.0.1:8000/` for the course overview
- `http://127.0.0.1:8000/slides.html` for the GLITCH! deck

Opening the files directly also works, but a local server gives more consistent
browser behavior for the interactive text experiments.

## Repository map

- `index.html` and `landing.css` — public course overview
- `slides.html` — GLITCH! slide content and facilitator notes
- `styles.css` and `nila-slides.css` — presentation layout and visuals
- `app.js`, `nila-slides.js`, and `hamming-text-game.js` — activities and simulations
- `deck-controls.js`, `deck-controls.css`, and `deck-themes.css` — presentation tools
- `output/pdf/` — printable worksheet PDFs
- `war-and-peace.txt` and `war-and-peace-data.js` — openly available long-text experiment
- `carnival.html` — probability and expected-value math circle
- `monster-party.html` — graph-colouring and scheduling math circle

## Additional interactive math circles

- [The Totally Honest Carnival](https://amessbee.github.io/codes_correction/carnival.html) — probability, expected value, fairness, and game design
- [Monster Party: The Seating Chart from Hell](https://amessbee.github.io/codes_correction/monster-party.html) — constraints, networks, graph colouring, and scheduling

## Instructor

Created by **Dr. Mudassir Shabbir**, Associate Professor in the Department of
Computer Science at the Lahore University of Management Sciences (LUMS).
