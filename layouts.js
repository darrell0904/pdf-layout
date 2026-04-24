// 排布定义：每个 layout 描述如何把 N 个图片放到画布上
// getSlots(W, H, opts, n) -> [{x, y, w, h, radius, mode:'contain'|'cover'}, ...]
// opts = { pad, gap (纵向间距), gapX (横向间距，可选，默认=gap) }

function gridSlots(W, H, o, n, cols) {
  const rows = Math.ceil(n / cols);
  const gapY = o.gap;
  const gapX = o.gapX ?? o.gap;
  const innerW = W - o.pad*2, innerH = H - o.pad*2;
  const cellW = (innerW - (cols-1)*gapX) / cols;
  const cellH = (innerH - (rows-1)*gapY) / rows;
  const radius = Math.min(cellW, cellH) * 0.04;
  const slots = [];
  for (let i=0;i<n;i++) {
    const r = Math.floor(i/cols), c = i%cols;
    slots.push({
      x: o.pad + c*(cellW+gapX),
      y: o.pad + r*(cellH+gapY),
      w: cellW, h: cellH, radius, mode: 'contain',
    });
  }
  return slots;
}

const LAYOUTS = [
  {
    id: "stack",
    name: "纵向堆叠",
    desc: "多张图纵向居中排列（默认 2 张）",
    defaultCount: 2, minCount: 2, maxCount: 6,
    preview: `<div class="blk" style="left:18%;top:18%;width:64%;height:28%"></div>
              <div class="blk" style="left:18%;top:54%;width:64%;height:28%"></div>`,
    getSlots(W, H, o, n) {
      const innerW = W - o.pad*2;
      const innerH = H - o.pad*2;
      // 每张图按 16:9，整块垂直居中；若溢出再等比缩放
      let cellW = innerW;
      let cellH = cellW * 9 / 16;
      let totalH = n*cellH + (n-1)*o.gap;
      if (totalH > innerH) {
        const k = innerH / totalH;
        cellW *= k; cellH *= k;
        totalH = n*cellH + (n-1)*o.gap;
      }
      const xStart = o.pad + (innerW - cellW) / 2;
      const yStart = o.pad + (innerH - totalH) / 2;
      const radius = Math.min(cellW, cellH) * 0.03;
      const slots = [];
      for (let i=0;i<n;i++) {
        slots.push({
          x: xStart, y: yStart + i*(cellH+o.gap),
          w: cellW, h: cellH, radius, mode: 'cover',
        });
      }
      return slots;
    },
  },
  {
    id: "sidebar",
    name: "侧栏画廊",
    desc: "左侧 9 张小图 + 右侧 3 张大图（参考图1风格）",
    fixedCount: 12,
    preview: `<div class="blk" style="left:5%;top:5%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:15.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:26%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:36.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:47%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:57.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:68%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:78.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:5%;top:89%;width:20%;height:6%"></div>
              <div class="blk" style="left:30%;top:5%;width:65%;height:28%"></div>
              <div class="blk" style="left:30%;top:35%;width:65%;height:28%"></div>
              <div class="blk" style="left:30%;top:65%;width:65%;height:22%"></div>`,
    getSlots(W, H, o) {
      const slots = [];
      const sideW = Math.max(120, W * 0.22);
      const mainX = o.pad + sideW + o.gap*2;
      const mainW = W - mainX - o.pad;
      const innerH = H - o.pad*2;
      const sideCount = 9;
      const thumbGap = Math.max(4, o.gap * 0.5);
      const thumbH = (innerH - (sideCount-1)*thumbGap) / sideCount;
      const sRadius = Math.min(sideW, thumbH) * 0.06;
      for (let i=0;i<sideCount;i++) {
        slots.push({
          x: o.pad, y: o.pad + i*(thumbH+thumbGap),
          w: sideW, h: thumbH, radius: sRadius, mode: 'contain',
        });
      }
      const mainCount = 3;
      const mH = (innerH - (mainCount-1)*o.gap) / mainCount;
      const mRadius = Math.min(mainW, mH) * 0.025;
      for (let i=0;i<mainCount;i++) {
        slots.push({
          x: mainX, y: o.pad + i*(mH+o.gap),
          w: mainW, h: mH, radius: mRadius, mode: 'contain',
        });
      }
      return slots;
    },
    slotLabel(i) { return i < 9 ? `侧栏 ${i+1}` : `主图 ${i-8}`; },
  },
  {
    id: "sidebar-right",
    name: "侧栏画廊（右）",
    desc: "左侧 3 张大图 + 右侧 9 张小图",
    fixedCount: 12,
    preview: `<div class="blk" style="left:30%;top:5%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:15.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:26%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:36.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:47%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:57.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:68%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:78.5%;width:20%;height:9%"></div>
              <div class="blk" style="left:30%;top:89%;width:20%;height:6%"></div>
              <div class="blk" style="left:55%;top:5%;width:40%;height:28%"></div>
              <div class="blk" style="left:55%;top:35%;width:40%;height:28%"></div>
              <div class="blk" style="left:55%;top:65%;width:40%;height:22%"></div>`,
    getSlots(W, H, o) {
      const slots = [];
      const sideW = Math.max(120, W * 0.22);
      const mainW = W - o.pad*2 - sideW - o.gap*2;
      const mainX = o.pad;
      const sideX = W - o.pad - sideW;
      const innerH = H - o.pad*2;
      const sideCount = 9;
      const thumbGap = Math.max(4, o.gap * 0.5);
      const thumbH = (innerH - (sideCount-1)*thumbGap) / sideCount;
      const sRadius = Math.min(sideW, thumbH) * 0.06;
      for (let i=0;i<sideCount;i++) {
        slots.push({
          x: sideX, y: o.pad + i*(thumbH+thumbGap),
          w: sideW, h: thumbH, radius: sRadius, mode: 'contain',
        });
      }
      const mainCount = 3;
      const mH = (innerH - (mainCount-1)*o.gap) / mainCount;
      const mRadius = Math.min(mainW, mH) * 0.025;
      for (let i=0;i<mainCount;i++) {
        slots.push({
          x: mainX, y: o.pad + i*(mH+o.gap),
          w: mainW, h: mH, radius: mRadius, mode: 'contain',
        });
      }
      return slots;
    },
    slotLabel(i) { return i < 9 ? `侧栏 ${i+1}` : `主图 ${i-8}`; },
  },
  {
    id: "grid2",
    name: "2 列网格",
    desc: "两列等分排布",
    defaultCount: 6, minCount: 2, maxCount: 20,
    preview: `<div class="blk" style="left:8%;top:8%;width:38%;height:26%"></div>
              <div class="blk" style="left:54%;top:8%;width:38%;height:26%"></div>
              <div class="blk" style="left:8%;top:37%;width:38%;height:26%"></div>
              <div class="blk" style="left:54%;top:37%;width:38%;height:26%"></div>
              <div class="blk" style="left:8%;top:66%;width:38%;height:26%"></div>
              <div class="blk" style="left:54%;top:66%;width:38%;height:26%"></div>`,
    getSlots: (W,H,o,n) => gridSlots(W,H,o,n,2),
  },
  {
    id: "grid3",
    name: "3 列网格",
    desc: "三列等分，适合多图",
    defaultCount: 9, minCount: 3, maxCount: 30,
    preview: `<div class="blk" style="left:6%;top:8%;width:27%;height:20%"></div>
              <div class="blk" style="left:36.5%;top:8%;width:27%;height:20%"></div>
              <div class="blk" style="left:67%;top:8%;width:27%;height:20%"></div>
              <div class="blk" style="left:6%;top:31%;width:27%;height:20%"></div>
              <div class="blk" style="left:36.5%;top:31%;width:27%;height:20%"></div>
              <div class="blk" style="left:67%;top:31%;width:27%;height:20%"></div>
              <div class="blk" style="left:6%;top:54%;width:27%;height:20%"></div>
              <div class="blk" style="left:36.5%;top:54%;width:27%;height:20%"></div>
              <div class="blk" style="left:67%;top:54%;width:27%;height:20%"></div>`,
    getSlots: (W,H,o,n) => gridSlots(W,H,o,n,3),
  },
  {
    id: "poster",
    name: "海报式",
    desc: "1 大图 + 底部小图条",
    defaultCount: 5, minCount: 3, maxCount: 8,
    preview: `<div class="blk" style="left:8%;top:8%;width:84%;height:58%"></div>
              <div class="blk" style="left:8%;top:70%;width:20%;height:20%"></div>
              <div class="blk" style="left:30%;top:70%;width:20%;height:20%"></div>
              <div class="blk" style="left:52%;top:70%;width:20%;height:20%"></div>
              <div class="blk" style="left:74%;top:70%;width:18%;height:20%"></div>`,
    getSlots(W,H,o,n) {
      const innerW = W - o.pad*2;
      const innerH = H - o.pad*2;
      const heroH = innerH * 0.62;
      const smallH = innerH - heroH - o.gap;
      const radius = Math.min(innerW, heroH) * 0.03;
      const slots = [{ x:o.pad, y:o.pad, w:innerW, h:heroH, radius, mode:'contain' }];
      const smallCount = n - 1;
      const sw = (innerW - (smallCount-1)*o.gap) / smallCount;
      const sRadius = Math.min(sw, smallH) * 0.05;
      for (let i=0;i<smallCount;i++) {
        slots.push({
          x: o.pad + i*(sw+o.gap), y: o.pad + heroH + o.gap,
          w: sw, h: smallH, radius: sRadius, mode: 'contain',
        });
      }
      return slots;
    },
    slotLabel(i) { return i === 0 ? "主图" : `小图 ${i}`; },
  },
  {
    id: "hero-quad",
    name: "头图 + 四宫格",
    desc: "顶部 1 张大图 + 下方 2×2 四宫格（5 张，全部 16:9 居中）",
    fixedCount: 5,
    preview: `<div class="blk" style="left:6%;top:5%;width:88%;height:38%"></div>
              <div class="blk" style="left:6%;top:48%;width:42%;height:22%"></div>
              <div class="blk" style="left:52%;top:48%;width:42%;height:22%"></div>
              <div class="blk" style="left:6%;top:74%;width:42%;height:22%"></div>
              <div class="blk" style="left:52%;top:74%;width:42%;height:22%"></div>`,
    getSlots(W, H, o) {
      const innerW = W - o.pad*2;
      const innerH = H - o.pad*2;
      const gapY = o.gap;
      const gapX = o.gapX ?? o.gap;
      // 全部 16:9：小图宽 = (innerW - gapX)/2，头图宽 = 2*cellW + gapX
      let cellW = (innerW - gapX) / 2;
      let cellH = cellW * 9 / 16;
      let heroW = cellW * 2 + gapX;
      let heroH = heroW * 9 / 16;
      let totalH = heroH + 2*cellH + 2*gapY;
      if (totalH > innerH) {
        const k = innerH / totalH;
        heroW *= k; heroH *= k; cellW *= k; cellH *= k;
        totalH = heroH + 2*cellH + 2*gapY;
      }
      const xStart = o.pad + (innerW - heroW) / 2;
      const yStart = o.pad + (innerH - totalH) / 2;
      const hRadius = Math.min(heroW, heroH) * 0.025;
      const cRadius = Math.min(cellW, cellH) * 0.03;
      const slots = [
        { x: xStart, y: yStart, w: heroW, h: heroH, radius: hRadius, mode: 'cover' },
      ];
      for (let r=0;r<2;r++) for (let c=0;c<2;c++) {
        slots.push({
          x: xStart + c*(cellW+gapX),
          y: yStart + heroH + gapY + r*(cellH+gapY),
          w: cellW, h: cellH, radius: cRadius, mode: 'cover',
        });
      }
      return slots;
    },
    slotLabel(i) { return i === 0 ? "头图" : `小图 ${i}`; },
  },
  {
    id: "album-2x4",
    name: "画册 2×4",
    desc: "2 列 × 4 行 横向幻灯片画册（8 张，全部 16:9 居中）",
    fixedCount: 8,
    preview: `<div class="blk" style="left:6%;top:5%;width:42%;height:20%"></div>
              <div class="blk" style="left:52%;top:5%;width:42%;height:20%"></div>
              <div class="blk" style="left:6%;top:28%;width:42%;height:20%"></div>
              <div class="blk" style="left:52%;top:28%;width:42%;height:20%"></div>
              <div class="blk" style="left:6%;top:51%;width:42%;height:20%"></div>
              <div class="blk" style="left:52%;top:51%;width:42%;height:20%"></div>
              <div class="blk" style="left:6%;top:74%;width:42%;height:20%"></div>
              <div class="blk" style="left:52%;top:74%;width:42%;height:20%"></div>`,
    getSlots(W, H, o) {
      const innerW = W - o.pad*2;
      const innerH = H - o.pad*2;
      const gapY = o.gap;
      const gapX = o.gapX ?? o.gap;
      // 16:9 cells，2 列 × 4 行
      let cellW = (innerW - gapX) / 2;
      let cellH = cellW * 9 / 16;
      let totalH = 4*cellH + 3*gapY;
      if (totalH > innerH) {
        const k = innerH / totalH;
        cellW *= k; cellH *= k;
        totalH = 4*cellH + 3*gapY;
      }
      const blockW = 2*cellW + gapX;
      const xStart = o.pad + (innerW - blockW) / 2;
      const yStart = o.pad + (innerH - totalH) / 2;
      const radius = Math.min(cellW, cellH) * 0.03;
      const slots = [];
      for (let r=0;r<4;r++) for (let c=0;c<2;c++) {
        slots.push({
          x: xStart + c*(cellW+gapX),
          y: yStart + r*(cellH+gapY),
          w: cellW, h: cellH, radius, mode: 'cover',
        });
      }
      return slots;
    },
  },
  {
    id: "collage",
    name: "错落拼贴",
    desc: "不规则尺寸交错排布（6 块）",
    fixedCount: 6,
    preview: `<div class="blk" style="left:6%;top:6%;width:50%;height:34%"></div>
              <div class="blk" style="left:60%;top:10%;width:34%;height:22%"></div>
              <div class="blk" style="left:60%;top:36%;width:34%;height:28%"></div>
              <div class="blk" style="left:6%;top:44%;width:28%;height:26%"></div>
              <div class="blk" style="left:38%;top:50%;width:44%;height:30%"></div>
              <div class="blk" style="left:6%;top:74%;width:60%;height:18%"></div>`,
    getSlots(W,H,o) {
      const specs = [
        [0.00, 0.00, 0.55, 0.38],
        [0.58, 0.04, 0.38, 0.26],
        [0.58, 0.32, 0.38, 0.32],
        [0.00, 0.41, 0.32, 0.30],
        [0.35, 0.48, 0.52, 0.34],
        [0.00, 0.74, 0.68, 0.22],
      ];
      const innerW = W - o.pad*2, innerH = H - o.pad*2;
      return specs.map(s => ({
        x: o.pad + s[0]*innerW, y: o.pad + s[1]*innerH,
        w: s[2]*innerW, h: s[3]*innerH,
        radius: Math.min(s[2]*innerW, s[3]*innerH) * 0.04,
        mode: 'cover',
      }));
    },
  },
];
