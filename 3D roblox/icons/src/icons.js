// Candy Empire Tycoon icon set: hand-built SVG -> PNG (256 + 512) + contact sheet.
const fs = require('fs'), path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const OUT = process.argv[2] || path.join(__dirname, 'out');
const OL = '#2B1E3F', SW = 14, OLX = 26; // outline colour, part outline width, extra width for stroke-drawn details
const C = {
  gold:   ['#FFF6B0', '#FFC525', '#E2820A'],
  pink:   ['#FFC2E6', '#FF4FAF', '#CF1A80'],
  blue:   ['#A8EBFF', '#2FA2FF', '#1662D2'],
  green:  ['#D0FF96', '#45CF4A', '#1E9638'],
  purple: ['#E0C4FF', '#9A5CFF', '#6730D2'],
  red:    ['#FFA8A8', '#FF3D56', '#C2183A'],
  orange: ['#FFD69A', '#FF8E1E', '#D05C00'],
  white:  ['#FFFFFF', '#F2ECFB', '#C9BBE2'],
  brown:  ['#EDB074', '#B9692B', '#7C4015'],
  silver: ['#FFFFFF', '#C8D4E8', '#8592AF'],
  teal:   ['#B0FFF2', '#1FD4B3', '#0C9A84'],
  cream:  ['#FFFDF3', '#FFE7B2', '#E0B266'],
  yellow: ['#FFF8B5', '#FFDA2E', '#E3A300'],
  mint:   ['#D4FFF1', '#5FF0C4', '#21B98E'],
};

// ---------- shape helpers ----------
const rad = d => d * Math.PI / 180;
const f = n => +n.toFixed(2);
const P = (cx, cy, r, a) => [f(cx + r * Math.cos(rad(a))), f(cy + r * Math.sin(rad(a)))];
const circ = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const ell = (x, y, rx, ry, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"/>`;
const rr = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const pth = (d, ev) => `<path d="${d}"${ev ? ' fill-rule="evenodd" clip-rule="evenodd"' : ''}/>`;
const pg = pts => `<polygon points="${pts.map(p => p.join(',')).join(' ')}"/>`;
const hl = (x, y, rx, ry, rot = 0, op = 0.6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#fff" opacity="${op}"/>`;
const dot = (x, y, r, op = 0.85) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${op}"/>`;
// scale+translate every "x,y" pair of an absolute path (M/L/C/Q/Z only)
const xf = (d, cx, cy, s) => d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${f(cx + s * x)},${f(cy + s * y)}`);
const xfr = (d, cx, cy, s, rot) => { const c = Math.cos(rad(rot)), n = Math.sin(rad(rot)); return d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${f(cx + s * (x * c - y * n))},${f(cy + s * (x * n + y * c))}`); };
const starPts = (cx, cy, ro, ri, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => P(cx, cy, i % 2 ? ri : ro, rot + i * 180 / n));
const sparkleD = (x, y, r) => { const k = r * 0.34; return `M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r} Z`; };

let uid = 0;
function mk() {
  const pre = 'i' + (uid++) + '_', defs = [], body = [];
  let n = 0;
  return {
    pre, defs, body,
    // a filled, outlined, gradient part with bottom bevel + clipped highlights/decor
    part(shape, pal, o = {}) {
      const id = pre + (n++), [l, b, d] = pal, bev = o.bevel ?? 14;
      defs.push(`<clipPath id="c${id}">${shape}</clipPath><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="${o.mid ?? 0.6}" stop-color="${b}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);
      let s = `<g clip-path="url(#c${id})"><g fill="${d}">${shape}</g><g fill="url(#g${id})" transform="translate(0,${-bev})">${shape}</g>${o.inner || ''}${(o.hl || []).join('')}</g>`;
      if (!o.noOutline) s += `<g fill="none" stroke="${OL}" stroke-width="${o.sw ?? SW}" stroke-linejoin="round" stroke-linecap="round">${shape}</g>`;
      body.push(o.tf ? `<g transform="${o.tf}">${s}</g>` : s);
    },
    // thick stroked details (X, check, waves, handles): outline pass then colour pass
    lines(ds, color, w, o = {}) {
      const a = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
      let s = ds.map(d => `<path d="${d}" ${a} stroke="${OL}" stroke-width="${w + (o.olx ?? OLX)}"/>`).join('');
      s += ds.map(d => `<path d="${d}" ${a} stroke="${color}" stroke-width="${w}"/>`).join('');
      if (o.shine) s += ds.map(d => `<path d="${d}" ${a} stroke="#fff" stroke-opacity="0.55" stroke-width="${w * 0.3}" transform="translate(${-w * 0.18},${-w * 0.2})"/>`).join('');
      body.push(o.tf ? `<g transform="${o.tf}">${s}</g>` : s);
    },
    raw(s) { body.push(s); },
  };
}

function svgOf(fn) {
  const b = mk(); fn(b);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs>${b.defs.join('')}` +
    `<filter id="${b.pre}sh" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feFlood flood-color="${OL}"/><feComposite in2="SourceAlpha" operator="in"/></filter>` +
    `<g id="${b.pre}art">${b.body.join('')}</g></defs>` +
    `<use href="#${b.pre}art" transform="translate(0,8)" filter="url(#${b.pre}sh)"/><use href="#${b.pre}art"/></svg>`;
}

// ---------- reusable pieces ----------
const PAD = 'M0,-50 C42,-50 78,-2 74,28 C70,60 34,56 0,52 C-34,56 -70,60 -74,28 C-78,-2 -42,-50 0,-50 Z';
function paw(b, cx, cy, s, pal = C.pink) {
  b.part(pth(xf(PAD, cx, cy, s)), pal, { hl: [hl(cx - 26 * s, cy - 20 * s, 22 * s, 13 * s, -30)] });
  const toes = [[-66, -50, 23, 30, -28], [-25, -96, 25, 32, -8], [25, -96, 25, 32, 8], [66, -50, 23, 30, 28]];
  for (const [x, y, rx, ry, r] of toes) {
    const X = cx + x * s, Y = cy + y * s;
    b.part(ell(f(X), f(Y), f(rx * s), f(ry * s), r), pal, { bevel: 10, hl: [hl(f(X - 6 * s), f(Y - 10 * s), f(7 * s), f(11 * s), r)] });
  }
}
function plusBadge(b, cx, cy, r) {
  b.part(circ(cx, cy, r), C.green, { bevel: 10, hl: [hl(cx - r * 0.35, cy - r * 0.45, r * 0.4, r * 0.25, -30)] });
  const a = r * 0.48;
  b.lines([`M${cx - a},${cy} H${cx + a}`, `M${cx},${cy - a} V${cy + a}`], '#FFFFFF', r * 0.4, { olx: 18 });
}
const EGG = 'M0,-96 C46,-96 80,-22 80,26 C80,70 46,96 0,96 C-46,96 -80,70 -80,26 C-80,-22 -46,-96 0,-96 Z';
function egg(b, cx, cy, s, pal, deco) {
  const spots = [[-36, -34, 11], [24, -56, 9], [44, 4, 12], [-44, 40, 10], [16, 54, 9], [-8, 0, 7]];
  b.part(pth(xf(EGG, cx, cy, s)), pal, {
    bevel: 16 * Math.min(1, s + 0.15),
    inner: deco || spots.map(([x, y, r]) => dot(f(cx + x * s), f(cy + y * s), f(r * s), 0.8)).join(''),
    hl: [hl(f(cx - 34 * s), f(cy - 44 * s), f(14 * s), f(30 * s), 22, 0.65)],
  });
}
function sparkle(b, x, y, r, pal = C.white) { b.part(pth(sparkleD(x, y, r)), pal, { bevel: 0, sw: 8 }); }

// ---------- icons ----------
const icons = {
  coin(b) {
    const cyl = (cx, cy, rx, ry, h) => pth(`M${cx - rx},${cy} A${rx} ${ry} 0 0 1 ${cx + rx},${cy} L${cx + rx},${cy + h} A${rx} ${ry} 0 0 1 ${cx - rx},${cy + h} Z`);
    for (const y of [190, 166, 142]) b.part(cyl(170, y, 56, 19, 20), C.gold, { bevel: 10 });
    b.part(ell(170, 142, 56, 19), C.gold, { bevel: 6, hl: [hl(150, 136, 22, 6, -4, 0.7)] });
    b.part(circ(100, 120, 76), C.gold, {
      bevel: 16,
      inner: `<circle cx="100" cy="114" r="54" fill="none" stroke="#E9930F" stroke-width="9"/>`,
      hl: [hl(62, 78, 26, 15, -38, 0.7), hl(46, 104, 6, 6, 0, 0.7)],
    });
    b.part(pg(starPts(100, 116, 34, 15)), ['#FFE680', '#F2A818', '#C96E05'], { sw: 9, bevel: 6, hl: [hl(92, 102, 6, 10, -20, 0.55)] });
  },
  shop(b) {
    b.lines(['M90,106 C90,34 166,34 166,106'], '#FF4FAF', 20, { shine: true });
    b.part(pth('M50,98 L206,98 L218,210 Q220,226 204,226 L52,226 Q36,226 38,210 Z'), C.blue, { hl: [hl(76, 140, 14, 30, 12, 0.55)] });
    b.part(rr(44, 90, 168, 30, 10), ['#C9F3FF', '#6CC6FF', '#2A84E0'], { bevel: 8, hl: [hl(80, 98, 26, 5, 0, 0.7)] });
    // lollipop swirl sticker
    const sp = []; for (let t = 0; t <= 4 * Math.PI; t += 0.15) { const r = 2 + 21 * t / (4 * Math.PI); sp.push(`${f(128 + r * Math.cos(t))},${f(170 + r * Math.sin(t))}`); }
    b.part(circ(128, 170, 32), C.white, { bevel: 8, sw: 11, inner: `<polyline points="${sp.join(' ')}" fill="none" stroke="#FF4FAF" stroke-width="8" stroke-linecap="round"/>`, hl: [hl(114, 154, 9, 5, -30, 0.7)] });
  },
  pets(b) { paw(b, 128, 162, 1); },
  rebirth(b) {
    const arrow = (a0, a1) => {
      const cx = 128, cy = 128, ri = 50, ro = 90, ex = 22, rm = (ri + ro) / 2, tip = 34;
      const p = (r, a) => P(cx, cy, r, a).join(',');
      return pth(`M${p(ro, a0)} A${ro} ${ro} 0 0 1 ${p(ro, a1)} L${p(ro + ex, a1)} L${p(rm, a1 + tip)} L${p(ri - ex, a1)} L${p(ri, a1)} A${ri} ${ri} 0 0 0 ${p(ri, a0)} Z`);
    };
    b.part(arrow(196, 318), C.purple, { hl: [hl(70, 82, 12, 26, 45, 0.6)] });
    b.part(arrow(16, 138), C.pink, { hl: [hl(196, 150, 8, 18, 45, 0.5)] });
    sparkle(b, 128, 128, 22, C.yellow);
  },
  daily(b) {
    b.part(rr(34, 60, 188, 166, 28), C.white, {
      inner: [0, 1].map(r => [0, 1, 2].map(c => (r === 1 && c === 2) ? '' : `<rect x="${54 + c * 54}" y="${128 + r * 48}" width="40" height="36" rx="10" fill="#E3D3FA"/>`).join('')).join(''),
    });
    b.part(pth('M34,118 L34,88 Q34,60 62,60 L194,60 Q222,60 222,88 L222,118 Z'), C.red, { bevel: 10, hl: [hl(70, 76, 24, 7, -6, 0.6)] });
    b.part(pg(starPts(182, 194, 30, 14, 5, -90)), C.gold, { sw: 11, bevel: 8, hl: [hl(174, 182, 6, 9, -20, 0.6)] });
    for (const x of [76, 160]) b.part(rr(x, 32, 22, 50, 11), C.silver, { bevel: 8, hl: [hl(x + 7, 46, 3, 8, 0, 0.8)] });
  },
  gift(b) {
    b.part(pth('M128,96 C96,104 46,84 58,52 C68,26 112,46 128,96 Z'), C.pink, { bevel: 10, hl: [hl(72, 54, 8, 12, -30, 0.6)] });
    b.part(pth('M128,96 C160,104 210,84 198,52 C188,26 144,46 128,96 Z'), C.pink, { bevel: 10, hl: [hl(178, 50, 10, 6, -20, 0.6)] });
    b.part(rr(50, 128, 156, 98, 14), C.teal, { hl: [] });
    b.part(rr(110, 130, 36, 96, 4), C.pink, { bevel: 0 });
    b.part(rr(34, 88, 188, 50, 14), ['#C8FFF6', '#4BE6C9', '#0FA88F'], { bevel: 10, hl: [hl(64, 98, 20, 6, 0, 0.7)] });
    b.part(rr(108, 88, 40, 50, 4), C.pink, { bevel: 10 });
    b.part(rr(108, 70, 40, 32, 14), C.pink, { bevel: 8, hl: [hl(120, 78, 7, 4, 0, 0.7)] });
  },
  settings(b) {
    const cx = 128, cy = 128, ro = 104, ri = 80, n = 8;
    let d = '';
    for (let i = 0; i < n; i++) {
      const c = i * 360 / n;
      const a = P(cx, cy, ri, c - 15), b1 = P(cx, cy, ro, c - 10), b2 = P(cx, cy, ro, c + 10), e = P(cx, cy, ri, c + 15), nx = P(cx, cy, ri, c + 360 / n - 15);
      d += `${i ? 'L' : 'M'}${a} L${b1} L${b2} L${e} A${ri} ${ri} 0 0 1 ${nx} `;
    }
    d += `Z M${cx + 32},${cy} A32 32 0 1 0 ${cx - 32},${cy} A32 32 0 1 0 ${cx + 32},${cy} Z`;
    b.part(pth(d, true), C.silver, { bevel: 16, inner: `<circle cx="128" cy="124" r="56" fill="none" stroke="#9FADC8" stroke-width="10"/>`, hl: [hl(78, 70, 26, 13, -40, 0.75)] });
  },
  codes(b) {
    const d = 'M46,78 H210 Q226,78 226,94 V110 A18 18 0 0 0 226,146 V162 Q226,178 210,178 H46 Q30,178 30,162 V146 A18 18 0 0 0 30,110 V94 Q30,78 46,78 Z';
    const tf = 'rotate(-16 128 128)';
    b.part(pth(d), C.orange, {
      tf, inner: `<line x1="170" y1="90" x2="170" y2="166" stroke="#FFE2B8" stroke-width="7" stroke-dasharray="10 9" stroke-linecap="round"/>`,
      hl: [hl(66, 98, 24, 7, 0, 0.6)],
    });
    b.part(pg(starPts(104, 130, 30, 13)), C.yellow, { tf, sw: 10, bevel: 6, hl: [hl(97, 117, 5, 8, -20, 0.7)] });
  },
  home(b) {
    b.part(rr(158, 46, 32, 62, 6), C.red, { bevel: 8 });
    b.part(rr(52, 112, 152, 114, 10), C.cream, { hl: [] });
    b.part(pth('M136,32 L228,112 Q240,128 222,128 L34,128 Q16,128 28,112 L120,32 Q128,26 136,32 Z'), C.red, { hl: [hl(96, 78, 26, 8, -40, 0.55)] });
    b.part(pth('M102,226 V182 A26 26 0 0 1 154,182 V226 Z'), C.purple, { bevel: 8, hl: [hl(116, 176, 6, 10, 20, 0.5)] });
    b.part(circ(142, 202, 5), C.yellow, { bevel: 0, sw: 6 });
    for (const x of [66, 166]) b.part(rr(x, 148, 26, 28, 7), C.blue, { bevel: 6, sw: 10, hl: [hl(x + 8, 156, 4, 6, 20, 0.8)] });
  },
  invite(b) {
    b.part(pth('M106,182 C106,138 130,120 160,120 C190,120 214,138 214,182 Q214,196 200,196 L120,196 Q106,196 106,182 Z'), C.purple, { bevel: 10 });
    b.part(circ(160, 80, 34), C.purple, { bevel: 10, hl: [hl(146, 64, 10, 7, -30, 0.6)] });
    b.part(pth('M30,212 C30,162 60,142 98,142 C136,142 166,162 166,212 Q166,226 152,226 L44,226 Q30,226 30,212 Z'), C.blue, { hl: [hl(62, 166, 16, 8, -30, 0.55)] });
    b.part(circ(98, 98, 38), C.blue, { bevel: 12, hl: [hl(82, 80, 12, 8, -30, 0.65)] });
    plusBadge(b, 194, 190, 36);
  },
  vip(b) {
    b.part(pth('M44,196 L30,96 L86,138 L128,66 L170,138 L226,96 L212,196 Z'), C.gold, { hl: [hl(60, 132, 8, 22, -15, 0.55), hl(118, 112, 7, 18, 0, 0.55)] });
    for (const [x, y, r] of [[30, 90, 15], [128, 58, 17], [226, 90, 15]]) b.part(circ(x, y, r), C.gold, { bevel: 8, sw: 12, hl: [hl(x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.25, -30, 0.8)] });
    b.part(pg([[128, 132], [148, 156], [128, 180], [108, 156]]), C.pink, { bevel: 6, sw: 11, hl: [hl(122, 148, 4, 7, -30, 0.8)] });
    b.part(rr(34, 184, 188, 40, 14), C.gold, { bevel: 10, hl: [hl(66, 192, 22, 5, 0, 0.7)] });
    for (const [x, pal] of [[80, C.blue], [128, C.red], [176, C.green]]) b.part(circ(x, 204, 10), pal, { bevel: 4, sw: 9, hl: [hl(x - 3, 200, 3, 2, -30, 0.9)] });
  },
  boost(b) {
    const pts = []; for (let i = 0; i < 96; i++) { const a = i * 360 / 96, r = 98 + 7 * Math.cos(rad(a * 12)); pts.push(P(128, 128, r, a)); }
    b.part(pg(pts), C.pink, { hl: [hl(76, 70, 26, 12, -40, 0.55)] });
    b.part(circ(128, 124, 70), ['#FF9AD6', '#E8389B', '#B3126A'], { bevel: 0, sw: 10, noOutline: false });
    b.part(pg([[118, 44], [170, 44], [144, 104], [182, 104], [98, 214], [116, 140], [78, 140]]), C.yellow, { bevel: 10, hl: [hl(130, 62, 8, 14, 25, 0.7)] });
  },
  luck(b) {
    b.lines(['M128,132 C134,170 150,196 172,222'], '#2FB244', 16);
    const leaf = 'M0,0 C-12,-20 -64,-38 -60,-72 C-57,-98 -18,-102 0,-80 C18,-102 57,-98 60,-72 C64,-38 12,-20 0,0 Z';
    for (const a of [-45, 45, 135, 225]) {
      const c = Math.cos(rad(a)), n = Math.sin(rad(a));
      const lobes = [[-30, -70], [30, -70]].map(([x, y]) => [f(128 + x * c - y * n), f(120 + x * n + y * c)]).sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
      b.part(pth(xfr(leaf, 128, 120, 1, a)), C.green, { bevel: 12, hl: [hl(lobes[0][0], lobes[0][1], 13, 8, -35, 0.55)] });
    }
    b.part(circ(128, 120, 10), C.green, { bevel: 0, sw: 8 });
  },
  egg(b) {
    const cx = 128, cy = 132;
    const zig = [];
    for (let i = 0; i <= 8; i++) zig.push(`${30 + i * 25},${i % 2 ? 108 : 126}`);
    const zig2 = [];
    for (let i = 8; i >= 0; i--) zig2.push(`${30 + i * 25},${i % 2 ? 136 : 154}`);
    const band = `<polygon points="${zig.join(' ')} ${zig2.join(' ')}" fill="#7DF0CF" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`;
    const dots = [[90, 72, 9], [148, 66, 8], [166, 186, 10], [100, 196, 8], [130, 176, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF1A8"/>`).join('');
    egg(b, cx, cy, 1, C.pink, band + dots);
  },
  speed(b) {
    const W = 'M0,-18 C-22,-52 -58,-68 -86,-58 Q-96,-34 -72,-26 Q-80,-4 -54,-2 Q-56,20 -28,16 Q-18,32 2,18 Z';
    const ax = 120, ay = 104, ws = 1.1;
    b.part(pth(xf(W, ax, ay, ws)), C.white, {
      bevel: 10,
      inner: [[-74, -26], [-54, -2], [-28, 16]].map(([x, y]) => '<path d="M' + ax + ',' + (ay + 4) + ' L' + f(ax + x * ws) + ',' + f(ay + y * ws) + '" stroke="#B9A9D6" stroke-width="6" stroke-linecap="round"/>').join(''),
      hl: [hl(f(ax - 52 * ws), f(ay - 50 * ws), 24, 7, 22, 0.9)],
    });
    b.part(pth('M98,62 Q98,50 110,50 L158,50 Q170,50 170,62 L170,124 C192,126 220,140 227,166 Q233,192 218,196 L110,196 Q98,196 98,184 Z'), C.red, {
      inner: '<path d="M160,132 l-14,8 M174,138 l-12,10 M188,146 l-10,12" stroke="#2B1E3F" stroke-width="6" stroke-linecap="round"/>',
      hl: [hl(118, 96, 9, 28, 0, 0.5)],
    });
    b.part(rr(92, 186, 142, 28, 13), C.white, { bevel: 8, hl: [hl(120, 192, 18, 3, 0, 0.9)] });
    b.part(rr(92, 40, 86, 28, 12), C.white, { bevel: 8, hl: [hl(114, 48, 14, 4, 0, 0.9)] });
  },
  magnet(b) {
    const tf = 'translate(-6 10) rotate(35 128 140)';
    b.part(pth('M58,70 V150 A70 70 0 0 0 198,150 V70 H158 V150 A30 30 0 0 1 98,150 V70 Z'), C.red, { tf, hl: [hl(76, 120, 8, 26, 0, 0.55)] });
    for (const x of [58, 158]) b.part(rr(x, 56, 40, 36, 6), C.silver, { tf, bevel: 8, hl: [hl(x + 12, 64, 7, 4, 0, 0.8)] });
    sparkle(b, 204, 48, 22, C.yellow);
    sparkle(b, 228, 98, 15, C.yellow);
    sparkle(b, 166, 26, 14, C.yellow);
  },
  slots(b) { paw(b, 112, 146, 0.82); plusBadge(b, 192, 190, 40); },
  triple(b) {
    egg(b, 70, 128, 0.6, C.blue);
    egg(b, 186, 128, 0.6, C.yellow);
    egg(b, 128, 150, 0.76, C.pink);
  },
  starter(b) {
    b.part(pth('M34,122 V98 C34,64 62,48 128,48 C194,48 222,64 222,98 V122 Z'), C.brown, {
      inner: `<rect x="60" y="30" width="28" height="100" fill="#FFC525" stroke="${OL}" stroke-width="8"/><rect x="168" y="30" width="28" height="100" fill="#FFC525" stroke="${OL}" stroke-width="8"/>`,
      hl: [hl(110, 62, 30, 6, -4, 0.45)],
    });
    b.part(rr(34, 116, 188, 108, 12), C.brown, {
      inner: `<rect x="60" y="100" width="28" height="140" fill="#FFC525" stroke="${OL}" stroke-width="8"/><rect x="168" y="100" width="28" height="140" fill="#FFC525" stroke="${OL}" stroke-width="8"/>`,
    });
    b.part(rr(26, 108, 204, 22, 9), C.gold, { bevel: 6, hl: [hl(60, 114, 22, 3, 0, 0.8)] });
    b.part(rr(104, 112, 48, 56, 12), C.gold, {
      bevel: 8, inner: `<circle cx="128" cy="134" r="8" fill="${OL}"/><path d="M124,136 L132,136 L135,154 L121,154 Z" fill="${OL}"/>`,
      hl: [hl(114, 120, 5, 7, -20, 0.8)],
    });
    sparkle(b, 214, 40, 20, C.yellow);
    sparkle(b, 40, 36, 15, C.yellow);
  },
  music(b) {
    b.part(pth('M90,190 V70 L214,38 V172 H194 V75 L110,97 V190 Z'), C.purple, { bevel: 10, hl: [hl(132, 66, 30, 5, -14, 0.6)] });
    b.part(ell(74, 190, 37, 27, -20), C.purple, { hl: [hl(60, 180, 13, 6, -25, 0.65)] });
    b.part(ell(178, 172, 37, 27, -20), C.purple, { hl: [hl(164, 162, 13, 6, -25, 0.65)] });
  },
  sound(b) {
    b.lines([`M${P(140, 128, 48, -40)} A48 48 0 0 1 ${P(140, 128, 48, 40)}`, `M${P(140, 128, 82, -42)} A82 82 0 0 1 ${P(140, 128, 82, 42)}`], '#7FD6FF', 18, { shine: false });
    b.part(pth('M64,102 L122,58 Q138,48 138,66 V190 Q138,208 122,198 L64,154 Z'), C.blue, { hl: [hl(104, 84, 8, 18, 40, 0.55)] });
    b.part(rr(26, 94, 52, 68, 12), ['#C9F3FF', '#6CC6FF', '#2A84E0'], { bevel: 10, hl: [hl(42, 106, 8, 6, -20, 0.7)] });
  },
  close(b) {
    b.part(circ(128, 128, 100), C.red, { hl: [hl(76, 70, 28, 14, -40, 0.55)] });
    b.lines(['M90,90 L166,166', 'M166,90 L90,166'], '#FFFFFF', 30);
  },
  lock(b) {
    b.lines(['M84,118 V86 A44 44 0 0 1 172,86 V118'], '#C8D4E8', 28, { shine: true });
    b.part(rr(42, 108, 172, 120, 24), C.gold, {
      inner: `<circle cx="128" cy="154" r="16" fill="${OL}"/><path d="M120,158 L136,158 L142,198 L114,198 Z" fill="${OL}" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`,
      hl: [hl(70, 128, 18, 9, -20, 0.6)],
    });
  },
  check(b) {
    b.part(circ(128, 128, 100), C.green, { hl: [hl(76, 70, 28, 14, -40, 0.55)] });
    b.lines(['M78,130 L112,164 L180,94'], '#FFFFFF', 32);
  },
  candy(b) {
    const tf = 'rotate(-24 128 128)';
    const pleat = (s) => [-28, -8, 12, 30].map(dy => `<path d="M${128 + s * 56},128 L${128 + s * 112},${128 + dy * 1.4}" stroke="#7E45D6" stroke-width="6" stroke-linecap="round" opacity="0.6"/>`).join('');
    b.part(pth('M84,128 L28,84 Q14,76 14,94 L14,162 Q14,180 28,172 Z'), C.purple, { tf, bevel: 8, inner: pleat(-1) });
    b.part(pth('M172,128 L228,84 Q242,76 242,94 L242,162 Q242,180 228,172 Z'), C.purple, { tf, bevel: 8, inner: pleat(1) });
    const stripes = [-60, -20, 20, 60].map(x => `<path d="M${128 + x - 30},70 L${128 + x + 30},190" stroke="#FFFFFF" stroke-width="16" opacity="0.9"/>`).join('');
    b.part(ell(128, 128, 60, 52), C.pink, { tf, inner: stripes, hl: [hl(104, 98, 18, 9, -20, 0.6)] });
  },
  star(b) {
    b.part(pg(starPts(128, 136, 106, 50)), C.gold, { bevel: 16, hl: [hl(94, 98, 14, 24, 35, 0.6), hl(124, 64, 6, 12, 10, 0.6)] });
  },
};

// ---------- render ----------
for (const s of ['256', '512', 'svg']) fs.mkdirSync(path.join(OUT, s), { recursive: true });
const only = process.argv[3] ? process.argv[3].split(',') : null;
const cells = [];
for (const [name, fn] of Object.entries(icons)) {
  if (only && !only.includes(name)) continue;
  const svg = svgOf(fn);
  fs.writeFileSync(path.join(OUT, 'svg', name + '.svg'), svg);
  for (const s of [256, 512]) fs.writeFileSync(path.join(OUT, String(s), name + '.png'), new Resvg(svg, { fitTo: { mode: 'width', value: s } }).render().asPng());
  cells.push(name);
}
// contact sheet: alternating light/dark backgrounds to check both
const cols = 6, cs = 200, rows = Math.ceil(cells.length / cols);
let sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cs}" height="${rows * cs}">`;
cells.forEach((name, i) => {
  const x = (i % cols) * cs, y = Math.floor(i / cols) * cs;
  const b64 = fs.readFileSync(path.join(OUT, '256', name + '.png')).toString('base64');
  sheet += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${(i + Math.floor(i / cols)) % 2 ? '#5B3FA0' : '#F4ECFF'}"/><image x="${x + 4}" y="${y + 4}" width="${cs - 8}" height="${cs - 8}" href="data:image/png;base64,${b64}"/>`;
});
sheet += '</svg>';
fs.writeFileSync(path.join(OUT, 'sheet.png'), new Resvg(sheet).render().asPng());
console.log('rendered', cells.length, cells.join(' '));
