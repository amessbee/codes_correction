# Interactive Math Circle decks

Three interactive, dependency-free web presentations for 90-minute grades 6–10 math circles. They are designed for a projector, audience participation, and more visuals than words.

## Published URL

- https://amessbee.github.io/codes_correction/ (GLITCH!)
- https://amessbee.github.io/codes_correction/carnival.html
- https://amessbee.github.io/codes_correction/monster-party.html
- Author: [amessbee.github.io](https://amessbee.github.io/)

## Choose a circle

- `index.html` — **GLITCH!**: parity, redundancy, Hamming distance, and error-correcting codes
- `carnival.html` — **The Totally Honest Carnival**: probability, expected value, fairness, and game design
- `monster-party.html` — **Monster Party: The Seating Chart from Hell**: constraints, networks, graph coloring, and scheduling

## Run it

Open `index.html` in a browser, or serve the directory locally:

```bash
python3 -m http.server 8000
```

Then visit:

- `http://localhost:8000/` for GLITCH!
- `http://localhost:8000/carnival.html` for the carnival
- `http://localhost:8000/monster-party.html` for the monster banquet

## Presenting

- `→`, `Space`, or `Page Down`: next slide
- `←` or `Page Up`: previous slide
- `Home` / `End`: first / last slide
- `F`: fullscreen
- `N`: facilitator notes
- `D`: display controls
- `C`: flip between dark and light projector colors
- Touch screens: swipe horizontally

The projector toggle switches each deck between its original palette and a high-contrast light theme. Every deck also includes **Fewer / Current / More** figure controls. “Current” is the default and preserves the designed visual density.

Buttons inside the slides run live games, activity timers, simulations, manipulatives, reveals, and challenge checks. Each slide also has facilitator notes under `N`.

The deck intentionally delays the terms “parity” and “Hamming distance” until after students have had a chance to invent the ideas.

## Main files

- `index.html` — slide content and facilitator notes
- `styles.css` — responsive presentation design
- `app.js` — navigation and activity logic
- `glitch-qr.svg` — high-error-correction QR finale
- `carnival.html` / `carnival.js` — probability carnival deck and activities
- `monster-party.html` / `monster-party.js` — graph-coloring party deck and activities
- `circle-templates.css` / `circle-deck.js` — shared styling and controls for the two new circles

The QR asset was generated with QuickChart at error-correction level H. It encodes: “CONGRATULATIONS. HUMANITY HAS SURVIVED THE GLITCH!”
