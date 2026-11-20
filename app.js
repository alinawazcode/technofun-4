/**
 * TechnoFun 4.0 — ID Badge Generator
 * Matches reference/badge-reference.png in logical coordinates (1024 × 1536 px)
 */

'use strict';

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  eventName: "TechnoFun 4.0",
  date: "25 Nov 2026",
  venue: "The Shaikh Ayaz University, Shikarpur",
  hashtags: ["#TechnoFun4", "#InnovateCompeteCelebrate", "#SAUShikarpur"], // TODO: confirm hashtags
  events: [
    "Programming Competition",
    "Quiz Competition",
    "Gaming",
    "Exhibition"
  ],
  segments: [
    "Registration & Help Desk", // TODO: confirm segments list
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
  sheetWebhook: "", // Optional Google Sheet webhook URL
  colors: {
    bg: "#0A0A0D",
    cardTop: "#0D0C14",
    cardMid: "#060608",
    cardBot: "#030305",
    glassBorderTop: "rgba(165, 155, 235, 0.45)",
    glassBorderBot: "rgba(90, 80, 160, 0.22)",
    violet: "#6D4AFF",
    violetGlow: "#9D7BFF",
    deepViolet: "#3B1E8C",
    fieldBorder: "#5E3DDB",
    fieldLabel: "#9E7BFF",
    textWhite: "#FFFFFF",
    textMuted: "#E2E2E6",
    textGrey: "#7A7A85",
    footerGrey: "#6E6E75",
    watermark: "#1C1C20"
  },
  captions: {
    Participant: "I'm participating in {detail} at TechnoFun 4.0 at {venue}! {hashtags}",
    Volunteer: "I'm volunteering with the {detail} team at TechnoFun 4.0 at {venue}! {hashtags}",
    Coordinator: "I'm coordinating TechnoFun 4.0 at {venue}! {hashtags}"
  }
};

// ==========================================
// STATE
// ==========================================
const state = {
  badgeType: "Participant",
  name: "",
  team: "",
  detail: CONFIG.events[0],
  isCustomDetail: false,
  photo: null,
  photoSource: null, // Image or ImageBitmap
  photoNaturalWidth: 0,
  photoNaturalHeight: 0,
  photoTransform: {
    zoom: 1.0,   // 1.0 = minimum cover of hexagon (100%), up to 5.0 (500%)
    panX: 0,     // logical px offset from center
    panY: 0,     // logical px offset from center
    flipH: false
  },
  cardOnly: false,
  refMode: false,
  debugMode: false,
  scale: 3,
  lanyardImg: null,
  sealImg: null,
  referenceImg: null,
  fontsLoaded: false
};

// Layout constants in logical coordinate space (1024 × 1536)
const LAYOUT = {
  width: 1024,
  height: 1536,
  card: { x: 70, y: 120, w: 883, h: 1325, r: 48 },
  hex: {
    cx: 512,
    cy: 650,
    w: 350,
    h: 360,
    vertices: [
      { x: 512, y: 470 }, // Top
      { x: 687, y: 565 }, // Top-Right
      { x: 687, y: 735 }, // Bottom-Right
      { x: 512, y: 830 }, // Bottom
      { x: 337, y: 735 }, // Bottom-Left
      { x: 337, y: 565 }  // Top-Left
    ]
  },
  lanyard: { x: 380, y: 0, w: 265, h: 230 },
  nameBar: { x: 130, y: 881, w: 763, h: 120, cut: 28 },
  teamBar: { x: 178, y: 1035, w: 667, h: 96, cut: 24 },
  roleBarNormal: { x: 178, y: 1150, w: 667, h: 95, cut: 24 },
  roleBarShifted: { x: 178, y: 1035, w: 667, h: 95, cut: 24 },
  volunteerY: 1342,
  footerY: 1386
};

// DOM Elements
const canvas = document.getElementById('badgeCanvas');
const ctx = canvas.getContext('2d');
const dropzone = document.getElementById('dropzone');
const photoFileInput = document.getElementById('photoFileInput');
const fullNameInput = document.getElementById('fullNameInput');
const teamNameInput = document.getElementById('teamNameInput');
const nameCount = document.getElementById('nameCount');
const teamCount = document.getElementById('teamCount');
const roleBarLabel = document.getElementById('roleBarLabel');
const chipChoices = document.getElementById('chipChoices');
const customRoleWrap = document.getElementById('customRoleWrap');
const customRoleInput = document.getElementById('customRoleInput');
const photoFineTuneWrap = document.getElementById('photoFineTuneWrap');
const photoQuickBar = document.getElementById('photoQuickBar');
const zoomSlider = document.getElementById('zoomSlider');
const zoomVal = document.getElementById('zoomVal');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const nudgeUp = document.getElementById('nudgeUp');
const nudgeDown = document.getElementById('nudgeDown');
const nudgeLeft = document.getElementById('nudgeLeft');
const nudgeRight = document.getElementById('nudgeRight');
const nudgeReset = document.getElementById('nudgeReset');
const flipBtn = document.getElementById('flipBtn');
const resetPhotoBtn = document.getElementById('resetPhotoBtn');
const panXSlider = document.getElementById('panXSlider');
const panYSlider = document.getElementById('panYSlider');
const cardOnlyCheck = document.getElementById('cardOnlyCheck');
const scaleSelect = document.getElementById('scaleSelect');
const downloadPrimaryBtn = document.getElementById('downloadPrimaryBtn');
const mobileDownloadBtn = document.getElementById('mobileDownloadBtn');
const downloadResolutionHint = document.getElementById('downloadResolutionHint');
const shareBtn = document.getElementById('shareBtn');
const copyCaptionBtn = document.getElementById('copyCaptionBtn');
const captionText = document.getElementById('captionText');
const toast = document.getElementById('toast');
const refModeBtn = document.getElementById('refModeBtn');
const debugModeBtn = document.getElementById('debugModeBtn');
const refCompareBox = document.getElementById('refCompareBox');
const closeRefBoxBtn = document.getElementById('closeRefBoxBtn');
const genPreviewImg = document.getElementById('genPreviewImg');
const overlayGenImg = document.getElementById('overlayGenImg');
const overlayGenMask = document.getElementById('overlayGenMask');
const overlaySlider = document.getElementById('overlaySlider');
const diffCanvas = document.getElementById('diffCanvas');
const diffStats = document.getElementById('diffStats');

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  parseUrlParams();
  setupEventListeners();
  loadAssets();
  await loadFonts();
  renderChips();
  updateCaption();
  renderPreview();
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('ref') === '1') {
    state.refMode = true;
    refModeBtn.classList.add('active');
    setReferenceModeData();
    refCompareBox.style.display = 'block';
  }
  if (params.get('debug') === '1') {
    state.debugMode = true;
    debugModeBtn.classList.add('active');
  }
}

function setReferenceModeData() {
  state.badgeType = "Volunteer";
  state.name = "Your Name Here";
  state.team = "Your Team Name";
  state.detail = "Your Role Here";
  state.isCustomDetail = true;
  state.photo = null; // show placeholder silhouette
  
  // Update inputs
  fullNameInput.value = state.name;
  teamNameInput.value = state.team;
  document.querySelector(`input[name="badgeType"][value="Volunteer"]`).checked = true;
  updateCounts();
}

function loadAssets() {
  // Lanyard asset
  const lanyard = new Image();
  lanyard.src = CONFIG.lanyardAssetPath;
  lanyard.onload = () => {
    state.lanyardImg = lanyard;
    renderPreview();
  };

  // Optional university seal
  if (CONFIG.showUniversitySeal) {
    const seal = new Image();
    seal.src = CONFIG.universitySealPath;
    seal.onload = () => {
      state.sealImg = seal;
      renderPreview();
    };
  }

  // Reference image for diff
  const refImg = new Image();
  refImg.src = "reference/badge-reference.png";
  refImg.onload = () => {
    state.referenceImg = refImg;
    if (state.refMode) {
      updateDiff();
    }
  };
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('800 italic 54px Poppins'),
      document.fonts.load('700 48px Poppins'),
      document.fonts.load('600 30px Poppins'),
      document.fonts.load('300 56px Poppins'),
      document.fonts.load('180px Anton'),
      document.fonts.load('500 15px Inter')
    ]);
    state.fontsLoaded = true;
  } catch (e) {
    console.warn("Google fonts failed to load; using system fallbacks", e);
    state.fontsLoaded = true;
  }
}

// ==========================================
// BADGE RENDERER (Logical: 1024 × 1536)
// ==========================================
function drawBadge(targetCtx, s, options = {}) {
  const exportScale = options.scale || 1;
  const isCardOnly = options.cardOnly !== undefined ? options.cardOnly : s.cardOnly;
  const isDebug = options.debugMode !== undefined ? options.debugMode : s.debugMode;

  targetCtx.save();
  targetCtx.setTransform(exportScale, 0, 0, exportScale, 0, 0);
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';

  // 1. Clear / Outer Background
  targetCtx.clearRect(0, 0, LAYOUT.width, LAYOUT.height);

  if (!isCardOnly) {
    // Fill deep near-black outer canvas background
    targetCtx.fillStyle = CONFIG.colors.bg;
    targetCtx.fillRect(0, 0, LAYOUT.width, LAYOUT.height);

    // Subtle darker diagonal background panels in corners
    drawDiagonalBgPanels(targetCtx);

    // Lanyard and Metal Clip (drawn behind card and over top)
    drawLanyardAndClip(targetCtx, s);
  }

  // 2. Card Shadow (only if not cardOnly)
  if (!isCardOnly) {
    targetCtx.save();
    targetCtx.shadowColor = "rgba(0, 0, 0, 0.7)";
    targetCtx.shadowBlur = 32;
    targetCtx.shadowOffsetY = 10;
    roundRectPath(targetCtx, LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.w, LAYOUT.card.h, LAYOUT.card.r);
    targetCtx.fillStyle = "#0D0C14";
    targetCtx.fill();
    targetCtx.restore();
  }

  // 3. Card Body & Clip Mask
  targetCtx.save();
  roundRectPath(targetCtx, LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.w, LAYOUT.card.h, LAYOUT.card.r);
  targetCtx.clip();

  // Card gradient fill
  const cardGrad = targetCtx.createLinearGradient(0, LAYOUT.card.y, 0, LAYOUT.card.y + LAYOUT.card.h);
  cardGrad.addColorStop(0, CONFIG.colors.cardTop);
  cardGrad.addColorStop(0.45, CONFIG.colors.cardMid);
  cardGrad.addColorStop(1, CONFIG.colors.cardBot);
  targetCtx.fillStyle = cardGrad;
  targetCtx.fillRect(LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.w, LAYOUT.card.h);

  // Violet Accents & Glows
  drawCardAccents(targetCtx);

  // Wave Contour Lines & Circuit Details
  drawWaveContourLines(targetCtx);

  // Top-Left Wordmark "TechnoFun 4.0", sparkle & subtitle
  drawWordmark(targetCtx);

  // Top-Right Tagline "BIGGER / BOLDER / SMARTER" & violet line
  drawTopRightTagline(targetCtx);

  // Watermark behind hexagon ("TEAM" / "NAME" or split team name)
  drawWatermark(targetCtx, s);

  // Hexagon Photo Frame & Photo / Silhouette
  drawHexagonFrame(targetCtx, s);

  // Field Bars (Name, Team, Role)
  drawFieldBars(targetCtx, s);

  // Bottom Label ("VOLUNTEER" / "PARTICIPANT" / "COORDINATOR"), Flank Lines & Footer
  drawBottomSection(targetCtx, s);

  // Glass edge inner highlight
  drawGlassEdgeHighlight(targetCtx);

  targetCtx.restore(); // Restore card clip

  // 4. Lanyard Clip Front Layer (overlaps card top)
  if (!isCardOnly) {
    drawLanyardFront(targetCtx, s);
  }

  // 5. Card Glass Border Stroke
  targetCtx.save();
  roundRectPath(targetCtx, LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.w, LAYOUT.card.h, LAYOUT.card.r);
  const borderGrad = targetCtx.createLinearGradient(LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.x + LAYOUT.card.w, LAYOUT.card.y + LAYOUT.card.h);
  borderGrad.addColorStop(0, CONFIG.colors.glassBorderTop);
  borderGrad.addColorStop(1, CONFIG.colors.glassBorderBot);
  targetCtx.strokeStyle = borderGrad;
  targetCtx.lineWidth = 2.0;
  targetCtx.stroke();
  targetCtx.restore();

  // 6. Debug Outlines Overlay
  if (isDebug) {
    drawDebugOutlines(targetCtx, s);
  }

  targetCtx.restore();
}

// ==========================================
// DETAILED CANVAS DRAWING FUNCTIONS
// ==========================================

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawDiagonalBgPanels(ctx) {
  ctx.save();
  ctx.fillStyle = "rgba(18, 18, 24, 0.45)";
  
  // Top-left diagonal panel
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(260, 0);
  ctx.lineTo(0, 260);
  ctx.closePath();
  ctx.fill();

  // Bottom-right diagonal panel
  ctx.beginPath();
  ctx.moveTo(LAYOUT.width, LAYOUT.height - 300);
  ctx.lineTo(LAYOUT.width, LAYOUT.height);
  ctx.lineTo(LAYOUT.width - 300, LAYOUT.height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawLanyardAndClip(ctx, s) {
  // If lanyard image asset loaded, draw it directly
  if (s.lanyardImg && s.lanyardImg.complete) {
    ctx.drawImage(s.lanyardImg, LAYOUT.lanyard.x, LAYOUT.lanyard.y, LAYOUT.lanyard.w, LAYOUT.lanyard.h);
    return;
  }

  // Procedural fallback for Lanyard Strap
  ctx.save();
  const strapGrad = ctx.createLinearGradient(418, 0, 606, 0);
  strapGrad.addColorStop(0, "#121215");
  strapGrad.addColorStop(0.5, "#222228");
  strapGrad.addColorStop(1, "#121215");
  ctx.fillStyle = strapGrad;
  ctx.fillRect(418, 0, 188, 160);

  // Subtle woven vertical lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let x = 422; x < 606; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 160);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLanyardFront(ctx, s) {
  // If lanyard asset is already drawn in step 1, skip procedural clip
  if (s.lanyardImg && s.lanyardImg.complete) return;

  // Procedural Metal Clip
  ctx.save();
  const clipX = 396;
  const clipY = 128;
  const clipW = 232;
  const clipH = 89;
  const r = 16;

  // Clip body
  roundRectPath(ctx, clipX, clipY, clipW, clipH, r);
  const clipGrad = ctx.createLinearGradient(0, clipY, 0, clipY + clipH);
  clipGrad.addColorStop(0, "#888892");
  clipGrad.addColorStop(0.15, "#4E4E56");
  clipGrad.addColorStop(0.85, "#28282F");
  clipGrad.addColorStop(1, "#1C1C20");
  ctx.fillStyle = clipGrad;
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner slot (horizontal pill)
  roundRectPath(ctx, 457, 155, 110, 26, 13);
  ctx.fillStyle = "#0A0A0D";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawCardAccents(ctx) {
  ctx.save();

  // 1. Top-Left Violet Accent Band
  ctx.beginPath();
  ctx.moveTo(LAYOUT.card.x, LAYOUT.card.y);
  ctx.lineTo(LAYOUT.card.x + 220, LAYOUT.card.y);
  ctx.lineTo(LAYOUT.card.x, LAYOUT.card.y + 220);
  ctx.closePath();
  const tlGrad = ctx.createLinearGradient(LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.x + 120, LAYOUT.card.y + 120);
  tlGrad.addColorStop(0, "rgba(109, 74, 255, 0.35)");
  tlGrad.addColorStop(0.5, "rgba(59, 30, 140, 0.2)");
  tlGrad.addColorStop(1, "rgba(10, 10, 13, 0)");
  ctx.fillStyle = tlGrad;
  ctx.fill();

  // 2. Left-Edge Accent Panel (y=710..870)
  ctx.beginPath();
  ctx.moveTo(LAYOUT.card.x, 720);
  ctx.lineTo(LAYOUT.card.x + 40, 750);
  ctx.lineTo(LAYOUT.card.x + 40, 840);
  ctx.lineTo(LAYOUT.card.x, 870);
  ctx.closePath();
  const leftGrad = ctx.createLinearGradient(LAYOUT.card.x, 0, LAYOUT.card.x + 40, 0);
  leftGrad.addColorStop(0, "rgba(109, 74, 255, 0.45)");
  leftGrad.addColorStop(1, "rgba(109, 74, 255, 0.05)");
  ctx.fillStyle = leftGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(157, 123, 255, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. Right-Edge Glowing Panel (y=770..905)
  ctx.beginPath();
  ctx.moveTo(LAYOUT.card.x + LAYOUT.card.w, 770);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w - 45, 800);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w - 45, 875);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w, 905);
  ctx.closePath();
  const rightGrad = ctx.createLinearGradient(LAYOUT.card.x + LAYOUT.card.w, 0, LAYOUT.card.x + LAYOUT.card.w - 45, 0);
  rightGrad.addColorStop(0, "rgba(109, 74, 255, 0.5)");
  rightGrad.addColorStop(1, "rgba(59, 30, 140, 0.08)");
  ctx.fillStyle = rightGrad;
  ctx.fill();

  // 4. Lower-Right Diagonal Stripe (y=1090..1200)
  ctx.beginPath();
  ctx.moveTo(LAYOUT.card.x + LAYOUT.card.w, 1090);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w - 120, 1200);
  ctx.strokeStyle = "rgba(123, 87, 255, 0.4)";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 5. Bottom-Right Corner Accent (y=1270..1445)
  ctx.beginPath();
  ctx.moveTo(LAYOUT.card.x + LAYOUT.card.w, 1290);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w - 180, LAYOUT.card.y + LAYOUT.card.h);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w, LAYOUT.card.y + LAYOUT.card.h);
  ctx.closePath();
  const brGrad = ctx.createLinearGradient(LAYOUT.card.x + LAYOUT.card.w, LAYOUT.card.y + LAYOUT.card.h, LAYOUT.card.x + LAYOUT.card.w - 120, 1320);
  brGrad.addColorStop(0, "rgba(109, 74, 255, 0.4)");
  brGrad.addColorStop(1, "rgba(10, 10, 13, 0)");
  ctx.fillStyle = brGrad;
  ctx.fill();

  ctx.restore();
}

function drawWaveContourLines(ctx) {
  ctx.save();
  ctx.strokeStyle = "rgba(130, 110, 240, 0.14)";
  ctx.lineWidth = 1.2;

  // Top-Right concentric contour arcs (x: 640..950, y: 120..320)
  for (let i = 0; i < 5; i++) {
    const offset = i * 28;
    ctx.beginPath();
    ctx.moveTo(700 + offset * 0.8, 120);
    ctx.bezierCurveTo(760 + offset, 200, 840 + offset, 240, 950, 240 + offset * 0.6);
    ctx.stroke();
  }

  // Bottom-Left concentric contour arcs (x: 75..260, y: 1180..1330)
  for (let i = 0; i < 4; i++) {
    const offset = i * 24;
    ctx.beginPath();
    ctx.moveTo(70, 1200 + offset * 0.8);
    ctx.bezierCurveTo(130 + offset, 1230, 180 + offset, 1270, 240 + offset * 0.8, 1330);
    ctx.stroke();
  }

  // Circuit trace details near hexagon bottom left & right
  ctx.strokeStyle = "rgba(109, 74, 255, 0.25)";
  ctx.fillStyle = "rgba(157, 123, 255, 0.5)";
  ctx.lineWidth = 1.2;

  // Left circuit trace
  ctx.beginPath();
  ctx.moveTo(270, 750);
  ctx.lineTo(315, 750);
  ctx.lineTo(330, 765);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(270, 750, 3, 0, Math.PI * 2);
  ctx.fill();

  // Right circuit trace
  ctx.beginPath();
  ctx.moveTo(755, 750);
  ctx.lineTo(710, 750);
  ctx.lineTo(695, 765);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(755, 750, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawWordmark(ctx) {
  ctx.save();

  const startX = 94;
  const baselineY = 245;

  // 1. "Techno" in heavy italic sans with white-to-silver gradient
  ctx.font = "italic 800 54px Poppins, sans-serif";
  const technoGrad = ctx.createLinearGradient(0, baselineY - 45, 0, baselineY);
  technoGrad.addColorStop(0, "#FFFFFF");
  technoGrad.addColorStop(1, "#B4B4BC");
  ctx.fillStyle = technoGrad;
  ctx.fillText("Techno", startX, baselineY);
  const technoWidth = ctx.measureText("Techno").width;

  // 2. "Fun" in heavy italic sans with electric violet gradient
  const funGrad = ctx.createLinearGradient(0, baselineY - 45, 0, baselineY);
  funGrad.addColorStop(0, "#A785FF");
  funGrad.addColorStop(1, "#5F36FF");
  ctx.fillStyle = funGrad;
  ctx.fillText("Fun", startX + technoWidth, baselineY);
  const funWidth = ctx.measureText("Fun").width;

  // 3. "4.0" smaller italic white
  ctx.font = "italic 700 26px Poppins, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("4.0", startX + technoWidth + funWidth + 8, baselineY);

  // 4. Orbit arc above "Techno"
  ctx.beginPath();
  ctx.moveTo(startX + 8, baselineY - 32);
  ctx.quadraticCurveTo(startX + 75, baselineY - 76, startX + 130, baselineY - 76);
  ctx.strokeStyle = "rgba(167, 133, 255, 0.75)";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 5. Four-point sparkle star at orbit end
  drawSparkleStar(ctx, startX + 130, baselineY - 76, 9, 3.5, "#D6C2FF");

  // 6. Subtitle "Innovate • Compete • Celebrate"
  const subY = 328;
  ctx.font = "500 15px Inter, Poppins, sans-serif";
  ctx.fillStyle = "#E0E0E6";
  
  const part1 = "Innovate";
  const dot = " • ";
  const part2 = "Compete";
  const part3 = "Celebrate";

  let curX = startX;
  ctx.fillText(part1, curX, subY);
  curX += ctx.measureText(part1).width;

  ctx.fillStyle = "#7E57FF";
  ctx.fillText(dot, curX, subY);
  curX += ctx.measureText(dot).width;

  ctx.fillStyle = "#E0E0E6";
  ctx.fillText(part2, curX, subY);
  curX += ctx.measureText(part2).width;

  ctx.fillStyle = "#7E57FF";
  ctx.fillText(dot, curX, subY);
  curX += ctx.measureText(dot).width;

  ctx.fillStyle = "#E0E0E6";
  ctx.fillText(part3, curX, subY);

  ctx.restore();
}

function drawSparkleStar(ctx, cx, cy, outerR, innerR, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(167, 133, 255, 0.8)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / 4;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTopRightTagline(ctx) {
  ctx.save();

  // Vertical violet accent line
  const lineX = 692;
  const lineY1 = 162;
  const lineY2 = 258;
  ctx.beginPath();
  ctx.moveTo(lineX, lineY1);
  ctx.lineTo(lineX, lineY2);
  ctx.strokeStyle = "#6E48FF";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(110, 72, 255, 0.5)";
  ctx.shadowBlur = 6;
  ctx.stroke();

  // Three lines of heavy italic grey text
  ctx.font = "italic 800 24px Poppins, sans-serif";
  ctx.fillStyle = "#7A7A85";
  ctx.shadowColor = "transparent";

  const textX = 712;
  ctx.fillText("BIGGER", textX, 188);
  ctx.fillText("BOLDER", textX, 219);
  ctx.fillText("SMARTER", textX, 250);

  ctx.restore();
}

function drawWatermark(ctx, s) {
  ctx.save();

  let leftWord = "";
  let rightWord = "";

  const teamInput = (s.team || "").trim().toUpperCase();

  if (!teamInput) {
    leftWord = "TECHNO";
    rightWord = "FUN";
  } else {
    const words = teamInput.split(/\s+/);
    if (words.length > 1) {
      leftWord = words[0];
      rightWord = words.slice(1).join(" ");
    } else {
      // Single word split by characters
      const w = words[0];
      const mid = Math.ceil(w.length / 2);
      leftWord = w.slice(0, mid);
      rightWord = w.slice(mid);
    }
  }

  // Watermark text styling
  ctx.font = "180px Anton, Impact, sans-serif";
  ctx.fillStyle = CONFIG.colors.watermark; // #1C1C20
  ctx.textBaseline = "middle";

  const maxSideWidth = 240; // Max available horizontal room
  const leftTargetX = 328;  // Ends tucking behind hexagon left (x=337)
  const rightTargetX = 696; // Starts behind hexagon right (x=687)
  const centerY = 642;

  // Auto-fit font size so both words fit their side width
  let fontSize = 180;
  ctx.font = `${fontSize}px Anton, Impact, sans-serif`;
  let wLeft = ctx.measureText(leftWord).width;
  let wRight = ctx.measureText(rightWord).width;
  const maxW = Math.max(wLeft, wRight);

  if (maxW > maxSideWidth) {
    fontSize = Math.floor(fontSize * (maxSideWidth / maxW));
    fontSize = Math.max(48, fontSize); // prevent vanishing
    ctx.font = `${fontSize}px Anton, Impact, sans-serif`;
  }

  // Left word (right-aligned against left edge of hexagon)
  ctx.textAlign = "right";
  ctx.fillText(leftWord, leftTargetX, centerY);

  // Right word (left-aligned starting at right edge of hexagon)
  ctx.textAlign = "left";
  ctx.fillText(rightWord, rightTargetX, centerY);

  ctx.restore();
}

function drawHexagonFrame(ctx, s) {
  const hex = LAYOUT.hex;

  // 1. Draw photo or placeholder silhouette inside clipped hexagon
  ctx.save();
  buildHexagonPath(ctx, hex.vertices);
  ctx.clip();

  if (s.photoSource) {
    drawUserPhoto(ctx, s, hex);
  } else {
    drawPlaceholderSilhouette(ctx, hex);
  }
  ctx.restore();

  // 2. Double Violet Border with Glow & Edge Highlights
  ctx.save();

  // Outer Border (4px #6D4AFF)
  buildHexagonPath(ctx, hex.vertices);
  ctx.strokeStyle = "#6D4AFF";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(109, 74, 255, 0.45)";
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Inner Border (2px #8B6BF9) with 4px gap
  ctx.save();
  ctx.translate(hex.cx, hex.cy);
  ctx.scale(0.965, 0.965);
  ctx.translate(-hex.cx, -hex.cy);
  buildHexagonPath(ctx, hex.vertices);
  ctx.strokeStyle = "#8B6BF9";
  ctx.lineWidth = 2;
  ctx.shadowColor = "transparent";
  ctx.stroke();
  ctx.restore();

  // Bevel Highlights on top-left and bottom-right edges
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(235, 225, 255, 0.75)";
  ctx.lineCap = "round";

  // Top-left bevel highlight
  ctx.beginPath();
  ctx.moveTo(hex.vertices[5].x, hex.vertices[5].y);
  ctx.lineTo(hex.vertices[0].x, hex.vertices[0].y);
  ctx.stroke();

  // Bottom-right bevel highlight
  ctx.beginPath();
  ctx.moveTo(hex.vertices[2].x, hex.vertices[2].y);
  ctx.lineTo(hex.vertices[3].x, hex.vertices[3].y);
  ctx.stroke();

  ctx.restore();
}

function buildHexagonPath(ctx, verts) {
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) {
    ctx.lineTo(verts[i].x, verts[i].y);
  }
  ctx.closePath();
}

function drawPlaceholderSilhouette(ctx, hex) {
  // Light grey background
  ctx.fillStyle = "#B8B8BA";
  ctx.fillRect(hex.cx - hex.w / 2, hex.cy - hex.h / 2, hex.w, hex.h);

  // Dark grey silhouette (#424245)
  ctx.fillStyle = "#424245";

  // Head (circle)
  ctx.beginPath();
  ctx.arc(hex.cx, hex.cy - 68, 38, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders & Torso (smooth expanding trapezoid / arc)
  ctx.beginPath();
  ctx.moveTo(hex.cx - 30, hex.cy - 20);
  ctx.bezierCurveTo(hex.cx - 85, hex.cy + 10, hex.cx - 120, hex.cy + 80, hex.cx - 130, hex.cy + 150);
  ctx.lineTo(hex.cx + 130, hex.cy + 150);
  ctx.bezierCurveTo(hex.cx + 120, hex.cy + 80, hex.cx + 85, hex.cy + 10, hex.cx + 30, hex.cy - 20);
  ctx.closePath();
  ctx.fill();
}

function drawUserPhoto(ctx, s, hex) {
  const img = s.photoSource;
  const nw = s.photoNaturalWidth || img.width;
  const nh = s.photoNaturalHeight || img.height;

  // Base scale required to fully cover the hexagon bounding box (w: 350, h: 360)
  const baseScale = Math.max(hex.w / nw, hex.h / nh);
  const zoom = Math.max(1.0, Math.min(5.0, s.photoTransform.zoom || 1.0));
  const finalScale = baseScale * zoom;

  const dispW = nw * finalScale;
  const dispH = nh * finalScale;

  // Clamp pan so image never leaves any gap inside the hexagon
  const maxPanX = Math.max(0, (dispW - hex.w) / 2);
  const maxPanY = Math.max(0, (dispH - hex.h) / 2);

  const panX = Math.max(-maxPanX, Math.min(maxPanX, s.photoTransform.panX || 0));
  const panY = Math.max(-maxPanY, Math.min(maxPanY, s.photoTransform.panY || 0));

  ctx.save();
  ctx.translate(hex.cx + panX, hex.cy + panY);
  if (s.photoTransform.flipH) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(img, -dispW / 2, -dispH / 2, dispW, dispH);
  ctx.restore();
}

function drawFieldBars(ctx, s) {
  const hasTeam = Boolean(s.team && s.team.trim());

  // 1. Name Bar (Large)
  drawHexagonalBar(ctx, LAYOUT.nameBar, "#5747C1", "#0B0C0E");
  drawPersonIcon(ctx, 185, 941, "#E2E2E6");

  // Vertical white divider
  ctx.strokeStyle = "#C8C8D0";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(240, 898);
  ctx.lineTo(240, 984);
  ctx.stroke();

  // Name text: auto-fit font size if long
  const rawName = (s.name || "").trim() || (s.refMode ? "Your Name Here" : "Your Name Here");
  drawAutoFitText(ctx, {
    text: rawName,
    startX: 260,
    baselineY: 957,
    maxWidth: 620,
    baseSize: 52,
    minSize: 24,
    fontFamily: "Poppins, sans-serif",
    fontWeight: "700",
    color: "#FFFFFF"
  });

  // 2. Team Bar (Optional - hidden if empty)
  let roleBarPos = LAYOUT.roleBarNormal;

  if (hasTeam) {
    drawHexagonalBar(ctx, LAYOUT.teamBar, "#5F3DDB", "#08080A");
    drawPeopleIcon(ctx, 230, 1083, "#CCCCCC");

    // Vertical violet divider
    ctx.strokeStyle = "#6E48FF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(268, 1048);
    ctx.lineTo(268, 1118);
    ctx.stroke();

    // Label "Team:"
    ctx.font = "600 18px Poppins, sans-serif";
    ctx.fillStyle = "#9E7BFF";
    ctx.fillText("Team:", 290, 1068);

    // Value "Your Team Name"
    drawAutoFitText(ctx, {
      text: s.team.trim(),
      startX: 290,
      baselineY: 1106,
      maxWidth: 520,
      baseSize: 38,
      minSize: 18,
      fontFamily: "Poppins, sans-serif",
      fontWeight: "600",
      color: "#FFFFFF"
    });
  } else {
    // When Team is empty, Role Bar shifts up to close the gap
    roleBarPos = LAYOUT.roleBarShifted;
  }

  // 3. Role Bar (Dynamic content based on Badge Type)
  drawHexagonalBar(ctx, roleBarPos, "#5F3DDB", "#08080A");
  drawBriefcaseIcon(ctx, 230, roleBarPos.y + roleBarPos.h / 2, "#CCCCCC");

  // Vertical violet divider
  ctx.strokeStyle = "#6E48FF";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(268, roleBarPos.y + 13);
  ctx.lineTo(268, roleBarPos.y + roleBarPos.h - 13);
  ctx.stroke();

  // Label based on badge type
  let roleLabel = "Role:";
  if (s.badgeType === "Participant") roleLabel = "Event:";
  else if (s.badgeType === "Volunteer") roleLabel = "Segment:";

  ctx.font = "600 18px Poppins, sans-serif";
  ctx.fillStyle = "#9E7BFF";
  ctx.fillText(roleLabel, 290, roleBarPos.y + 33);

  // Role / Event / Segment Value
  let roleVal = (s.detail || "").trim() || (s.refMode ? "Your Role Here" : "Your Role Here");
  drawAutoFitText(ctx, {
    text: roleVal,
    startX: 290,
    baselineY: roleBarPos.y + 71,
    maxWidth: 520,
    baseSize: 38,
    minSize: 18,
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    color: "#FFFFFF"
  });
}

function drawHexagonalBar(ctx, bar, borderColor, fillColor) {
  ctx.save();
  const leftX = bar.x;
  const rightX = bar.x + bar.w;
  const topY = bar.y;
  const botY = bar.y + bar.h;
  const midY = bar.y + bar.h / 2;
  const cut = bar.cut;

  ctx.beginPath();
  ctx.moveTo(leftX + cut, topY);
  ctx.lineTo(rightX - cut, topY);
  ctx.lineTo(rightX, midY);
  ctx.lineTo(rightX - cut, botY);
  ctx.lineTo(leftX + cut, botY);
  ctx.lineTo(leftX, midY);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = "rgba(109, 74, 255, 0.25)";
  ctx.shadowBlur = 8;
  ctx.stroke();

  ctx.restore();
}

function drawAutoFitText(ctx, opts) {
  ctx.save();
  let size = opts.baseSize;
  ctx.font = `${opts.fontWeight} ${size}px ${opts.fontFamily}`;
  let textWidth = ctx.measureText(opts.text).width;

  while (textWidth > opts.maxWidth && size > opts.minSize) {
    size -= 1;
    ctx.font = `${opts.fontWeight} ${size}px ${opts.fontFamily}`;
    textWidth = ctx.measureText(opts.text).width;
  }

  ctx.fillStyle = opts.color;
  ctx.fillText(opts.text, opts.startX, opts.baselineY);
  ctx.restore();
}

// Vector Icon Paths in Canvas
function drawPersonIcon(ctx, cx, cy, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 11, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 18);
  ctx.bezierCurveTo(cx - 18, cy + 2, cx - 10, cy - 1, cx, cy - 1);
  ctx.bezierCurveTo(cx + 10, cy - 1, cx + 18, cy + 2, cx + 18, cy + 18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPeopleIcon(ctx, cx, cy, color) {
  ctx.save();
  ctx.fillStyle = color;

  // Center person
  ctx.beginPath();
  ctx.arc(cx, cy - 11, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 15);
  ctx.bezierCurveTo(cx - 14, cy + 1, cx - 7, cy - 1, cx, cy - 1);
  ctx.bezierCurveTo(cx + 7, cy - 1, cx + 14, cy + 1, ctx.cx + 14, cy + 15);
  ctx.closePath();
  ctx.fill();

  // Left flanking person
  ctx.beginPath();
  ctx.arc(cx - 16, cy - 8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 14);
  ctx.bezierCurveTo(cx - 24, cy + 3, cx - 18, cy + 2, cx - 14, cy + 5);
  ctx.lineTo(cx - 14, cy + 14);
  ctx.closePath();
  ctx.fill();

  // Right flanking person
  ctx.beginPath();
  ctx.arc(cx + 16, cy - 8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + 24, cy + 14);
  ctx.bezierCurveTo(cx + 24, cy + 3, cx + 18, cy + 2, cx + 14, cy + 5);
  ctx.lineTo(cx + 14, cy + 14);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBriefcaseIcon(ctx, cx, cy, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;

  // Handle
  ctx.beginPath();
  ctx.roundRect(cx - 10, cy - 16, 20, 10, 4);
  ctx.stroke();

  // Bag Body
  ctx.beginPath();
  ctx.roundRect(cx - 19, cy - 8, 38, 24, 4);
  ctx.fill();

  // Middle horizontal line / clasp
  ctx.fillStyle = "#08080A";
  ctx.fillRect(cx - 19, cy + 1, 38, 2);

  // Clasp buckle
  ctx.fillStyle = color;
  ctx.fillRect(cx - 3, cy - 1, 6, 6);

  ctx.restore();
}

function drawBottomSection(ctx, s) {
  ctx.save();

  // Badge Type Label ("VOLUNTEER" / "PARTICIPANT" / "COORDINATOR")
  const typeText = (s.badgeType || "VOLUNTEER").toUpperCase();
  ctx.font = "300 56px Poppins, sans-serif";
  ctx.fillStyle = "#E2E2E6";
  ctx.textAlign = "center";
  
  // Custom letter spacing support for canvas
  if (ctx.letterSpacing !== undefined) {
    ctx.letterSpacing = "22px";
    ctx.fillText(typeText, 512, LAYOUT.volunteerY);
    ctx.letterSpacing = "0px";
  } else {
    drawLetterSpacedText(ctx, typeText, 512, LAYOUT.volunteerY, 22);
  }

  // Flanking horizontal violet accent lines
  ctx.strokeStyle = "#7954F0";
  ctx.lineWidth = 2.0;

  // Left line: x 178 to 269
  ctx.beginPath();
  ctx.moveTo(178, 1332);
  ctx.lineTo(269, 1332);
  ctx.stroke();

  // Right line: x 755 to 846
  ctx.beginPath();
  ctx.moveTo(755, 1332);
  ctx.lineTo(846, 1332);
  ctx.stroke();

  // Footer text "TechnoFun 4.0"
  ctx.font = "500 20px Poppins, sans-serif";
  ctx.fillStyle = "#6E6E75";
  ctx.textAlign = "center";
  if (ctx.letterSpacing !== undefined) {
    ctx.letterSpacing = "5px";
    ctx.fillText("TechnoFun 4.0", 512, LAYOUT.footerY);
    ctx.letterSpacing = "0px";
  } else {
    drawLetterSpacedText(ctx, "TechnoFun 4.0", 512, LAYOUT.footerY, 5);
  }

  // Optional University Seal
  if (CONFIG.showUniversitySeal && s.sealImg && s.sealImg.complete) {
    ctx.drawImage(s.sealImg, 512 - 25, 1405, 50, 50);
  }

  ctx.restore();
}

function drawLetterSpacedText(ctx, text, cx, y, spacing) {
  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    totalWidth += ctx.measureText(text[i]).width + (i < text.length - 1 ? spacing : 0);
  }
  let currentX = cx - totalWidth / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], currentX + ctx.measureText(text[i]).width / 2, y);
    currentX += ctx.measureText(text[i]).width + spacing;
  }
}

function drawGlassEdgeHighlight(ctx) {
  ctx.save();
  // Subtle top-edge glass sheen
  const sheen = ctx.createLinearGradient(LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.x + LAYOUT.card.w, LAYOUT.card.y);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0)");
  sheen.addColorStop(0.2, "rgba(255, 255, 255, 0.12)");
  sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  sheen.addColorStop(0.8, "rgba(255, 255, 255, 0.12)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = sheen;
  ctx.fillRect(LAYOUT.card.x + 30, LAYOUT.card.y + 2, LAYOUT.card.w - 60, 2);
  ctx.restore();
}

function drawDebugOutlines(ctx, s) {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.font = "bold 13px monospace";

  const boxes = [
    { name: "CARD", box: [LAYOUT.card.x, LAYOUT.card.y, LAYOUT.card.w, LAYOUT.card.h], color: "#00FF00" },
    { name: "HEXAGON", box: [337, 470, 350, 360], color: "#FF00FF" },
    { name: "NAME BAR", box: [LAYOUT.nameBar.x, LAYOUT.nameBar.y, LAYOUT.nameBar.w, LAYOUT.nameBar.h], color: "#00FFFF" },
    { name: "TEAM BAR", box: [LAYOUT.teamBar.x, LAYOUT.teamBar.y, LAYOUT.teamBar.w, LAYOUT.teamBar.h], color: "#FFFF00" },
    { name: "ROLE BAR", box: [LAYOUT.roleBarNormal.x, LAYOUT.roleBarNormal.y, LAYOUT.roleBarNormal.w, LAYOUT.roleBarNormal.h], color: "#FFAA00" },
    { name: "WATERMARK L", box: [80, 540, 258, 189], color: "#FF4444" },
    { name: "WATERMARK R", box: [686, 540, 256, 189], color: "#FF4444" },
    { name: "VOLUNTEER", box: [178, 1300, 668, 50], color: "#44FF88" }
  ];

  boxes.forEach(b => {
    ctx.strokeStyle = b.color;
    ctx.fillStyle = b.color;
    ctx.strokeRect(b.box[0], b.box[1], b.box[2], b.box[3]);
    ctx.fillText(b.name, b.box[0] + 6, b.box[1] + 16);
  });

  ctx.restore();
}

// ==========================================
// PREVIEW & EXPORT RENDERING
// ==========================================
function renderPreview() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = LAYOUT.width * dpr;
  const targetH = LAYOUT.height * dpr;

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  drawBadge(ctx, state, { scale: dpr });

  if (state.refMode) {
    updateRefPreview();
  }
}

async function renderExportBlob(exportScale, cardOnly) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = LAYOUT.width * exportScale;
  offCanvas.height = LAYOUT.height * exportScale;
  const offCtx = offCanvas.getContext('2d');

  drawBadge(offCtx, state, { scale: exportScale, cardOnly: cardOnly, debugMode: false });

  return new Promise((resolve) => {
    try {
      offCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    } catch (e) {
      console.warn("toBlob failed at scale " + exportScale, e);
      resolve(null);
    }
  });
}

// ==========================================
// EXPORT & DOWNLOAD WORKFLOW
// ==========================================
async function handleDownload(scaleVal) {
  const requestedScale = parseInt(scaleVal, 10) || state.scale || 3;
  showToast(`Generating badge at ${requestedScale}× resolution...`);

  const scalesToTry = [requestedScale];
  if (requestedScale === 3) scalesToTry.push(2, 1);
  else if (requestedScale === 2) scalesToTry.push(1);

  let successBlob = null;
  let finalScale = requestedScale;

  for (const s of scalesToTry) {
    try {
      const blob = await renderExportBlob(s, state.cardOnly);
      if (blob && blob.size > 0) {
        successBlob = blob;
        finalScale = s;
        break;
      }
    } catch (err) {
      console.warn(`Export at scale ${s} failed:`, err);
    }
  }

  if (!successBlob) {
    showToast("Error generating badge export. Please try a lower resolution.", 4000);
    return;
  }

  // Generate clean filename
  const cleanName = (state.name || "Badge").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `TechnoFun-4.0-Badge-${cleanName}.png`;

  // Trigger download
  const url = URL.createObjectURL(successBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  const scaleNames = { 3: "Ultra HD (3072 × 4608 px)", 2: "HD (2048 × 3072 px)", 1: "Standard (1024 × 1536 px)" };
  showToast(`Downloaded: ${scaleNames[finalScale] || finalScale + '×'}`);

  // Optional Webhook POST
  triggerWebhook();
}

function triggerWebhook() {
  if (!CONFIG.sheetWebhook) return;
  try {
    fetch(CONFIG.sheetWebhook, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        team: state.team,
        type: state.badgeType,
        detail: state.detail,
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.log("Webhook skipped or failed silently", e));
  } catch (e) {
    // Failure must never block download
  }
}

async function handleShare() {
  if (!navigator.share) {
    showToast("Web Share not supported on this browser. Use Download instead.");
    return;
  }

  try {
    const blob = await renderExportBlob(2, state.cardOnly);
    if (!blob) throw new Error("Could not create share image");
    const file = new File([blob], `TechnoFun-4.0-Badge.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "My TechnoFun 4.0 Badge",
        text: captionText.innerText,
        files: [file]
      });
      showToast("Shared successfully!");
    } else {
      await navigator.share({
        title: "My TechnoFun 4.0 Badge",
        text: captionText.innerText
      });
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      showToast("Share cancelled or failed");
    }
  }
}

// ==========================================
// PHOTO PROCESSING & TOUCH / MOUSE CONTROLS
// ==========================================
async function handlePhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast("Please upload a valid image file (PNG, JPG, WebP).");
    return;
  }

  try {
    let imageSource = null;

    // Honor EXIF orientation via createImageBitmap
    if (window.createImageBitmap) {
      try {
        imageSource = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (e) {
        console.warn("createImageBitmap with orientation failed, falling back to standard load", e);
      }
    }

    if (!imageSource) {
      imageSource = await loadStandardImage(file);
    }

    // High resolution check: if either dimension > 6000 px, scale down to 4096 px max
    let naturalW = imageSource.width;
    let naturalH = imageSource.height;

    if (naturalW > 6000 || naturalH > 6000) {
      const maxDim = 4096;
      const factor = Math.min(maxDim / naturalW, maxDim / naturalH);
      const targetW = Math.round(naturalW * factor);
      const targetH = Math.round(naturalH * factor);

      const resizeCanvas = document.createElement('canvas');
      resizeCanvas.width = targetW;
      resizeCanvas.height = targetH;
      const rCtx = resizeCanvas.getContext('2d');
      rCtx.imageSmoothingQuality = 'high';
      rCtx.drawImage(imageSource, 0, 0, targetW, targetH);
      imageSource = resizeCanvas;
      naturalW = targetW;
      naturalH = targetH;
    }

    state.photoSource = imageSource;
    state.photoNaturalWidth = naturalW;
    state.photoNaturalHeight = naturalH;
    state.photoTransform = { zoom: 1.0, panX: 0, panY: 0, flipH: false };

    // Update UI controls
    photoQuickBar.style.display = 'flex';
    photoFineTuneWrap.style.display = 'flex';
    zoomSlider.value = 100;
    zoomVal.innerText = '100%';
    panXSlider.value = 0;
    panYSlider.value = 0;

    renderPreview();
    showToast("Photo loaded and aligned!");
  } catch (err) {
    console.error("Failed to process photo:", err);
    showToast("Failed to process photo. Please try another image.");
  }
}

function loadStandardImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clampPhotoPan() {
  if (!state.photoSource) return;
  const hex = LAYOUT.hex;
  const nw = state.photoNaturalWidth;
  const nh = state.photoNaturalHeight;
  const baseScale = Math.max(hex.w / nw, hex.h / nh);
  const zoom = state.photoTransform.zoom;
  const finalScale = baseScale * zoom;

  const dispW = nw * finalScale;
  const dispH = nh * finalScale;

  const maxPanX = Math.max(0, (dispW - hex.w) / 2);
  const maxPanY = Math.max(0, (dispH - hex.h) / 2);

  state.photoTransform.panX = Math.max(-maxPanX, Math.min(maxPanX, state.photoTransform.panX));
  state.photoTransform.panY = Math.max(-maxPanY, Math.min(maxPanY, state.photoTransform.panY));

  // Sync sliders
  if (maxPanX > 0) {
    panXSlider.value = Math.round((state.photoTransform.panX / maxPanX) * 100);
  } else {
    panXSlider.value = 0;
  }
  if (maxPanY > 0) {
    panYSlider.value = Math.round((state.photoTransform.panY / maxPanY) * 100);
  } else {
    panYSlider.value = 0;
  }
}

function setZoom(newZoom) {
  state.photoTransform.zoom = Math.max(1.0, Math.min(5.0, newZoom));
  zoomSlider.value = Math.round(state.photoTransform.zoom * 100);
  zoomVal.innerText = `${Math.round(state.photoTransform.zoom * 100)}%`;
  clampPhotoPan();
  renderPreview();
}

function nudgePhoto(dx, dy) {
  if (!state.photoSource) return;
  state.photoTransform.panX += dx;
  state.photoTransform.panY += dy;
  clampPhotoPan();
  renderPreview();
}

// ==========================================
// UI EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Badge Type Radio Buttons
  document.querySelectorAll('input[name="badgeType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.badgeType = e.target.value;
      renderChips();
      updateCaption();
      renderPreview();
    });
  });

  // Name Input
  fullNameInput.addEventListener('input', (e) => {
    state.name = e.target.value;
    updateCounts();
    updateCaption();
    renderPreview();
  });

  // Team Input
  teamNameInput.addEventListener('input', (e) => {
    state.team = e.target.value;
    updateCounts();
    updateCaption();
    renderPreview();
  });

  // Custom Detail Input
  customRoleInput.addEventListener('input', (e) => {
    state.detail = e.target.value;
    updateCaption();
    renderPreview();
  });

  // Card Only Checkbox
  cardOnlyCheck.addEventListener('change', (e) => {
    state.cardOnly = e.target.checked;
    renderPreview();
  });

  // Scale Selector
  scaleSelect.addEventListener('change', (e) => {
    state.scale = parseInt(e.target.value, 10);
    const hints = {
      3: "3072 × 4608 px • Ultra HD",
      2: "2048 × 3072 px • HD",
      1: "1024 × 1536 px • Standard"
    };
    downloadResolutionHint.innerText = hints[state.scale] || "";
  });

  // Download Buttons
  downloadPrimaryBtn.addEventListener('click', () => handleDownload(scaleSelect.value));
  mobileDownloadBtn.addEventListener('click', () => handleDownload(scaleSelect.value));

  // Share Button
  shareBtn.addEventListener('click', handleShare);

  // Copy Caption Button
  copyCaptionBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(captionText.innerText).then(() => {
      showToast("Caption copied to clipboard!");
    }).catch(() => {
      showToast("Failed to copy caption");
    });
  });

  // Dropzone & File Input
  dropzone.addEventListener('click', () => photoFileInput.click());
  photoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFile(e.dataTransfer.files[0]);
    }
  });

  // Zoom Controls
  zoomSlider.addEventListener('input', (e) => {
    setZoom(parseInt(e.target.value, 10) / 100);
  });
  zoomInBtn.addEventListener('click', () => setZoom(state.photoTransform.zoom + 0.15));
  zoomOutBtn.addEventListener('click', () => setZoom(state.photoTransform.zoom - 0.15));

  // Nudge Buttons
  nudgeUp.addEventListener('click', () => nudgePhoto(0, -10));
  nudgeDown.addEventListener('click', () => nudgePhoto(0, 10));
  nudgeLeft.addEventListener('click', () => nudgePhoto(-10, 0));
  nudgeRight.addEventListener('click', () => nudgePhoto(10, 0));
  nudgeReset.addEventListener('click', () => {
    state.photoTransform.panX = 0;
    state.photoTransform.panY = 0;
    clampPhotoPan();
    renderPreview();
  });

  // Fine-tune Sliders
  panXSlider.addEventListener('input', (e) => {
    if (!state.photoSource) return;
    const hex = LAYOUT.hex;
    const nw = state.photoNaturalWidth;
    const baseScale = Math.max(hex.w / nw, hex.h / state.photoNaturalHeight);
    const dispW = nw * baseScale * state.photoTransform.zoom;
    const maxPanX = Math.max(0, (dispW - hex.w) / 2);
    state.photoTransform.panX = (parseInt(e.target.value, 10) / 100) * maxPanX;
    renderPreview();
  });

  panYSlider.addEventListener('input', (e) => {
    if (!state.photoSource) return;
    const hex = LAYOUT.hex;
    const nh = state.photoNaturalHeight;
    const baseScale = Math.max(hex.w / state.photoNaturalWidth, hex.h / nh);
    const dispH = nh * baseScale * state.photoTransform.zoom;
    const maxPanY = Math.max(0, (dispH - hex.h) / 2);
    state.photoTransform.panY = (parseInt(e.target.value, 10) / 100) * maxPanY;
    renderPreview();
  });

  // Flip & Reset Buttons
  flipBtn.addEventListener('click', () => {
    state.photoTransform.flipH = !state.photoTransform.flipH;
    renderPreview();
  });

  resetPhotoBtn.addEventListener('click', () => {
    state.photoTransform = { zoom: 1.0, panX: 0, panY: 0, flipH: false };
    zoomSlider.value = 100;
    zoomVal.innerText = '100%';
    panXSlider.value = 0;
    panYSlider.value = 0;
    renderPreview();
  });

  // Reference & Debug Mode Buttons
  refModeBtn.addEventListener('click', () => {
    state.refMode = !state.refMode;
    refModeBtn.classList.toggle('active', state.refMode);
    refCompareBox.style.display = state.refMode ? 'block' : 'none';
    if (state.refMode) {
      setReferenceModeData();
    }
    renderPreview();
  });

  debugModeBtn.addEventListener('click', () => {
    state.debugMode = !state.debugMode;
    debugModeBtn.classList.toggle('active', state.debugMode);
    renderPreview();
  });

  closeRefBoxBtn.addEventListener('click', () => {
    refCompareBox.style.display = 'none';
  });

  // Comparison Tabs
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.compare-view').forEach(v => v.classList.remove('active'));
      e.target.classList.add('active');
      const target = e.target.dataset.tab;
      if (target === 'side-by-side') document.getElementById('sideBySideView').classList.add('active');
      else if (target === 'overlay') document.getElementById('overlayView').classList.add('active');
      else if (target === 'diff') {
        document.getElementById('diffView').classList.add('active');
        updateDiff();
      }
    });
  });

  // Overlay Slider
  overlaySlider.addEventListener('input', (e) => {
    overlayGenMask.style.width = `${e.target.value}%`;
  });

  // Canvas Drag & Pinch & Wheel Interaction
  setupCanvasInteractions();
}

// Canvas Touch & Mouse Drag / Zoom
function setupCanvasInteractions() {
  const container = document.getElementById('canvasContainer');
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialPinchDist = 0;
  let initialZoom = 1.0;

  // Mouse wheel zoom
  container.addEventListener('wheel', (e) => {
    if (!state.photoSource) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(state.photoTransform.zoom + delta);
  }, { passive: false });

  // Mouse drag
  container.addEventListener('mousedown', (e) => {
    if (!state.photoSource) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || !state.photoSource) return;
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = LAYOUT.width / rect.width;
    const dx = (e.clientX - startX) * scaleFactor;
    const dy = (e.clientY - startY) * scaleFactor;
    startX = e.clientX;
    startY = e.clientY;

    state.photoTransform.panX += dx;
    state.photoTransform.panY += dy;
    clampPhotoPan();
    renderPreview();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Drag & Pinch
  container.addEventListener('touchstart', (e) => {
    if (!state.photoSource) return;
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialZoom = state.photoTransform.zoom;
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    if (!state.photoSource) return;
    e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
      const rect = canvas.getBoundingClientRect();
      const scaleFactor = LAYOUT.width / rect.width;
      const dx = (e.touches[0].clientX - startX) * scaleFactor;
      const dy = (e.touches[0].clientY - startY) * scaleFactor;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;

      state.photoTransform.panX += dx;
      state.photoTransform.panY += dy;
      clampPhotoPan();
      renderPreview();
    } else if (e.touches.length === 2) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (initialPinchDist > 0) {
        const factor = currentDist / initialPinchDist;
        setZoom(initialZoom * factor);
      }
    }
  }, { passive: false });

  container.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDist = 0;
  });

  // Keyboard navigation when canvas is focused
  container.setAttribute('tabindex', '0');
  container.addEventListener('keydown', (e) => {
    if (!state.photoSource) return;
    const step = e.shiftKey ? 20 : 5;
    if (e.key === 'ArrowUp') { e.preventDefault(); nudgePhoto(0, -step); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); nudgePhoto(0, step); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); nudgePhoto(-step, 0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nudgePhoto(step, 0); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(state.photoTransform.zoom + 0.1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom(state.photoTransform.zoom - 0.1); }
  });
}

// ==========================================
// FORM CHIPS & CAPTION
// ==========================================
function renderChips() {
  chipChoices.innerHTML = '';
  customRoleWrap.style.display = 'none';

  if (state.badgeType === "Participant") {
    roleBarLabel.innerHTML = 'Event <span class="required">*</span>';
    const list = [...CONFIG.events, "Other…"];
    list.forEach(item => {
      const chip = createChip(item, item === state.detail);
      chipChoices.appendChild(chip);
    });
    if (!CONFIG.events.includes(state.detail)) {
      customRoleWrap.style.display = 'block';
    }
  } else if (state.badgeType === "Volunteer") {
    roleBarLabel.innerHTML = 'Segment <span class="required">*</span>';
    const list = [...CONFIG.segments, "Other…"];
    list.forEach(item => {
      const chip = createChip(item, item === state.detail);
      chipChoices.appendChild(chip);
    });
    if (!CONFIG.segments.includes(state.detail)) {
      customRoleWrap.style.display = 'block';
    }
  } else if (state.badgeType === "Coordinator") {
    roleBarLabel.innerHTML = 'Role <span class="required">*</span>';
    customRoleWrap.style.display = 'block';
    if (!state.detail || CONFIG.events.includes(state.detail) || CONFIG.segments.includes(state.detail)) {
      state.detail = CONFIG.coordinatorDefault;
      customRoleInput.value = state.detail;
    }
  }
}

function createChip(name, isActive) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `chip ${isActive ? 'active' : ''}`;
  btn.innerText = name;

  btn.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    if (name === "Other…") {
      state.isCustomDetail = true;
      customRoleWrap.style.display = 'block';
      customRoleInput.focus();
      state.detail = customRoleInput.value.trim() || "Participant";
    } else {
      state.isCustomDetail = false;
      customRoleWrap.style.display = 'none';
      state.detail = name;
    }
    updateCaption();
    renderPreview();
  });

  return btn;
}

function updateCounts() {
  nameCount.innerText = `${fullNameInput.value.length}/40`;
  teamCount.innerText = `${teamNameInput.value.length}/30`;
}

function updateCaption() {
  const template = CONFIG.captions[state.badgeType] || CONFIG.captions.Participant;
  const detail = state.detail || "Event";
  const hashtags = CONFIG.hashtags.join(" ");

  let cap = template
    .replace("{detail}", detail)
    .replace("{venue}", CONFIG.venue)
    .replace("{hashtags}", hashtags);

  captionText.innerText = cap;
}

function showToast(msg, duration = 3000) {
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ==========================================
// REFERENCE COMPARISON & DIFF CALCULATION
// ==========================================
function updateRefPreview() {
  const dataUrl = canvas.toDataURL('image/png');
  if (genPreviewImg) genPreviewImg.src = dataUrl;
  if (overlayGenImg) overlayGenImg.src = dataUrl;
}

function updateDiff() {
  if (!state.referenceImg || !state.referenceImg.complete) return;

  const diffCtx = diffCanvas.getContext('2d');
  diffCanvas.width = LAYOUT.width;
  diffCanvas.height = LAYOUT.height;

  // Render pure generated 1x canvas
  const genCanvas = document.createElement('canvas');
  genCanvas.width = LAYOUT.width;
  genCanvas.height = LAYOUT.height;
  const gCtx = genCanvas.getContext('2d');
  drawBadge(gCtx, state, { scale: 1, cardOnly: false, debugMode: false });

  // Draw reference to offscreen canvas
  const refCanvas = document.createElement('canvas');
  refCanvas.width = LAYOUT.width;
  refCanvas.height = LAYOUT.height;
  const rCtx = refCanvas.getContext('2d');
  rCtx.drawImage(state.referenceImg, 0, 0, LAYOUT.width, LAYOUT.height);

  const genData = gCtx.getImageData(0, 0, LAYOUT.width, LAYOUT.height);
  const refData = rCtx.getImageData(0, 0, LAYOUT.width, LAYOUT.height);
  const diffImgData = diffCtx.createImageData(LAYOUT.width, LAYOUT.height);

  let totalDiff = 0;
  let count = 0;
  const threshold = 30; // Tolerance for compression artifacts & antialiasing

  for (let i = 0; i < genData.data.length; i += 4) {
    const dr = Math.abs(genData.data[i] - refData.data[i]);
    const dg = Math.abs(genData.data[i + 1] - refData.data[i + 1]);
    const db = Math.abs(genData.data[i + 2] - refData.data[i + 2]);
    const diff = (dr + dg + db) / 3;

    if (diff > threshold) {
      // Highlight mismatch in magenta / red
      diffImgData.data[i] = 255;
      diffImgData.data[i + 1] = 0;
      diffImgData.data[i + 2] = 128;
      diffImgData.data[i + 3] = 255;
      totalDiff++;
    } else {
      // Show subtle dark version of reference
      diffImgData.data[i] = Math.floor(refData.data[i] * 0.25);
      diffImgData.data[i + 1] = Math.floor(refData.data[i + 1] * 0.25);
      diffImgData.data[i + 2] = Math.floor(refData.data[i + 2] * 0.25);
      diffImgData.data[i + 3] = 255;
    }
    count++;
  }

  diffCtx.putImageData(diffImgData, 0, 0);
  const mismatchPercent = ((totalDiff / count) * 100).toFixed(2);
  diffStats.innerText = `Pixel mismatch (>30 threshold): ${mismatchPercent}% (includes background glow & texture variations)`;
}

// Expose key API to window for testing and automation
window.renderExportBlob = renderExportBlob;
window.state = state;
window.drawBadge = drawBadge;
window.setZoom = setZoom;
window.nudgePhoto = nudgePhoto;

// Start application
window.addEventListener('DOMContentLoaded', init);
