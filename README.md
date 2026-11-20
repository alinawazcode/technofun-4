# TechnoFun 4.0 — ID Badge Generator

A client-side ID badge generator for **TechnoFun 4.0** (The Shaikh Ayaz University, Shikarpur). Renders an official ID badge on HTML `<canvas>` at 1024 × 1536 logical resolution and exports up to Ultra HD (3072 × 4608 px, 3×).

Designed to match the reference badge (`reference/badge-reference.png`) with strict geometric and color accuracy.

---

## Features

- **Pixel-Accurate Canvas Engine:** All elements—card glass edges, wordmark with orbit arc & sparkle star, vertical tagline, split watermark, pointed hexagonal field bars, vector icons, double-bordered photo frame, and bottom badge labels—are drawn in code without using background template images.
- **Reference & Debug Modes:**
  - `?ref=1`: Populates reference badge data, grey placeholder silhouette, and opens the side-by-side / overlay split / pixel diff analysis tool.
  - `?debug=1`: Draws labeled bounding boxes for layout verification.
- **Three Badge Types:** Segmented control for Participant (shows "Event:"), Volunteer (shows "Segment:"), and Coordinator (shows "Role:"). Sets the bottom label ("PARTICIPANT", "VOLUNTEER", "COORDINATOR").
- **Dynamic Field Bars:**
  - Name Bar: Auto-scales text size to fit names up to 40 characters without overflow.
  - Team Bar: Optional. If empty, the Team bar is hidden and the Role bar shifts up smoothly to close the gap.
  - Watermark: Team name is split around the center hexagon (first word left, remaining words right; single words split down the center; defaults to "TECHNO" / "FUN" if empty).
- **Interactive Photo Editor:**
  - Drag-and-drop & file picker.
  - EXIF orientation auto-corrected via `createImageBitmap(file, { imageOrientation: "from-image" })`.
  - Zoom from 100% to 500% with slider, +/- buttons, mouse wheel, and two-finger pinch.
  - Pan via canvas drag, nudge arrows, arrow keys, and move sliders.
  - **Zero-gap clamping:** Strict mathematical clamping guarantees the photo always 100% covers the hexagon at any zoom or pan.
  - **Privacy:** 100% client-side. Photos never leave the browser.
- **Multi-Resolution HD Export:**
  - Standard 1× (1024 × 1536 px)
  - HD 2× (2048 × 3072 px)
  - Ultra HD 3× (3072 × 4608 px) with automatic fallback to 2× / 1× on memory-constrained mobile devices.
  - "Card only" option for printing (no lanyard, transparent background).
  - Social caption generator with one-click copy and Web Share API integration.

---

## Project Structure

```
technofun-4/
├── index.html              # Main HTML markup (semantic, mobile-first)
├── style.css               # Dark theme, responsive grid, accessible styles
├── app.js                  # Canvas renderer, state manager, export pipeline
├── DESIGN.md               # Measured palette, typography, and coordinate specs
├── assets/
│   ├── badge-lanyard.png   # High-resolution lanyard & metal clip asset
│   └── university-logo.png # Transparent university seal (optional)
├── reference/
│   └── badge-reference.png # Original 1024 × 1536 design reference
├── tools/                  # Measurement scripts, crop tools, test suite
├── .gitignore              # Ignores node_modules, temp logs, crops
├── .vercelignore           # Excludes reference/ and dev tools from deployment
└── README.md               # Documentation & deployment guide
```

---

## How to Run Locally

Because this is a static site with vanilla HTML/CSS/JS, no build step or package installation is required:

### Option 1: Any Local HTTP Server
```bash
# Python 3
python -m http.server 3000

# or Node npx serve
npx serve .
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tuning the Layout

### Reference Mode (`?ref=1`)
Open `http://localhost:3000/?ref=1` or click the **Reference Mode** button in the header.
- Automatically fills reference placeholder text ("Your Name Here", "Your Team Name", "Your Role Here", "VOLUNTEER").
- Displays the **Reference Comparison & Overlay Diff** panel:
  - **Side-by-Side:** Live comparison of generated badge vs `reference/badge-reference.png`.
  - **Overlay Slider:** Interactive split slider to slide between reference and code.
  - **Pixel Diff:** Real-time diff canvas highlighting deviations with statistics.

### Debug Mode (`?debug=1`)
Open `http://localhost:3000/?debug=1` or click the **Debug Boxes** button in the header.
- Renders neon green, magenta, cyan, and yellow bounding boxes around every card region.

---

## Configuration (`CONFIG` Guide)

Located at the very top of `app.js`:

```javascript
const CONFIG = {
  eventName: "TechnoFun 4.0",
  date: "25 Nov 2026",
  venue: "The Shaikh Ayaz University, Shikarpur",
  hashtags: ["#TechnoFun4", "#InnovateCompeteCelebrate", "#SAUShikarpur"], // TODO: Confirm
  events: [
    "Programming Competition",
    "Quiz Competition",
    "Gaming",
    "Exhibition"
  ],
  segments: [
    "Registration & Help Desk", // TODO: Confirm segment list
    "Stage & Media",
    "Technical Support",
    "Discipline & Logistics",
    "Guest Relations"
  ],
  coordinatorDefault: "Organizing Team",
  exportScales: [
    { label: "Ultra HD (3×)", scale: 3, width: 3072, height: 4608 },
    { label: "HD (2×)", scale: 2, width: 2048, height: 3072 },
    { label: "Standard (1×)", scale: 1, width: 1024, height: 1536 }
  ],
  showUniversitySeal: false, // Set to true to draw transparent seal at card bottom
  universitySealPath: "assets/university-logo.png",
  lanyardAssetPath: "assets/badge-lanyard.png",
  sheetWebhook: "", // Optional webhook URL to log badge generation
  ...
};
```

---

## Deploy to Vercel

The site is pure static HTML/CSS/JS with zero build dependencies.

### Via Vercel CLI
```bash
# In the project directory:
vercel
```
When prompted:
- **Set up and deploy?** [Y]
- **Which scope?** (Select your account)
- **Link to existing project?** [N]
- **What’s your project’s name?** `technofun-4`
- **In which directory is your code located?** `./`
- **Framework Preset:** `Other` (or None)
- **Build Command:** (leave empty)
- **Output Directory:** (leave empty)

### Via Git (GitHub / GitLab / Bitbucket)
1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), click **Import Project** and select the repository.
3. Keep the **Framework Preset** as **Other**.
4. Click **Deploy**.

