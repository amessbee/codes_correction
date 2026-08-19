# GLITCH! Math Circle deck

An interactive, dependency-free web presentation for a 90-minute grades 6–10 math circle on parity, redundancy, Hamming distance, and error-correcting codes.

## Run it

Open `index.html` in a browser, or serve the directory locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Presenting

- `→`, `Space`, or `Page Down`: next slide
- `←` or `Page Up`: previous slide
- `Home` / `End`: first / last slide
- `F`: fullscreen
- `N`: facilitator notes
- `D`: display controls
- `C`: flip between dark and light projector colors
- Touch screens: swipe horizontally

The display panel includes a **Fewer / Current / More** figure slider. “Current” is the default and preserves the original visual density; “More” reveals additional story figures, while “Fewer” removes nonessential decoration. The projector toggle switches the whole deck to a high-contrast light theme, and Reset restores the original design.

Buttons inside the slides run the live card trick, activity timers, alien repair, two-error experiment, codebook stress tests, Hamming-distance comparison, nearest-code decoder, robot alarm designer, and QR damage demo.

The deck intentionally delays the terms “parity” and “Hamming distance” until after students have had a chance to invent the ideas.

## Files

- `index.html` — slide content and facilitator notes
- `styles.css` — responsive presentation design
- `app.js` — navigation and activity logic
- `glitch-qr.svg` — high-error-correction QR finale

The QR asset was generated with QuickChart at error-correction level H. It encodes: “CONGRATULATIONS. HUMANITY HAS SURVIVED THE GLITCH!”
