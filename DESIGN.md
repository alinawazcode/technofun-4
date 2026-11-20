# TechnoFun 4.0 ID Badge Generator — Design Specification

This document records the exact pixel measurements, color palette, typography, and layout geometry sampled directly from `reference/badge-reference.png` (1024 × 1536 px) using automated pixel-analysis scripts.

---

## 1. Color Palette

All colors were sampled directly from the pixel buffer of `reference/badge-reference.png`:

### Backgrounds & Glass Surface
- **Canvas Outer Background:** `#0A0A0D` / `rgb(10, 10, 13)`
- **Outer Drop Shadow:** `rgba(0, 0, 0, 0.65)` with 28 px blur, 8 px vertical offset
- **Card Body Gradient:**
  - Top (y=120): `#0D0C14`
  - Center (y=650): `#060608`
  - Bottom (y=1445): `#030305`
- **Glass Edge Stroke (Card Border):**
  - Linear gradient from top-left `rgba(165, 155, 235, 0.45)` down to `rgba(90, 80, 160, 0.22)`
  - Stroke width: 2.0 px

### Violets & Accents
- **Primary Electric Violet:** `#6D4AFF` / `rgb(109, 74, 255)`
- **Violet Glow / Highlights:** `#9D7BFF` / `rgb(157, 123, 255)`
- **Deep Violet / Shadow:** `#3B1E8C` / `rgb(59, 30, 140)`
- **Flanking Accent Lines (Bottom):** `#7954F0` / `rgb(121, 84, 240)`
- **Field Bar Borders:** `#5E3DDB` / `rgb(94, 61, 219)`
- **Field Bar Labels:** `#9E7BFF` / `rgb(158, 123, 255)`
- **Wordmark Sparkle & Arc:** `#D0B8FF` / `rgb(208, 184, 255)`

### Greys & Whites
- **Primary Text White:** `#FFFFFF`
- **Subtle White / Icons:** `#E2E2E6` / `rgb(226, 226, 230)`
- **Silver Divider (Name Bar):** `#C8C8D0` / `rgb(200, 200, 208)`
- **Top-Right Tagline Metallic Grey:** `#7A7A85` / `rgb(122, 122, 133)`
- **Footer Text Grey:** `#6E6E75` / `rgb(110, 110, 117)`
- **Watermark Dark Grey:** `#1C1C20` / `rgb(28, 28, 32)`
- **Placeholder Background:** `#B8B8BA` / `rgb(184, 184, 186)`
- **Placeholder Silhouette:** `#424245` / `rgb(66, 66, 69)`

---

## 2. Typography

Google Fonts mapped to reference elements:

| Element | Google Font | Weight & Style | Size | Tracking / Spacing | Color |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wordmark "Techno"** | Poppins | 800 Italic (ExtraBold) | 54 px | 0 | White-to-Silver gradient (`#FFF` → `#B8B8C0`) |
| **Wordmark "Fun"** | Poppins | 800 Italic (ExtraBold) | 54 px | 0 | Violet gradient (`#9D75FF` → `#5F35FF`) |
| **Wordmark "4.0"** | Poppins | 700 Italic (Bold) | 26 px | 0 | `#FFFFFF` |
| **Subtitle "Innovate • Compete • Celebrate"** | Poppins / Inter | 500 Regular | 15 px | 2.0 px | `#E0E0E6` (Dots `#7E57FF`) |
| **Top-Right "BIGGER / BOLDER / SMARTER"** | Poppins | 800 Italic (ExtraBold) | 24 px | 1.0 px | `#7A7A85` |
| **Watermark "TEAM" / "NAME"** | Anton | 400 Regular (Display condensed) | ~180 px | 0 | `#1C1C20` |
| **Name Bar Value ("Your Name Here")** | Poppins | 700 Bold | 48 px | -0.5 px | `#FFFFFF` |
| **Team Bar Label ("Team:")** | Poppins | 600 SemiBold | 16 px | 0.5 px | `#9E7BFF` |
| **Team Bar Value ("Your Team Name")** | Poppins | 600 SemiBold | 30 px | 0 | `#FFFFFF` |
| **Role Bar Label ("Role:" / "Event:" / "Segment:")** | Poppins | 600 SemiBold | 16 px | 0.5 px | `#9E7BFF` |
| **Role Bar Value ("Your Role Here")** | Poppins | 600 SemiBold | 30 px | 0 | `#FFFFFF` |
| **Badge Type ("VOLUNTEER")** | Poppins | 300 Light | 56 px | 22 px | `#E2E2E6` |
| **Footer "TechnoFun 4.0"** | Poppins | 500 Medium | 18 px | 3.5 px | `#6E6E75` |

---

## 3. Element Measurements & Coordinate Space (1024 × 1536)

All positions are defined in logical coordinates:

### Card Geometry
- **X Range:** 70 to 953 px (Width: 883 px, centered at `x = 511.5`)
- **Y Range:** 120 to 1445 px (Height: 1325 px)
- **Corner Radius:** 48 px
- **Border:** 2 px stroke

### Lanyard & Clip
- **Lanyard Strap:**
  - `x`: 418 to 606 (Width: 188 px, centered at 512)
  - `y`: 0 to 140 px
  - Texture: subtle vertical woven fiber pattern
- **Metal Clip:**
  - `x`: 396 to 628 (Width: 232 px, centered at 512)
  - `y`: 128 to 217 (Height: 89 px)
  - Corner radius: 16 px
  - Brushed silver metallic gradient (`#8A8A92` to `#2A2A30`) with an inner slot at `x = 512, y = 168` (size 110 × 26 px, radius 12 px)
  - Asset fallback: `assets/badge-lanyard.png` placed at `x = 380, y = 0` (size 265 × 230 px)

### Top-Left Wordmark & Details
- **Wordmark Position:** baseline at `y = 245`, starting at `x = 104`
- **Orbit Arc:** quadratic curve from `(110, 220)` peaking at `y = 165` and ending at `(235, 165)`
- **Sparkle Star:** 4-point star centered at `(235, 165)`, radius 8 px (`#D0B8FF`)
- **Subtitle Line:** baseline at `y = 334`, starting at `x = 104`

### Top-Right Tagline
- **Vertical Violet Line:** `x = 692`, `y = 162` to `258` (width 4 px, rounded caps, `#6E48FF`)
- **3 Tagline Lines:** left-aligned at `x = 712`
  - "BIGGER" baseline: `y = 188`
  - "BOLDER" baseline: `y = 219`
  - "SMARTER" baseline: `y = 250`

### Watermark ("TEAM" / "NAME")
- Split around the hexagon:
  - **Left Side:** bounded in `x = 80..338`, `y = 541..729` (Right-aligned against hexagon)
  - **Right Side:** bounded in `x = 686..942`, `y = 540..729` (Left-aligned against hexagon)
  - Size auto-fitted so both sides match font size

### Hexagon Photo Frame
- **Center:** `(512, 650)`
- **Width:** 350 px (`x = 337` to `687`)
- **Height:** 360 px (`y = 470` to `830`)
- **6 Vertices:**
  1. Top: `(512, 470)`
  2. Top-Right: `(687, 565)`
  3. Bottom-Right: `(687, 735)`
  4. Bottom: `(512, 830)`
  5. Bottom-Left: `(337, 735)`
  6. Top-Left: `(337, 565)`
- **Borders:**
  - Outer border: 4 px, `#6D4AFF`
  - Gap: 4 px
  - Inner border: 2 px, `#8B6BF9`
  - Edge bevel highlights on upper-left (`(337,565)` to `(512,470)`) and lower-right (`(687,735)` to `(512,830)`)
- **Placeholder Silhouette:**
  - Background fill: `#B8B8BA`
  - Head: Circle centered at `(512, 582)`, radius 38 px, `#424245`
  - Torso: Arc / trapezoid expanding from neck down to `y = 730`, `#424245`

### Three Field Bars
Pointed hexagonal ends with cut depth ~26 px:
1. **Name Bar:**
   - `x`: 130 to 893 (Width: 763 px), `y`: 881 to 1001 (Height: 120 px)
   - Left point: `(130, 941)`, Right point: `(893, 941)`
   - Border: 1.5 px `#6E4BFF`
   - Icon: Person icon centered at `x = 185, y = 941`
   - Divider: Vertical white line at `x = 240`, `y = 898` to `984`
   - Value: "Your Name Here" at `x = 265`, baseline `y = 958`, 48 px Poppins Bold

2. **Team Bar:**
   - `x`: 178 to 845 (Width: 667 px), `y`: 1035 to 1131 (Height: 96 px)
   - Left point: `(178, 1083)`, Right point: `(845, 1083)`
   - Border: 1.5 px `#5E3DDB`
   - Icon: People (group of 3) centered at `x = 230, y = 1083`
   - Divider: Vertical violet line at `x = 268`, `y = 1048` to `1118`
   - Label: "Team:" at `x = 292`, baseline `y = 1068`, 16 px Poppins SemiBold
   - Value: "Your Team Name" at `x = 292`, baseline `y = 1106`, 30 px Poppins SemiBold

3. **Role Bar:**
   - `x`: 178 to 845 (Width: 667 px), `y`: 1150 to 1245 (Height: 95 px)
   - Left point: `(178, 1198)`, Right point: `(845, 1198)`
   - Border: 1.5 px `#5E3DDB`
   - Icon: Briefcase centered at `x = 230, y = 1198`
   - Divider: Vertical violet line at `x = 268`, `y = 1162` to `1232`
   - Label: "Role:" (or "Event:" / "Segment:") at `x = 292`, baseline `y = 1182`, 16 px Poppins SemiBold
   - Value: "Your Role Here" at `x = 292`, baseline `y = 1220`, 30 px Poppins SemiBold

*(Note: When Team Name is empty, Team Bar is hidden and Role Bar shifts up to `y = 1035` to `1130`)*

### Bottom Section
- **Type Label:** "VOLUNTEER" (or "PARTICIPANT" / "COORDINATOR")
  - Centered at `x = 512`, baseline `y = 1342`
  - Font: Poppins Light 300, 56 px, letter-spacing 22 px, color `#E2E2E6`
- **Flanking Accent Lines:**
  - Left: `x = 178` to `270`, `y = 1332`, height 2 px, color `#7954F0`
  - Right: `x = 754` to `846`, `y = 1332`, height 2 px, color `#7954F0`
- **Bottom Footer Text:**
  - "TechnoFun 4.0" centered at `x = 512`, baseline `y = 1386`, 18 px Poppins Medium, color `#6E6E75`

