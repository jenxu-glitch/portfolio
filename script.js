const spreads = Array.from({ length: 22 }, (_, i) => `./photos/Frame${i + 1}.png`);

// If your browser cannot auto-read ./photos2 directory, add image names here manually.
const workImageNames = [
  "1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png",
  "10.png", "11.png", "12.png", "13.png", "14.png", "15.png", "16.png", "17.png", "18.png",
  "DSC03859 1.png", "DSC04578-2 1.png", "DSC04984 1.png", "DSC04987 1.png", "DSC04992 1.png",
  "DSC05809 1.png", "DSC05843 1.png", "DSC05847 2.png", "DSC05901 1.png", "DSC05920 1.png",
  "DSC05982 1.png", "DSC06680 1.png", "DSC06682 1.png", "DSC06701 1.png", "DSC08212 1.png",
  "DSC08374 1.png", "DSC_9782 1.png"
];
const works = workImageNames.map((name) => `./photos2/${name}`);

const state = {
  index: 0,
  flipping: false,
};

const cache = new Map();

const album = document.getElementById("album");
const currentLeft = document.getElementById("currentLeft");
const currentRight = document.getElementById("currentRight");

const revealNext = document.getElementById("revealNext");
const revealNextLeft = document.getElementById("revealNextLeft");
const revealNextRight = document.getElementById("revealNextRight");

const revealPrev = document.getElementById("revealPrev");
const revealPrevLeft = document.getElementById("revealPrevLeft");
const revealPrevRight = document.getElementById("revealPrevRight");

const turnNext = document.getElementById("turnNext");
const turnNextFront = document.getElementById("turnNextFront");
const turnNextBack = document.getElementById("turnNextBack");

const turnPrev = document.getElementById("turnPrev");
const turnPrevFront = document.getElementById("turnPrevFront");
const turnPrevBack = document.getElementById("turnPrevBack");

const hitLeft = document.getElementById("hitLeft");
const hitRight = document.getElementById("hitRight");
const bookStatus = document.getElementById("bookStatus");
const bookProgress = document.getElementById("bookProgress");

const worksGrid = document.getElementById("worksGrid");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const panelAbout = document.getElementById("panel-about");
const panelWorks = document.getElementById("panel-works");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const lightboxMeta = document.getElementById("lightboxMeta");

let worksOrdered = [];
let activeWorkIndex = -1;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function preload(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
  cache.set(src, p);
  return p;
}

function setSpread(leftImg, rightImg, src) {
  leftImg.src = src;
  rightImg.src = src;
  leftImg.style.objectPosition = "left center";
  rightImg.style.objectPosition = "right center";
}

async function renderBase(index = state.index) {
  const src = spreads[index];
  await preload(src);
  setSpread(currentLeft, currentRight, src);
}

function updateMeta() {
  bookStatus.textContent = `${state.index + 1} / ${spreads.length}`;
  bookProgress.style.width = `${((state.index + 1) / spreads.length) * 100}%`;
}

function updateStacksByRatio(ratio) {
  const left = 4 + ratio * 18;
  const right = 22 - ratio * 18;
  album.style.setProperty("--stack-left", `${left.toFixed(2)}px`);
  album.style.setProperty("--stack-right", `${right.toFixed(2)}px`);
}

function resetLayers() {
  revealNext.classList.remove("active");
  revealPrev.classList.remove("active");

  turnNext.classList.remove("active");
  turnPrev.classList.remove("active");

  turnNext.style.transform = "";
  turnPrev.style.transform = "";

  turnNext.querySelector(".turn-shadow").style.opacity = "";
  turnPrev.querySelector(".turn-shadow").style.opacity = "";
}

function easing(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

async function turnToNext() {
  if (state.flipping) return;
  const targetIndex = state.index + 1;
  if (targetIndex >= spreads.length) return;

  state.flipping = true;

  const fromSrc = spreads[state.index];
  const toSrc = spreads[targetIndex];
  await Promise.all([preload(fromSrc), preload(toSrc)]);

  setSpread(revealNextLeft, revealNextRight, toSrc);
  revealNext.classList.add("active");

  turnNextFront.src = fromSrc;
  turnNextBack.src = toSrc;
  turnNextFront.style.objectPosition = "right center";
  turnNextBack.style.objectPosition = "left center";
  turnNext.style.transform = "rotateY(0deg)";
  turnNext.classList.add("active");

  const duration = 540;
  const start = performance.now();
  const startRatio = state.index / Math.max(spreads.length - 1, 1);
  const endRatio = targetIndex / Math.max(spreads.length - 1, 1);
  const shadow = turnNext.querySelector(".turn-shadow");

  await new Promise((resolve) => {
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const p = easing(t);

      turnNext.style.transform = `rotateY(${-180 * p}deg)`;
      shadow.style.opacity = String(0.16 + Math.sin(Math.PI * p) * 0.75);
      updateStacksByRatio(startRatio + (endRatio - startRatio) * p);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  state.index = targetIndex;
  await renderBase(targetIndex);
  updateMeta();
  updateStacksByRatio(endRatio);
  resetLayers();
  state.flipping = false;
}

async function turnToPrev() {
  if (state.flipping) return;
  const targetIndex = state.index - 1;
  if (targetIndex < 0) return;

  state.flipping = true;

  const fromSrc = spreads[state.index];
  const toSrc = spreads[targetIndex];
  await Promise.all([preload(fromSrc), preload(toSrc)]);

  setSpread(revealPrevLeft, revealPrevRight, toSrc);
  revealPrev.classList.add("active");

  turnPrevFront.src = fromSrc;
  turnPrevBack.src = toSrc;
  turnPrevFront.style.objectPosition = "left center";
  turnPrevBack.style.objectPosition = "right center";
  turnPrev.style.transform = "rotateY(0deg)";
  turnPrev.classList.add("active");

  const duration = 540;
  const start = performance.now();
  const startRatio = state.index / Math.max(spreads.length - 1, 1);
  const endRatio = targetIndex / Math.max(spreads.length - 1, 1);
  const shadow = turnPrev.querySelector(".turn-shadow");

  await new Promise((resolve) => {
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const p = easing(t);

      turnPrev.style.transform = `rotateY(${180 * p}deg)`;
      shadow.style.opacity = String(0.16 + Math.sin(Math.PI * p) * 0.75);
      updateStacksByRatio(startRatio + (endRatio - startRatio) * p);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  state.index = targetIndex;
  await renderBase(targetIndex);
  updateMeta();
  updateStacksByRatio(endRatio);
  resetLayers();
  state.flipping = false;
}

function setupTabs() {
  const switchPanel = (name) => {
    const aboutOn = name === "about";
    panelAbout.hidden = !aboutOn;
    panelWorks.hidden = aboutOn;

    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.panel === name);
    });
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
  });
}

function openLightbox(src, alt) {
  const found = worksOrdered.indexOf(src);
  activeWorkIndex = found;
  lightboxImage.src = src;
  lightboxImage.alt = alt;
  lightboxMeta.textContent = found >= 0 ? `${found + 1} / ${worksOrdered.length}` : "";
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
  lightboxMeta.textContent = "";
  activeWorkIndex = -1;
  document.body.style.overflow = "";
}

function showLightboxByIndex(index) {
  if (worksOrdered.length === 0) return;
  const i = (index + worksOrdered.length) % worksOrdered.length;
  activeWorkIndex = i;
  const src = worksOrdered[i];
  lightboxImage.src = src;
  lightboxImage.alt = `作品 ${i + 1}`;
  lightboxMeta.textContent = `${i + 1} / ${worksOrdered.length}`;
}

function renderWorks() {
  // Layout-first order: interleave head/tail so it is not folder-sequential.
  const ordered = [];
  let l = 0;
  let r = works.length - 1;
  while (l <= r) {
    ordered.push(works[l]);
    if (r !== l) ordered.push(works[r]);
    l += 1;
    r -= 1;
  }
  worksOrdered = ordered;

  const frag = document.createDocumentFragment();
  ordered.forEach((src, i) => {
    const card = document.createElement("figure");
    card.className = "work-item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = `作品 ${i + 1}`;
    img.loading = i < 6 ? "eager" : "lazy";
    img.decoding = "async";

    card.appendChild(img);
    card.addEventListener("click", () => {
      openLightbox(src, img.alt);
      activeWorkIndex = i;
      lightboxMeta.textContent = `${i + 1} / ${worksOrdered.length}`;
    });
    frag.appendChild(card);
  });

  worksGrid.appendChild(frag);
}

function bindEvents() {
  hitRight.addEventListener("click", turnToNext);
  hitLeft.addEventListener("click", turnToPrev);

  window.addEventListener("keydown", (e) => {
    if (!lightbox.hidden) {
      if (e.key === "ArrowRight") showLightboxByIndex(activeWorkIndex + 1);
      if (e.key === "ArrowLeft") showLightboxByIndex(activeWorkIndex - 1);
      if (e.key === "Escape") closeLightbox();
      return;
    }
    if (e.key === "ArrowRight") turnToNext();
    if (e.key === "ArrowLeft") turnToPrev();
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showLightboxByIndex(activeWorkIndex - 1));
  lightboxNext.addEventListener("click", () => showLightboxByIndex(activeWorkIndex + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

async function init() {
  await renderBase(0);
  updateMeta();
  updateStacksByRatio(0);
  resetLayers();

  renderWorks();
  setupTabs();
  bindEvents();

  spreads.forEach((src) => preload(src));
}

init();


