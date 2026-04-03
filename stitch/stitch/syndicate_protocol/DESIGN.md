# Design System Specification: The Command Protocol

## 1. Overview & Creative North Star
**Creative North Star: "The Sovereign Terminal"**

This design system is a rejection of the "soft and friendly" SaaS aesthetic. It is a high-fidelity, editorial interpretation of a command-line interface, designed for high-stakes Web3 operations. It prioritizes information density, technical authority, and "Aggressive Precision." 

We break the standard dashboard template by utilizing a rigid, 0px border-radius architecture paired with organic glowing states. The layout feels less like a website and more like a tactical HUD. By using intentional asymmetry—such as technical metadata offsets and varying vertical rhythms—we move away from generic grids into a space that feels engineered and bespoke.

---

## 2. Colors & Surface Architecture
The palette is rooted in absolute blacks and high-frequency neon accents, mimicking the phosphor glow of vintage glass terminals but refined with modern depth.

### The Color Tokens
- **Surface (Base):** `#0e0e0e` (Deepest Void)
- **Primary (Success):** `#a4ffb9` (Electric Mint)
- **Secondary (Action):** `#00a9fd` (Data Blue)
- **Tertiary (Warning):** `#ffbd5e` (Warning Amber)
- **Error:** `#ff716c` (Critical Red)

### The "No-Line" Rule
Traditional 1px solid dividers are strictly prohibited for sectioning. Structural separation must be achieved through **Tonal Shifting**.
- Use `surface_container_low` (`#131313`) for large layout sections.
- Use `surface_container` (`#1a1919`) or `surface_container_high` (`#201f1f`) for interactive nested elements.
- Boundaries are felt, not seen, through the subtle shift in dark values.

### Surface Hierarchy & Nesting
Treat the UI as a series of recessed or extruded modules. 
- **The Base:** `surface` (`#0e0e0e`) houses the background scanline textures.
- **The Deck:** `surface_container_lowest` (`#000000`) for the fixed 240px sidebar to create a "black hole" depth effect.
- **The Modules:** `surface_variant` (`#262626`) for focused data sets.

### Signature Textures
- **Scanline Overlay:** Apply a global fixed-position SVG pattern of 1px horizontal lines at 3% opacity.
- **The Pulse:** Main CTAs should not use flat fills. Use a subtle linear gradient from `primary` to `primary_container` to simulate a glowing cathode ray tube.

---

## 3. Typography: The Dual-Engine Logic
We employ a high-contrast typographic strategy: **Inter** for structural authority and **Space Grotesk/Monospace** for tactical data.

- **Display & Headlines (Inter):** Used for titles and high-level navigation. These should feel "sharp" and "industrial." 
    - *Headline-LG:* 2rem, tight letter-spacing (-0.02em).
- **Tactical Data (Space Grotesk):** All values, wallet addresses, and status updates must use the Monospace-leaning Space Grotesk.
    - *Body-MD:* 0.875rem. This is the workhorse for data density.
- **Labels (Space Grotesk):** All-caps, 0.75rem, with +0.1em letter spacing. Labels should feel like markings on hardware.

---

## 4. Elevation & Depth: Tonal Layering
In a world of 0px border-radii, depth is communicated through light emission rather than physical shadows.

- **The Layering Principle:** To "lift" a card, do not add a shadow. Instead, shift the background from `surface_container_low` to `surface_container_highest`. 
- **Glow States (Active):** When an element is active or hovered, it emits light. Use a `0px 0px 12px` spread of the `primary` color at 30% opacity. 
- **The "Ghost Border" Fallback:** If containment is functionally required (e.g., input fields), use `outline_variant` at 20% opacity. Never use 100% opaque borders.
- **Glassmorphism:** For floating modals, use `surface_container` with a `backdrop-blur` of 20px and 80% opacity. This creates a "frosted obsidian" look.

---

## 5. Components

### Buttons
- **Primary:** `primary` background, `on_primary` text. 0px border-radius. On hover: CSS filter `brightness(1.2)` and a primary-colored outer glow.
- **Secondary:** `outline` ghost border (20% opacity). On hover: Fill with `surface_bright`.
- **Tertiary:** Text-only, Monospace, all-caps. Prefix with a chevron `>` to indicate interactivity.

### Tactical Inputs
- **Text Fields:** `surface_container_lowest` background. Bottom-only border (1px) using `outline_variant`. Focus state: Border color shifts to `primary` with a 2px glow.
- **Status Chips:** No background. Use a `primary` or `error` dot (4px) next to Monospace text. High density, low visual noise.

### Cards & Lists
- **The Divider Ban:** Strictly no horizontal lines between list items. Use 8px or 12px of vertical `surface_container` padding to define rows. 
- **The "Active" Module:** An active list item should have a 2px vertical "power rail" on its far-left edge in `primary` green.

### Additional Components: The "Ticker"
- A scrolling horizontal marquee at the top or bottom of the viewport using `label-sm` to display real-time gas prices or block heights. This reinforces the "Terminal" identity.

---

## 6. Do's and Don'ts

### Do
- **DO** use 0px border-radius for everything. Sharp corners are non-negotiable.
- **DO** embrace extreme "Dark Mode" (keep the average screen luminance low).
- **DO** align data points to a strict vertical axis to mimic code structures.
- **DO** use uppercase for all labels and metadata.

### Don't
- **DON'T** use soft shadows or rounded corners (this destroys the "Sovereign" look).
- **DON'T** use generic icon libraries; use sharp, thin-stroke (1px) technical icons.
- **DON'T** use 1px solid borders to separate layout sections. Use background color steps.
- **DON'T** use gradients on white or light surfaces; color is only for light emission and data status.