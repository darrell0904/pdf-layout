// 主应用：状态、UI 渲染、PDF 加载、画布渲染、导出
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const state = {
  pageImages: [],
  pageCanvases: [],
  bgColor: "#f5f1e8",
  accentColor: "#1a1a1a",
  layout: "stack",
  slotCount: 2,
  assignments: [],   // assignments[i] = pageIndex
};

// ---------- 工具 ----------
const $ = (id) => document.getElementById(id);
const rgbToHex = (r,g,b) => "#" + [r,g,b].map(v => v.toString(16).padStart(2,"0")).join("");
function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
function getLayout() { return LAYOUTS.find(L => L.id === state.layout); }
function getCurrentSlotCount() {
  const L = getLayout();
  return L.fixedCount || state.slotCount;
}

// ---------- 画布尺寸 ----------
function getCanvasSize() {
  const [rw, rh] = $("ratio").value.split(":").map(Number);
  const longSide = parseInt($("quality").value, 10);
  if (rh >= rw) return { W: Math.round(longSide * rw / rh), H: longSide };
  return { W: longSide, H: Math.round(longSide * rh / rw) };
}

// ---------- 排布选择 UI ----------
function renderLayouts() {
  const c = $("layouts");
  c.innerHTML = "";
  LAYOUTS.forEach(L => {
    const el = document.createElement("div");
    el.className = "layout-card" + (L.id === state.layout ? " active" : "");
    el.innerHTML = `
      <div class="layout-preview">${L.preview}</div>
      <div class="layout-name">${L.name}</div>
      <div class="layout-desc">${L.desc}</div>`;
    el.onclick = () => {
      state.layout = L.id;
      const L2 = getLayout();
      state.slotCount = L2.fixedCount || L2.defaultCount || 3;
      $("slotcount").value = state.slotCount;
      $("slotcount-wrap").style.display = L2.fixedCount ? "none" : "";
      autoAssign();
      renderLayouts();
      renderSlots();
    };
    c.appendChild(el);
  });
}

// ---------- 槽位分配 ----------
function autoAssign() {
  const n = getCurrentSlotCount();
  const pn = state.pageImages.length;
  state.assignments = [];
  for (let i=0;i<n;i++) state.assignments.push(pn > 0 ? (i % pn) : 0);
}

function renderSlots() {
  const grid = $("slots-grid");
  grid.innerHTML = "";
  const hint = $("slot-hint");
  if (!state.pageImages.length) { hint.textContent = "请先上传 PDF"; return; }
  hint.textContent = `共 ${getCurrentSlotCount()} 个槽位 · ${state.pageImages.length} 页可选`;

  const L = getLayout();
  const n = getCurrentSlotCount();
  for (let i=0;i<n;i++) {
    const pageIdx = state.assignments[i] ?? 0;
    const card = document.createElement("div");
    card.className = "slot-card";
    const label = L.slotLabel ? L.slotLabel(i) : `槽位 ${i+1}`;
    const options = state.pageImages.map((_, p) =>
      `<option value="${p}" ${p === pageIdx ? "selected" : ""}>第 ${p+1} 页</option>`
    ).join("");
    card.innerHTML = `
      <div class="slot-label"><b>${label}</b><span>#${i+1}</span></div>
      <img class="slot-thumb" src="${state.pageImages[pageIdx]?.src || ""}" />
      <select data-slot="${i}">${options}</select>`;
    card.querySelector("select").addEventListener("change", (e) => {
      const s = parseInt(e.target.dataset.slot, 10);
      const v = parseInt(e.target.value, 10);
      state.assignments[s] = v;
      card.querySelector(".slot-thumb").src = state.pageImages[v].src;
    });
    grid.appendChild(card);
  }
}

// ---------- PDF 加载 ----------
$("pdf-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const status = $("upload-status");
  status.textContent = "解析中…"; status.classList.remove("err");
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [], canvases = [];
    for (let i=1; i<=pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 });
      const cv = document.createElement("canvas");
      cv.width = viewport.width; cv.height = viewport.height;
      const cctx = cv.getContext("2d");
      await page.render({ canvasContext: cctx, viewport }).promise;
      canvases.push(cv);
      const img = new Image();
      img.src = cv.toDataURL("image/png");
      await new Promise(r => img.onload = r);
      pages.push(img);
    }
    state.pageImages = pages;
    state.pageCanvases = canvases;
    $("download-bg-btn").disabled = false;
    extractThemeColors(canvases[0]);
    renderThumbs();
    const L = getLayout();
    state.slotCount = L.fixedCount || L.defaultCount || 3;
    $("slotcount").value = state.slotCount;
    $("slotcount-wrap").style.display = L.fixedCount ? "none" : "";
    autoAssign();
    renderSlots();
    status.textContent = `已加载 ${pages.length} 页，主题色 ${state.bgColor}`;
    $("render-btn").disabled = false;
    $("download-all-btn").disabled = false;
  } catch (err) {
    console.error(err);
    status.textContent = "解析失败：" + err.message;
    status.classList.add("err");
  }
});

function renderThumbs() {
  const g = $("pages-grid");
  g.innerHTML = "";
  state.pageImages.forEach((img, i) => {
    const wrap = document.createElement("div");
    wrap.className = "thumb";
    wrap.innerHTML = `<img src="${img.src}" title="第 ${i+1} 页" /><span class="idx">第 ${i+1} 页</span>`;
    g.appendChild(wrap);
  });
}

function extractThemeColors(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const pts = [[0,0],[w-1,0],[0,h-1],[w-1,h-1],[w/2|0,0],[w/2|0,h-1],[0,h/2|0],[w-1,h/2|0]];
  const samples = pts.map(([x,y]) => {
    const d = ctx.getImageData(x,y,1,1).data;
    return [d[0],d[1],d[2]];
  });
  const bg = samples.reduce((a,b) => (a[0]+a[1]+a[2] > b[0]+b[1]+b[2] ? a : b));
  state.bgColor = rgbToHex(bg[0],bg[1],bg[2]);
  const step = 40;
  let dark = [0,0,0], dmin = 999;
  for (let y=0;y<h;y+=step) for (let x=0;x<w;x+=step) {
    const d = ctx.getImageData(x,y,1,1).data;
    const l = d[0]+d[1]+d[2];
    if (l < dmin) { dmin = l; dark = [d[0],d[1],d[2]]; }
  }
  state.accentColor = rgbToHex(dark[0],dark[1],dark[2]);
}

// ---------- 画布绘制 ----------
function drawCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, tr = w / h;
  let sx, sy, sw, sh;
  if (ir > tr) { sh = img.height; sw = sh * tr; sx = (img.width - sw)/2; sy = 0; }
  else { sw = img.width; sh = sw / tr; sx = 0; sy = (img.height - sh)/2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function drawIntoSlot(ctx, img, s) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = Math.max(10, s.w * 0.015);
  ctx.shadowOffsetY = Math.max(3, s.w * 0.006);
  if (s.mode === 'cover') {
    if (s.radius) { roundRectPath(ctx, s.x, s.y, s.w, s.h, s.radius); ctx.clip(); }
    drawCover(ctx, img, s.x, s.y, s.w, s.h);
  } else {
    const ir = img.width / img.height, tr = s.w / s.h;
    let dw, dh;
    if (ir > tr) { dw = s.w; dh = s.w / ir; }
    else { dh = s.h; dw = s.h * ir; }
    const dx = s.x + (s.w - dw)/2, dy = s.y + (s.h - dh)/2;
    if (s.radius) { roundRectPath(ctx, dx, dy, dw, dh, s.radius); ctx.clip(); }
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
}

function drawBackground(ctx, W, H, blur, bgSource) {
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0,0,W,H);
  if (blur > 0 && bgSource === "auto" && state.pageImages[0]) {
    ctx.save();
    ctx.filter = `blur(${blur}px) saturate(1.1)`;
    drawCover(ctx, state.pageImages[0], -blur, -blur, W + blur*2, H + blur*2);
    ctx.restore();
    ctx.fillStyle = hexToRgba(state.bgColor, 0.55);
    ctx.fillRect(0,0,W,H);
  }
}

async function renderPreview() {
  if (!state.pageImages.length) throw new Error("请先上传 PDF");
  const { W, H } = getCanvasSize();
  const blur = parseInt($("blur").value, 10);
  const bgSource = $("bg-source").value;
  const padPct = parseFloat($("padding").value);
  const gapPct = parseFloat($("gap").value);
  const gapXRaw = $("gap-x").value;
  const gapXPct = gapXRaw === "auto" ? gapPct : parseFloat(gapXRaw);

  const cv = $("preview");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

  drawBackground(ctx, W, H, blur, bgSource);

  const L = getLayout();
  const n = getCurrentSlotCount();
  const opts = {
    pad: Math.round(Math.min(W,H) * padPct),
    gap: Math.round(Math.min(W,H) * gapPct),
    gapX: Math.round(Math.min(W,H) * gapXPct),
  };
  const slots = L.getSlots(W, H, opts, n);

  for (let i = 0; i < slots.length; i++) {
    const pageIdx = state.assignments[i] ?? (i % state.pageImages.length);
    const img = state.pageImages[pageIdx];
    if (!img) continue;
    drawIntoSlot(ctx, img, slots[i]);
  }

  cv.style.display = "block";
  $("empty-hint").style.display = "none";
}

// ---------- 事件绑定 ----------
$("slotcount").addEventListener("input", (e) => {
  const L = getLayout();
  let v = parseInt(e.target.value, 10) || 1;
  if (L.minCount) v = Math.max(L.minCount, v);
  if (L.maxCount) v = Math.min(L.maxCount, v);
  state.slotCount = v;
  autoAssign();
  renderSlots();
});

$("auto-assign").addEventListener("click", () => { autoAssign(); renderSlots(); });

$("render-btn").addEventListener("click", async () => {
  const st = $("render-status");
  st.textContent = "渲染中…"; st.classList.remove("err");
  try {
    await renderPreview();
    st.textContent = "已生成，可下载";
    $("download-btn").disabled = false;
  } catch (err) {
    console.error(err);
    st.textContent = "渲染失败：" + err.message;
    st.classList.add("err");
  }
});

$("download-all-btn").addEventListener("click", async () => {
  const btn = $("download-all-btn");
  const status = $("upload-status");
  if (!state.pageCanvases.length) return;
  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = "打包中…";
  try {
    const zip = new JSZip();
    for (let i = 0; i < state.pageCanvases.length; i++) {
      const blob = await new Promise(r => state.pageCanvases[i].toBlob(r, "image/png"));
      zip.file(`page-${String(i+1).padStart(2,"0")}.png`, blob);
      btn.textContent = `打包中… ${i+1}/${state.pageCanvases.length}`;
    }
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `pdf-images-${Date.now()}.zip`;
    a.click();
    status.textContent = `已导出 ${state.pageCanvases.length} 张图片`;
  } catch (err) {
    console.error(err);
    status.textContent = "打包失败：" + err.message;
    status.classList.add("err");
  } finally {
    btn.textContent = oldText;
    btn.disabled = false;
  }
});

$("clean-watermark-btn").addEventListener("click", () => {
  window.open("https://www.slidedeckcleaner.com/zh", "_blank", "noopener");
  const status = $("upload-status");
  status.classList.remove("err");
  status.textContent = "已打开 SlideDeckCleaner，请在新标签页处理 PDF 后回来上传清洗版";
});

$("download-bg-btn").addEventListener("click", () => {
  if (!state.pageImages.length) return;
  const { W, H } = getCanvasSize();
  const blur = Math.max(1, parseInt($("blur").value, 10) || 80);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  drawBackground(ctx, W, H, blur, "auto");
  cv.toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `background-blur-${Date.now()}.png`;
    a.click();
  }, "image/png");
});

$("download-btn").addEventListener("click", () => {
  $("preview").toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `layout-${state.layout}-${Date.now()}.png`;
    a.click();
  }, "image/png");
});

// ---------- 启动 ----------
renderLayouts();
