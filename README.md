# ARC Raiders Companion

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8)](https://tailwindcss.com/)
[![Zod Validated](https://img.shields.io/badge/Zod-Validated-3068b7)](https://zod.dev/)
[![Vitest](https://img.shields.io/badge/Tests-29%20Passed-brightgreen)](https://vitest.dev/)

[**🌐 Open Web App (Live Companion)**](https://flickzman.github.io/arc-raiders-companion/)  
*No terminal or installation needed — open directly on your second monitor, phone, or tablet.*

---

> **Tactical Companion & Raid Route Planner for ARC Raiders**  
> An open-source (GNU AGPLv3), local-first, zero-server-cost companion designed to eliminate the mental overhead of tracking 15+ simultaneous quests and optimize raid routes in *ARC Raiders*.

---

## ⚡ Key Features

### 1. 10-Second Fast Quest & Vendor Selector
- **Faction & Vendor Grouping:** Instantly toggle and track missions across all ARC Raiders traders: **Tian Wen**, **Shani**, **Lance**, **Celeste**, **Apollo**, and **Nomadic Envoys**.
- **Multi-Criteria Search:** Search by quest title, narrative dialogue, objectives, item loot, and map sectors.
- **Instant 1-Click State:** Toggle active quests with persistent local browser storage (`localStorage` via Zustand). No sign-up, telemetry, or account creation required.

### 2. Loadout & Stash HUD (What to Bring vs. What to Find)
- **Stash Prep (What to Bring):** Consolidates required keys (*Grandioso Apartment Keycard*, etc.), tools, and consumables into a clear checklist before dropping into the raid.
- **Priority Loot (What to Find):** Highlights mission-critical items to scavenge and extract (encrypted frequency slates, ARC logic microchips, heavy power cores).
- **Hideout & Station Protection (DO NOT SELL!):** Automatically flags materials needed for workbench, armory, medical station, or stash upgrades, preventing accidental recycling or sales.

### 3. Dynamic Raid Route Optimizer & Tactical Radar
- **In-Raid Drop Point Selection:** Select where you landed (*"I dropped here"*), and the engine dynamically recalibrates your tactical route in real time.
- **Dual Navigation Profiles:**
  - **Rat / Survival Mode:** Prioritizes 1-2 nearby, low-risk objectives, steers clear of high-hazard zones (`dangerLevel: 'high'`), and routes directly to the safest extraction point.
  - **Sweep / Efficiency Mode:** Solves a Precedence-Constrained Routing Heuristic across all active quest POIs to maximize XP, loot, and progression in a single deployment.
- **Sequential Ordering & Alternative Evaluation (SOP Heuristic):**
  - **Disjunctive Targets (OR):** Automatically evaluates alternative POIs (e.g., hack terminal A or terminal B) and selects the cost-optimal waypoint.
  - **Sequential Precedence (AND):** Enforces strict prerequisite order (e.g., retrieve the access keycard before unlocking the security door) via topological eligibility filtering.
- **Live In-Raid Focus HUD:** Clean, distraction-free view with waypoint step-by-step navigation, distance telemetry, compass bearings (0° - 360°), and an emergency evacuation button.

### 4. Visual Quest Ingestion (OCR & Vision AI)
- **Dual-Monitor PC Mode (`Ctrl+V` Instant Ingest):**
  - Press `Win+Shift+S` in-game to snip your quest log and `Ctrl+V` directly into the app.
  - 100% in-browser processing with **Tesseract.js** (WASM with adaptive binarization) and **Fuse.js** fuzzy matching against the quest database. Low-latency, completely offline, and network-independent.
- **Mobile Photo Mode (Screen Photo with Gemini Vision API):**
  - Handles perspective distortion, glare, and physical monitor moire patterns from mobile camera photos.
  - Direct client-side connection to the Google Gemini Flash API. Your API key remains strictly stored in your local browser storage.

### 5. 4K Cenital Satellite Top-Down Maps & Smooth Navigation
- **8 Official High-Resolution Sectors (4096×4096):**
  - Full cenital top-down satellite maps for *Dam Battlegrounds*, *Buried City*, *The Spaceport*, *The Blue Gate*, *Stella Montis*, *Pendola Pass*, *Riven Tides*, and *Practice Range* (~78 MB in PNG assets served statically from `/public/maps/`).
- **Calibrated Continuous Zoom & Pan:**
  - Zoom engine powered by `react-zoom-pan-pinch` with smooth continuous scaling (`smooth={true}`, `wheel: step 0.0015`), eliminating abrupt zoom jumps and allowing micro-inspection of buildings and terrain.
- **Marker Inverse Scaling:**
  - Tactical nodes and badges dynamically scale inversely with the camera zoom, remaining legible whether viewing the whole sector or zooming into street level.
- **Tactical Quest Type Badges:**
  - Distinct tactical iconography per objective category: **Recon**, **Combat**, **Sabotage**, **Delivery**, and **Locked Room / Keycard**.
- **Developer Coordinate Calibration Tool:**
  - Interactive click-to-copy utility for calculating exact (X, Y) percentage coordinates on the official maps.

### 6. Official Wiki Database & Multi-Criteria Search
- **118 Official Wiki Quests & 407 Objectives:**
  - Complete lore entries, trader radio dialogue, single-round constraints (`inOneRound`), item dependencies, and reward tables (XP, Credits, cosmetic gear, weapon mods).
- **Multi-Criteria Search with Map Aliases:**
  - Built-in recognition for map aliases and localized names (e.g., *"dam"*, *"spaceport"*, *"stella"*, *"buried city"*, *"presa"*).
  - 1-click map filtering directly from objective tags on quest cards.
- **Quick Custom Quests:**
  - Instantly create custom or unlisted quests by title for real-time tracking.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) + [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) with `persist` middleware (`localStorage`) |
| **Schema Validation** | [Zod 3.24](https://zod.dev/) (Full referential integrity across maps, items, and quests) |
| **Map Engine** | [react-zoom-pan-pinch 4.2](https://github.com/BetterTyped/react-zoom-pan-pinch) + Custom SVG overlay |
| **OCR & Search** | [Tesseract.js 7](https://tesseract.projectnaptha.com/) + [Fuse.js 7.5](https://fusejs.io/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Testing** | [Vitest 3](https://vitest.dev/) (29 automated unit & integrity tests) |

---

## 🚀 Installation & Local Development

For developers wishing to contribute or run a local instance:

```bash
# Clone the repository
git clone https://github.com/Flickzman/arc-raiders-companion.git
cd arc-raiders-companion

# Install dependencies
npm install

# Start the local development server
npm run dev

# Run automated tests and referential integrity suite (29 tests)
npm test

# Build for production
npm run build
```

---

## 🗺️ Project Roadmap

- [x] **Phase 1 — Core MVP:** Zod database schema, 10-second vendor selector, Loadout HUD, and workshop station protection.
- [x] **Phase 2 — Tactical Routing:** Dynamic route optimizer (SOP heuristic), compass bearings (0° - 360°), Rat vs. Sweep navigation profiles, OR/AND quest constraints, and In-Raid Focus HUD.
- [x] **Phase 3 — Visual Ingestion:** Desktop `Ctrl+V` screenshot capture with local Tesseract.js OCR, and mobile photo mode with Google Gemini Flash Vision API.
- [x] **Phase 4 — 4K Satellite Maps & Official Wiki Database:**
  - [x] 8 official 4096×4096 cenital satellite maps integrated.
  - [x] 118 wiki quests and 398 clean, verified objectives with narrative dialogue populated.
  - [x] Calibrated continuous zoom & pan engine with inverse marker scaling.
  - [x] Calibrated 79 POI coordinates with 124 objectives linked across all secondary sectors (*The Spaceport*, *Stella Montis*, *The Blue Gate*, *Pendola Pass*, *Riven Tides*).
  - [x] Progressive WebP image support with PNG fallback and asynchronous GPU texture decoding.

---

## ⚖️ Disclaimer & Intellectual Property

- **Source Code License:** The source code of this application is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**. See the [LICENSE](LICENSE) file for terms.
- **Game Assets & Trademarks:** *ARC Raiders*, game imagery, map textures, faction icons, quest dialogues, and item lore are the copyrighted and trademarked intellectual property of **Embark Studios AB**.
- **Community Non-Commercial Fair Use:** This is an unofficial, open-source community companion app created under Fair Use principles for informational, educational, and tactical player utility. It is not affiliated with, endorsed by, or sponsored by Embark Studios AB.
