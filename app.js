/**
 * TechnoFun 4.0 — ID Badge Generator
 * Exactly reproduces the official reference design and fields.
 */

'use strict';

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  eventName: "TechnoFun 4.0",
  date: "25 Nov 2026",
  venue: "The Shaikh Ayaz University, Shikarpur",
  hashtags: ["#TechnoFun4", "#InnovateCompeteCelebrate", "#SAUShikarpur"],
  lanyardAssetPath: "assets/badge-lanyard.png",
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
  }
};

// ==========================================
// STATE — Matches reference image by default
// ==========================================
const state = {
  name: "Your Name Here",
  team: "Your Team Name",
  role: "Your Role Here",
  badgeTitle: "VOLUNTEER",
  photoSource: null,
  photoNaturalWidth: 0,
  photoNaturalHeight: 0,
  photoTransform: {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    flipH: false
  },
  cardOnly: false,
  debugMode: false,
  scale: 3,
  lanyardImg: null,
  fontsLoaded: false
};

// Logical Coordinate Space (1024 × 1536)
const LAYOUT = {
  width: 1024,
  height: 1536,
  card: { x: 70, y: 120, w: 883, h: 1325, r: 48 },
  hex: {
    cx: 512,
    cy: 650,
    w: 404,
    h: 416,
    vertices: [
      { x: 512, y: 442 }, // Top
      { x: 714, y: 546 }, // Top-Right
      { x: 714, y: 754 }, // Bottom-Right
      { x: 512, y: 858 }, // Bottom
      { x: 310, y: 754 }, // Bottom-Left
      { x: 310, y: 546 }  // Top-Left
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
const roleInput = document.getElementById('roleInput');
const badgeTitleInput = document.getElementById('badgeTitleInput');
const nameCount = document.getElementById('nameCount');
const teamCount = document.getElementById('teamCount');
const roleCount = document.getElementById('roleCount');
const photoQuickBar = document.getElementById('photoQuickBar');
const photoHint = document.getElementById('photoHint');
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
const cardOnlyCheck = document.getElementById('cardOnlyCheck');
const downloadPrimaryBtn = document.getElementById('downloadPrimaryBtn');
const mobileDownloadBtn = document.getElementById('mobileDownloadBtn');
const toast = document.getElementById('toast');
const debugModeBtn = document.getElementById('debugModeBtn');
const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
const titlePills = document.querySelectorAll('.title-pill');

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  parseUrlParams();
  setupEventListeners();
  loadAssets();
  await loadFonts();
  renderPreview();
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    state.debugMode = true;
    debugModeBtn.classList.add('active');
  }
}

function loadAssets() {
  const lanyard = new Image();
  lanyard.src = CONFIG.lanyardAssetPath;
  lanyard.onload = () => {
    state.lanyardImg = lanyard;
    renderPreview();
  };
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('800 italic 54px Poppins'),
      document.fonts.load('700 52px Poppins'),
      document.fonts.load('600 38px Poppins'),
      document.fonts.load('300 56px Poppins'),
      document.fonts.load('180px Anton'),
      document.fonts.load('500 13px Inter')
    ]);
    state.fontsLoaded = true;
  } catch (e) {
    console.warn("Fonts loading fallback", e);
    state.fontsLoaded = true;
  }
}

// ==========================================
// BADGE RENDERER (1024 × 1536 Logical Space)
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

    // Lanyard Strap (behind card)
    drawLanyardAndClip(targetCtx, s);
  }

  // 2. Card Drop Shadow
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

  // 3. Card Body & Inner Content (clipped)
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

  // Bottom Label ("VOLUNTEER" / custom title), Flank Lines & Footer
  drawBottomSection(targetCtx, s);

  // Glass edge top sheen
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
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(260, 0);
  ctx.lineTo(0, 260);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(LAYOUT.width, LAYOUT.height - 300);
  ctx.lineTo(LAYOUT.width, LAYOUT.height);
  ctx.lineTo(LAYOUT.width - 300, LAYOUT.height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawLanyardAndClip(ctx, s) {
  if (s.lanyardImg && s.lanyardImg.complete) {
    ctx.drawImage(s.lanyardImg, LAYOUT.lanyard.x, LAYOUT.lanyard.y, LAYOUT.lanyard.w, LAYOUT.lanyard.h);
    return;
  }

  // Procedural fallback strap
  ctx.save();
  const strapGrad = ctx.createLinearGradient(418, 0, 606, 0);
  strapGrad.addColorStop(0, "#121215");
  strapGrad.addColorStop(0.5, "#222228");
  strapGrad.addColorStop(1, "#121215");
  ctx.fillStyle = strapGrad;
  ctx.fillRect(418, 0, 188, 160);

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
  if (s.lanyardImg && s.lanyardImg.complete) return;

  // Procedural Clip
  ctx.save();
  const clipX = 396;
  const clipY = 128;
  const clipW = 232;
  const clipH = 89;
  const r = 16;

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

  // Top-Left Violet Accent Band
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

  // Left-Edge Accent Panel (y=710..870)
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

  // Right-Edge Glowing Panel (y=770..905)
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

  // Lower-Right Diagonal Stripe (y=1090..1200)
  ctx.beginPath();
  ctx.moveTo(LAYOUT.card.x + LAYOUT.card.w, 1090);
  ctx.lineTo(LAYOUT.card.x + LAYOUT.card.w - 120, 1200);
  ctx.strokeStyle = "rgba(123, 87, 255, 0.4)";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Bottom-Right Corner Accent (y=1270..1445)
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

  // Top-Right concentric arcs
  for (let i = 0; i < 5; i++) {
    const offset = i * 28;
    ctx.beginPath();
    ctx.moveTo(700 + offset * 0.8, 120);
    ctx.bezierCurveTo(760 + offset, 200, 840 + offset, 240, 950, 240 + offset * 0.6);
    ctx.stroke();
  }

  // Bottom-Left concentric arcs
  for (let i = 0; i < 4; i++) {
    const offset = i * 24;
    ctx.beginPath();
    ctx.moveTo(70, 1200 + offset * 0.8);
    ctx.bezierCurveTo(130 + offset, 1230, 180 + offset, 1270, 240 + offset * 0.8, 1330);
    ctx.stroke();
  }

  // Circuit trace details
  ctx.strokeStyle = "rgba(109, 74, 255, 0.25)";
  ctx.fillStyle = "rgba(157, 123, 255, 0.5)";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(270, 750);
  ctx.lineTo(315, 750);
  ctx.lineTo(330, 765);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(270, 750, 3, 0, Math.PI * 2);
  ctx.fill();

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
  const baselineY = 236;

  // 1. "Techno" in heavy italic sans with white-to-silver gradient
  ctx.font = "italic 800 58px Poppins, sans-serif";
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

  // 3. "4.0" placed below "Fun" at lower right
  ctx.font = "italic 800 36px Poppins, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("4.0", 418, 268);

  // 4. Orbit arc above "Techno"
  ctx.beginPath();
  ctx.moveTo(145, 200);
  ctx.quadraticCurveTo(230, 155, 345, 172);
  ctx.strokeStyle = "rgba(167, 133, 255, 0.85)";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 5. Four-point sparkle star at orbit end
  drawSparkleStar(ctx, 345, 172, 9, 3.5, "#D6C2FF");

  // 6. Subtitle "Innovate • Compete • Celebrate"
  const subY = 276;
  ctx.font = "500 13px Inter, Poppins, sans-serif";
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
  ctx.beginPath();
  ctx.moveTo(lineX, 162);
  ctx.lineTo(lineX, 258);
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

  let leftWord = "TEAM";
  let rightWord = "NAME";

  const teamInput = (s.team || "").trim().toUpperCase();

  if (teamInput === "YOUR TEAM NAME") {
    leftWord = "TEAM";
    rightWord = "NAME";
  } else if (!teamInput) {
    leftWord = "TECHNO";
    rightWord = "FUN";
  } else {
    const words = teamInput.split(/\s+/);
    if (words.length > 1) {
      leftWord = words[0];
      rightWord = words.slice(1).join(" ");
    } else {
      const w = words[0];
      const mid = Math.ceil(w.length / 2);
      leftWord = w.slice(0, mid);
      rightWord = w.slice(mid);
    }
  }

  ctx.font = "180px Anton, Impact, sans-serif";
  ctx.fillStyle = CONFIG.colors.watermark;
  ctx.textBaseline = "middle";

  const maxSideWidth = 220;
  const leftTargetX = 302;
  const rightTargetX = 722;
  const centerY = 642;

  let fontSize = 180;
  ctx.font = `${fontSize}px Anton, Impact, sans-serif`;
  let wLeft = ctx.measureText(leftWord).width;
  let wRight = ctx.measureText(rightWord).width;
  const maxW = Math.max(wLeft, wRight);

  if (maxW > maxSideWidth) {
    fontSize = Math.floor(fontSize * (maxSideWidth / maxW));
    fontSize = Math.max(48, fontSize);
    ctx.font = `${fontSize}px Anton, Impact, sans-serif`;
  }

  ctx.textAlign = "right";
  ctx.fillText(leftWord, leftTargetX, centerY);

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

  // Inner Border (2px #8B6BF9)
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

  // Bevel Highlights
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(235, 225, 255, 0.75)";
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(hex.vertices[5].x, hex.vertices[5].y);
  ctx.lineTo(hex.vertices[0].x, hex.vertices[0].y);
  ctx.stroke();

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
  ctx.fillStyle = "#B8B8BA";
  ctx.fillRect(hex.cx - hex.w / 2, hex.cy - hex.h / 2, hex.w, hex.h);

  ctx.fillStyle = "#424245";

  // Head
  ctx.beginPath();
  ctx.arc(hex.cx, hex.cy - 76, 45, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders & Torso
  ctx.beginPath();
  ctx.moveTo(hex.cx - 36, hex.cy - 20);
  ctx.bezierCurveTo(hex.cx - 100, hex.cy + 12, hex.cx - 145, hex.cy + 95, hex.cx - 156, hex.cy + 180);
  ctx.lineTo(hex.cx + 156, hex.cy + 180);
  ctx.bezierCurveTo(hex.cx + 145, hex.cy + 95, hex.cx + 100, hex.cy + 12, hex.cx + 36, hex.cy - 20);
  ctx.closePath();
  ctx.fill();
}

function drawUserPhoto(ctx, s, hex) {
  const img = s.photoSource;
  const nw = s.photoNaturalWidth || img.width;
  const nh = s.photoNaturalHeight || img.height;

  const baseScale = Math.max(hex.w / nw, hex.h / nh);
  const zoom = Math.max(1.0, Math.min(5.0, s.photoTransform.zoom || 1.0));
  const finalScale = baseScale * zoom;

  const dispW = nw * finalScale;
  const dispH = nh * finalScale;

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

  // Name text centered in content area
  const rawName = (s.name || "").trim() || "Your Name Here";
  drawAutoFitText(ctx, {
    text: rawName,
    startX: 552,
    baselineY: 957,
    maxWidth: 590,
    baseSize: 52,
    minSize: 24,
    fontFamily: "Poppins, sans-serif",
    fontWeight: "700",
    color: "#FFFFFF",
    align: "center"
  });

  // 2. Team Bar (Shows if team is present, collapses if empty)
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

    // Label "Team:" centered in content area
    ctx.save();
    ctx.font = "600 18px Poppins, sans-serif";
    ctx.fillStyle = "#9E7BFF";
    ctx.textAlign = "center";
    ctx.fillText("Team:", 545, 1068);
    ctx.restore();

    // Value "Your Team Name" centered in content area
    drawAutoFitText(ctx, {
      text: s.team.trim(),
      startX: 545,
      baselineY: 1106,
      maxWidth: 510,
      baseSize: 38,
      minSize: 18,
      fontFamily: "Poppins, sans-serif",
      fontWeight: "600",
      color: "#FFFFFF",
      align: "center"
    });
  } else {
    roleBarPos = LAYOUT.roleBarShifted;
  }

  // 3. Role Bar
  drawHexagonalBar(ctx, roleBarPos, "#5F3DDB", "#08080A");
  drawBriefcaseIcon(ctx, 230, roleBarPos.y + roleBarPos.h / 2, "#CCCCCC");

  // Vertical violet divider
  ctx.strokeStyle = "#6E48FF";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(268, roleBarPos.y + 13);
  ctx.lineTo(268, roleBarPos.y + roleBarPos.h - 13);
  ctx.stroke();

  // Label "Role:" centered in content area
  ctx.save();
  ctx.font = "600 18px Poppins, sans-serif";
  ctx.fillStyle = "#9E7BFF";
  ctx.textAlign = "center";
  ctx.fillText("Role:", 545, roleBarPos.y + 33);
  ctx.restore();

  // Value "Your Role Here" centered in content area
  const rawRole = (s.role || "").trim() || "Your Role Here";
  drawAutoFitText(ctx, {
    text: rawRole,
    startX: 545,
    baselineY: roleBarPos.y + 71,
    maxWidth: 510,
    baseSize: 38,
    minSize: 18,
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    color: "#FFFFFF",
    align: "center"
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

  ctx.textAlign = opts.align || "left";
  ctx.fillStyle = opts.color;
  ctx.fillText(opts.text, opts.startX, opts.baselineY);
  ctx.restore();
}

function drawPersonIcon(ctx, cx, cy, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 11, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.beginPath();
  ctx.arc(cx, cy - 11, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 15);
  ctx.bezierCurveTo(cx - 14, cy + 1, cx - 7, cy - 1, cx, cy - 1);
  ctx.bezierCurveTo(cx + 7, cy - 1, cx + 14, cy + 1, ctx.cx + 14, cy + 15);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - 16, cy - 8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 14);
  ctx.bezierCurveTo(cx - 24, cy + 3, cx - 18, cy + 2, cx - 14, cy + 5);
  ctx.lineTo(cx - 14, cy + 14);
  ctx.closePath();
  ctx.fill();

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

  ctx.beginPath();
  ctx.roundRect(cx - 10, cy - 16, 20, 10, 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(cx - 19, cy - 8, 38, 24, 4);
  ctx.fill();

  ctx.fillStyle = "#08080A";
  ctx.fillRect(cx - 19, cy + 1, 38, 2);

  ctx.fillStyle = color;
  ctx.fillRect(cx - 3, cy - 1, 6, 6);

  ctx.restore();
}

function drawBottomSection(ctx, s) {
  ctx.save();

  const titleText = (s.badgeTitle || "VOLUNTEER").trim().toUpperCase();
  ctx.font = "300 56px Poppins, sans-serif";
  ctx.fillStyle = "#E2E2E6";
  ctx.textAlign = "center";
  
  if (ctx.letterSpacing !== undefined) {
    ctx.letterSpacing = "22px";
    ctx.fillText(titleText, 512, LAYOUT.volunteerY);
    ctx.letterSpacing = "0px";
  } else {
    drawLetterSpacedText(ctx, titleText, 512, LAYOUT.volunteerY, 22);
  }

  // Flanking horizontal lines
  ctx.strokeStyle = "#7954F0";
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.moveTo(178, 1332);
  ctx.lineTo(269, 1332);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(755, 1332);
  ctx.lineTo(846, 1332);
  ctx.stroke();

  // Footer text
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
    { name: "BOTTOM TITLE", box: [178, 1300, 668, 50], color: "#44FF88" }
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
async function handleDownload() {
  const requestedScale = 3;
  showToast("Rendering Ultra HD badge (3072 × 4608 px)...");

  const scalesToTry = [3, 2, 1];
  let successBlob = null;
  let finalScale = 3;

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
    showToast("Error generating badge export. Please try again.", 4000);
    return;
  }

  const cleanName = (state.name || "Badge").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `TechnoFun-4.0-Badge-${cleanName}.png`;

  const url = URL.createObjectURL(successBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  const scaleNames = { 3: "Ultra HD (3072 × 4608 px)", 2: "HD (2048 × 3072 px)", 1: "Standard (1024 × 1536 px)" };
  showToast(`Downloaded: ${scaleNames[finalScale]}`);
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

    if (window.createImageBitmap) {
      try {
        imageSource = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (e) {
        console.warn("createImageBitmap failed, using fallback", e);
      }
    }

    if (!imageSource) {
      imageSource = await loadStandardImage(file);
    }

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

    photoQuickBar.style.display = 'flex';
    photoHint.style.display = 'flex';
    zoomSlider.value = 100;
    zoomVal.innerText = '100%';

    renderPreview();
    showToast("Photo loaded and fitted to hexagon!");
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
  // Full Name
  fullNameInput.addEventListener('input', (e) => {
    state.name = e.target.value;
    nameCount.innerText = `${e.target.value.length}/40`;
    renderPreview();
  });

  // Team Name
  teamNameInput.addEventListener('input', (e) => {
    state.team = e.target.value;
    teamCount.innerText = `${e.target.value.length}/30`;
    renderPreview();
  });

  // Role
  roleInput.addEventListener('input', (e) => {
    state.role = e.target.value;
    roleCount.innerText = `${e.target.value.length}/35`;
    renderPreview();
  });

  // Badge Title (Bottom Text)
  badgeTitleInput.addEventListener('input', (e) => {
    state.badgeTitle = e.target.value;
    updateTitlePillHighlight(e.target.value);
    renderPreview();
  });

  // Quick Title Pills
  titlePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const title = pill.dataset.title;
      badgeTitleInput.value = title;
      state.badgeTitle = title;
      updateTitlePillHighlight(title);
      renderPreview();
    });
  });

  // Reset to Defaults (Reference Design)
  resetDefaultsBtn.addEventListener('click', () => {
    state.name = "Your Name Here";
    state.team = "Your Team Name";
    state.role = "Your Role Here";
    state.badgeTitle = "VOLUNTEER";
    state.photoSource = null;

    fullNameInput.value = state.name;
    teamNameInput.value = state.team;
    roleInput.value = state.role;
    badgeTitleInput.value = state.badgeTitle;
    nameCount.innerText = "14/40";
    teamCount.innerText = "14/30";
    roleCount.innerText = "14/35";

    photoQuickBar.style.display = 'none';
    photoHint.style.display = 'none';
    updateTitlePillHighlight(state.badgeTitle);
    renderPreview();
    showToast("Reset to reference design values");
  });

  // Card Only Checkbox
  cardOnlyCheck.addEventListener('change', (e) => {
    state.cardOnly = e.target.checked;
    renderPreview();
  });

  // Download Buttons
  downloadPrimaryBtn.addEventListener('click', handleDownload);
  mobileDownloadBtn.addEventListener('click', handleDownload);

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

  // Flip & Reset Buttons
  flipBtn.addEventListener('click', () => {
    state.photoTransform.flipH = !state.photoTransform.flipH;
    renderPreview();
  });

  resetPhotoBtn.addEventListener('click', () => {
    state.photoTransform = { zoom: 1.0, panX: 0, panY: 0, flipH: false };
    zoomSlider.value = 100;
    zoomVal.innerText = '100%';
    renderPreview();
  });

  // Debug Outlines
  debugModeBtn.addEventListener('click', () => {
    state.debugMode = !state.debugMode;
    debugModeBtn.classList.toggle('active', state.debugMode);
    renderPreview();
  });

  // Canvas Drag & Pinch & Wheel Interaction
  setupCanvasInteractions();
}

function updateTitlePillHighlight(currentTitle) {
  titlePills.forEach(p => {
    p.classList.toggle('active', p.dataset.title === currentTitle.toUpperCase());
  });
}

function setupCanvasInteractions() {
  const container = document.getElementById('canvasContainer');
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialPinchDist = 0;
  let initialZoom = 1.0;

  container.addEventListener('wheel', (e) => {
    if (!state.photoSource) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(state.photoTransform.zoom + delta);
  }, { passive: false });

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

function showToast(msg, duration = 3000) {
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Window API for test suite
window.renderExportBlob = renderExportBlob;
window.state = state;
window.drawBadge = drawBadge;
window.setZoom = setZoom;
window.nudgePhoto = nudgePhoto;

window.addEventListener('DOMContentLoaded', init);
