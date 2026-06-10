"use client";

import { useEffect, useRef } from "react";

/**
 * GPU-native accretion-disc background — WebGL2 + OffscreenCanvas Worker.
 *
 * Architecture (three-phase GPU migration):
 *
 * Phase 1 – Data Flattening:
 *   Particle attributes are packed into 8 Float32Arrays (one per glow-colour
 *   group) and uploaded to GPU VRAM once at init / resize.  The CPU never
 *   touches per-particle data again.
 *
 * Phase 2 – Structural Segmentation:
 *   Particles are pre-sorted into 8 draw groups matching the 8 original
 *   gradient sprites.  Each group binds its own 32×32 GPU texture (built with
 *   the exact same createRadialGradient stops as the original Canvas2D sprites)
 *   and is drawn in a single instanced call — 8 parallel GPU sweeps per frame.
 *
 * Phase 3 – Shader Projection:
 *   Every frame the vertex shader receives ONE time uniform and computes every
 *   particle's orbital position, yaw/pitch 3-D projection, perspective divide,
 *   and 15° tilt rotation entirely in GLSL.  Zero per-particle JS work.
 *
 * Visual output is identical to the original:
 *   • Same particle counts  (N = 3500 / 6000 / 9000 base + all original multipliers)
 *   • Same 780 stars, same sphere-shell placement, same twinkle formula
 *   • Same 8 gradient sprites (identical addColorStop values)
 *   • Same disc radius, camera, tilt, halo gradient stops
 *   • `powerPreference:'high-performance'` routes to discrete / Nvidia GPU
 */

/* ─── Constants baked into shader source at module load time ─────────────── */
const _TILT = (15 * Math.PI) / 180;
const TC   = Math.cos(_TILT).toFixed(8);   // cos 15°
const TS   = Math.sin(_TILT).toFixed(8);   // sin 15°
const CYAW = Math.cos(0.65).toFixed(8);
const SYAW = Math.sin(0.65).toFixed(8);
const CPIT = Math.cos(0.2).toFixed(8);
const SPIT = Math.sin(0.2).toFixed(8);

/* ─── Worker source ──────────────────────────────────────────────────────── */
const WORKER_SRC = `'use strict';

/* ── Disc vertex shader: all orbital + projection math on the GPU ─────────── */
const DISC_VS = \`#version 300 es
precision highp float;

/* per-instance (divisor 1): packed particle attributes */
in float a_r;    /* orbital radius */
in float a_a0;   /* initial angle  */
in float a_spd;  /* angular speed  */
in float a_yj;   /* vertical jitter */
in float a_sz;   /* base size      */
in float a_ax;   /* horizontal aspect */
in float a_ay;   /* vertical aspect   */
in float a_ba;   /* base alpha     */

/* per-vertex (divisor 0): billboard corner offset  (-0.5 … 0.5) */
in vec2 a_corner;

uniform float u_t;      /* elapsed seconds */
uniform float u_f;      /* focal length    */
uniform float u_dx;     /* diskX           */
uniform float u_dy;     /* diskY           */
uniform vec2  u_vp;     /* viewport px     */

out vec2  v_uv;
out float v_alpha;

void main(){
  /* orbital position -------------------------------------------------------- */
  float ang = a_a0 + a_spd * u_t;
  float x = a_r * cos(ang);
  float z = a_r * sin(ang);

  /* yaw rotation (cam.yaw = 0.65) ------------------------------------------ */
  float x1 =  x * ${CYAW} + z * ${SYAW};
  float z1 = -x * ${SYAW} + z * ${CYAW};

  /* pitch rotation (cam.pitch = 0.2) --------------------------------------- */
  float y2 =  a_yj * ${CPIT} + z1 * ${SPIT};
  float z2 = -a_yj * ${SPIT} + z1 * ${CPIT};

  /* perspective projection (cam.dist = 900) -------------------------------- */
  float zz = z2 + 900.0;
  float vis = step(1.0, zz);
  float s   = vis * u_f / max(zz, 1.0);

  /* sprite dimensions */
  float dd = a_sz * s * 1.7;
  float hw  = dd * a_ax;   /* half-width  after aspect */
  float hh  = dd * a_ay;   /* half-height after aspect */

  /* projected screen-space centre ----------------------------------------- */
  float cx  = u_vp.x * 0.5;
  float cy  = u_vp.y * 0.5;
  float scx = cx + x1  * s + u_dx;
  float scy = cy - y2  * s + u_dy;

  /* 15° tilt around pivot = (cx+diskX, cy+diskY) -------------------------- */
  float pvx = cx + u_dx;
  float pvy = cy + u_dy;
  float rx  = scx - pvx;
  float ry  = scy - pvy;
  float tcx = ${TC} * rx - ${TS} * ry + pvx;
  float tcy = ${TS} * rx + ${TC} * ry + pvy;

  /* rotate billboard corners by the same tilt so the ellipse axes match ----- */
  float bx  = a_corner.x * hw;
  float by  = a_corner.y * hh;
  float rbx = ${TC} * bx - ${TS} * by;
  float rby = ${TS} * bx + ${TC} * by;

  vec2 pos = vec2(tcx + rbx, tcy + rby);
  gl_Position = vec4(
    pos.x / u_vp.x * 2.0 - 1.0,
    1.0 - pos.y / u_vp.y * 2.0,
    0.0, 1.0
  );

  v_uv    = a_corner + 0.5;          /* map -0.5…0.5  →  0…1 */
  v_alpha = min(1.0, a_ba * s) * vis;
}\`;

/* ── Disc fragment shader: sample sprite texture ──────────────────────────── */
const DISC_FS = \`#version 300 es
precision mediump float;
uniform sampler2D u_sprite;
in  vec2  v_uv;
in  float v_alpha;
out vec4  fragColor;
void main(){
  vec4 t = texture(u_sprite, v_uv);
  fragColor = vec4(t.rgb, t.a * v_alpha);
}\`;

/* ── Star vertex shader ───────────────────────────────────────────────────── */
const STAR_VS = \`#version 300 es
precision highp float;
in vec3  a_pos;   /* x y z on sphere shell */
in vec3  a_bps;   /* brightness, phase, speed */
in vec2  a_corner;
uniform float u_now;
uniform float u_f;
uniform vec2  u_vp;
out float v_bright;
void main(){
  float x1 =  a_pos.x * ${CYAW} + a_pos.z * ${SYAW};
  float z1 = -a_pos.x * ${SYAW} + a_pos.z * ${CYAW};
  float y2 =  a_pos.y * ${CPIT} + z1 * ${SPIT};
  float z2 = -a_pos.y * ${SPIT} + z1 * ${CPIT};
  float zz = z2 + 900.0;
  float vis = step(1.0, zz);
  float s   = vis * u_f / max(zz, 1.0);
  vec2 c   = vec2(u_vp.x * 0.5 + x1 * s, u_vp.y * 0.5 - y2 * s);
  vec2 pos = c + a_corner * 1.4;
  gl_Position = vec4(
    pos.x / u_vp.x * 2.0 - 1.0,
    1.0 - pos.y / u_vp.y * 2.0,
    0.0, 1.0
  );
  v_bright = vis * a_bps.x * (0.55 + 0.45 * sin(u_now * 0.001 * a_bps.z + a_bps.y));
}\`;

const STAR_FS = \`#version 300 es
precision mediump float;
in  float v_bright;
out vec4  fragColor;
void main(){ fragColor = vec4(1.0, 1.0, 1.0, v_bright); }\`;

/* ── Halo shaders ─────────────────────────────────────────────────────────── */
const HALO_VS = \`#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }\`;

const HALO_FS = \`#version 300 es
precision mediump float;
uniform vec2  u_vp;
uniform float u_dx, u_dy, u_f;
out vec4 fragColor;
void main(){
  /* pivot = (cx+diskX, cy+diskY); halo centre sits off-pivot along tilt axis */
  float coreS  = u_f / 900.0;
  float hr     = 470.0 * coreS * 1.15;
  float off    = 470.0 * coreS * 0.16;
  float pvx    = u_vp.x * 0.5 + u_dx;
  float pvy    = u_vp.y * 0.5 + u_dy;
  /* screen coords (flip gl y so +y points down like canvas) */
  vec2 F = vec2(gl_FragCoord.x, u_vp.y - gl_FragCoord.y);
  /* vector from pivot to fragment, then un-rotate by 15° → local frame */
  vec2 R = F - vec2(pvx, pvy);
  vec2 L = vec2(R.x * ${TC} + R.y * ${TS},
               -R.x * ${TS} + R.y * ${TC});
  /* (0, off) is the halo centre in local frame; undo ctx.scale(1,sinPitch) */
  vec2 D = vec2(L.x / hr, (L.y - off) / (hr * ${SPIT}));
  float d = length(D);
  if (d > 1.0) discard;
  vec4 c;
  if      (d < 0.40) c = mix(vec4(0.235,0.745,0.922,0.12),  vec4(0.275,0.353,0.882,0.078), d / 0.40);
  else if (d < 0.75) c = mix(vec4(0.275,0.353,0.882,0.078), vec4(0.588,0.157,0.804,0.066), (d-0.40)/0.35);
  else               c = mix(vec4(0.588,0.157,0.804,0.066), vec4(0.314,0.078,0.471,0.0),   (d-0.75)/0.25);
  fragColor = vec4(c.rgb, c.a);
}\`;

/* ── GPU resource handles ─────────────────────────────────────────────────── */
let gl, canvas, W, H;
const cam = { f: 1200 };
let diskX = 0, diskY = 0;

let discProg, starProg, haloProg;
let quadBuf, haloBuf, starBuf;
const discBufs    = new Array(8).fill(null);  /* one instance buffer per group */
const discVAOs    = new Array(8).fill(null);
const discTextures= new Array(8).fill(null);
const discCounts  = new Int32Array(8);
let starVAO, haloVAO;

const U = { disc:{}, star:{}, halo:{} };

let rafId = 0, startWall = 0, totalPauseMs = 0, pausedAt = 0;
const rIn = 4, rOut = 470;

/* ── Shader helpers ───────────────────────────────────────────────────────── */
function mkShader(type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}
function mkProg(vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, mkShader(gl.VERTEX_SHADER,   vs));
  gl.attachShader(p, mkShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

/* ── Sprite textures — identical gradient stops to original ───────────────── */
const PALETTE = [
  'rgba(215,250,255,','rgba(120,240,255,','rgba(41,182,246,',
  'rgba(57,90,235,',  'rgba(124,77,255,','rgba(213,0,249,',
  'rgba(255,45,208,', 'rgba(255,170,60,'
];
function makeSpriteTex(si){
  const S = 32;
  const cv = new OffscreenCanvas(S, S);
  const g  = cv.getContext('2d');
  const rd = g.createRadialGradient(S/2,S/2,0, S/2,S/2,S/2);
  rd.addColorStop(0,    PALETTE[si]+'1)');
  rd.addColorStop(0.3,  PALETTE[si]+'0.28)');
  rd.addColorStop(0.65, PALETTE[si]+'0.07)');
  rd.addColorStop(1,    PALETTE[si]+'0)');
  g.fillStyle = rd;
  g.fillRect(0, 0, S, S);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/* ── Particle data — exact original counts and formulas ──────────────────── */
function buildDisk(w){
  /* 8 temporary JS arrays, one per sprite-colour group */
  const groups = Array.from({length:8}, () => []);

  function push(r, yjOverride, baMul){
    const a  = Math.random() * Math.PI * 2;
    const f  = (r - rIn) / (rOut - rIn);
    let si;
    if      (Math.random() < 0.05) si = 7;
    else if (f < 0.10) si = 0;
    else if (f < 0.26) si = 1;
    else if (f < 0.42) si = 2;
    else if (f < 0.58) si = 3;
    else if (f < 0.74) si = 4;
    else if (f < 0.88) si = 5;
    else               si = 6;
    let sz = 0.6 + Math.pow(Math.random(), 3) * 9;
    if (Math.random() < 0.75) sz *= 0.5;
    const thick = 80 * (1 - Math.min(1, f)) + 6;
    const yj    = yjOverride !== undefined ? yjOverride : (Math.random()-0.5)*thick;
    const spd   = 0.020 * Math.pow(rOut / Math.max(rIn, r), 0.55);
    let   ba    = 0.3 + Math.random() * 0.7;
    if (baMul) ba *= baMul;
    /* stride-8: r, a0, spd, yj, sz, ax, ay, ba */
    groups[si].push(r, a, spd, yj, sz,
                    0.72 + Math.random()*0.75,
                    0.72 + Math.random()*0.75,
                    ba);
    return f;
  }

  const N = w < 600 ? 3500 : w < 1000 ? 6000 : 9000;
  let cCnt=0, mCnt=0, eCnt=0;
  for (let i=0; i<N; i++){
    const r = rIn + (rOut-rIn) * Math.pow(Math.random(), 0.9);
    const f = push(r);
    if (f < 0.33) cCnt++; else if (f < 0.66) mCnt++; else eCnt++;
  }
  for (let i=0; i<Math.round(cCnt*1.0);   i++) push(rIn+(rOut-rIn)*0.33*Math.pow(Math.random(),0.8));
  for (let i=0; i<Math.round(mCnt*0.125); i++) push(rIn+(rOut-rIn)*(0.33+0.33*Math.random()));
  for (let i=0; i<Math.round(eCnt*0.10);  i++) push(rOut*(0.68+Math.random()*0.48));
  const addF = Math.round(eCnt * 0.68);
  for (let i=0; i<addF; i++) push(rOut*(1.0+Math.pow(Math.random(),1.6)*0.6), undefined, 0.6);
  /* above-plane haze — based on total so far across all groups */
  const total = groups.reduce((s,g) => s + g.length, 0) / 8;
  const addAbove = Math.round(total * 0.20);
  for (let i=0; i<addAbove; i++){
    const r = rIn + (rOut-rIn) * Math.pow(Math.random(), 0.9);
    const f = (r-rIn) / (rOut-rIn);
    push(r, 4 + Math.pow(Math.random(),1.6)*(80*(1-Math.min(1,f))+12), 0.85);
  }

  /* convert each group → Float32Array and record count */
  return groups.map((g, i) => {
    discCounts[i] = g.length / 8;
    return new Float32Array(g);
  });
}

function buildStars(){
  const d = [];
  for (let i=0; i<780; i++){
    const u  = Math.random()*2-1,  t = Math.random()*Math.PI*2;
    const rr = Math.sqrt(1-u*u),   R = 1500+Math.random()*700;
    d.push(R*rr*Math.cos(t), R*u, R*rr*Math.sin(t),
           0.3+Math.random()*0.7, Math.random()*6.28, 1+Math.random()*2);
  }
  return new Float32Array(d);
}

/* ── VAO builder helpers ─────────────────────────────────────────────────── */
function bindScalar(prog, name, buf, stride, offset, divisor){
  const l = gl.getAttribLocation(prog, name);
  if (l < 0) return;
  gl.enableVertexAttribArray(l);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(l, 1, gl.FLOAT, false, stride, offset);
  gl.vertexAttribDivisor(l, divisor);
}
function bindVec(prog, name, size, buf, stride, offset, divisor){
  const l = gl.getAttribLocation(prog, name);
  if (l < 0) return;
  gl.enableVertexAttribArray(l);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(l, size, gl.FLOAT, false, stride, offset);
  gl.vertexAttribDivisor(l, divisor);
}

/* ── Initialisation ──────────────────────────────────────────────────────── */
function init(c, w, h, dpr){
  canvas = c;
  gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, powerPreference: 'high-performance'
  });
  if (!gl){
    const ctx2d = canvas.getContext('2d');
    if (ctx2d){ canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx2d.fillStyle='#030109'; ctx2d.fillRect(0,0,canvas.width,canvas.height); }
    return false;
  }

  discProg = mkProg(DISC_VS, DISC_FS);
  starProg = mkProg(STAR_VS, STAR_FS);
  haloProg = mkProg(HALO_VS, HALO_FS);

  for (const n of ['u_t','u_f','u_dx','u_dy','u_vp']) U.disc[n] = gl.getUniformLocation(discProg, n);
  U.disc.u_sprite = gl.getUniformLocation(discProg, 'u_sprite');
  for (const n of ['u_now','u_f','u_vp']) U.star[n] = gl.getUniformLocation(starProg, n);
  for (const n of ['u_vp','u_dx','u_dy','u_f']) U.halo[n] = gl.getUniformLocation(haloProg, n);

  /* shared billboard quad: 4 corners as (-0.5,-0.5)..(0.5,0.5) */
  quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5,-0.5, 0.5,-0.5, -0.5,0.5, 0.5,0.5]), gl.STATIC_DRAW);

  /* fullscreen triangle for halo */
  haloBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, haloBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

  /* star VAO */
  starBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
  gl.bufferData(gl.ARRAY_BUFFER, buildStars(), gl.STATIC_DRAW);
  starVAO = gl.createVertexArray();
  gl.bindVertexArray(starVAO);
  bindVec(starProg, 'a_corner', 2, quadBuf, 8,  0, 0);
  bindVec(starProg, 'a_pos',    3, starBuf, 24, 0, 1);
  bindVec(starProg, 'a_bps',    3, starBuf, 24, 12, 1);
  gl.bindVertexArray(null);

  /* halo VAO */
  haloVAO = gl.createVertexArray();
  gl.bindVertexArray(haloVAO);
  bindVec(haloProg, 'a_pos', 2, haloBuf, 0, 0, 0);
  gl.bindVertexArray(null);

  /* 8 sprite textures + 8 disc VAOs */
  for (let si=0; si<8; si++){
    discTextures[si] = makeSpriteTex(si);
    discBufs[si] = gl.createBuffer();
    discVAOs[si] = gl.createVertexArray();
    gl.bindVertexArray(discVAOs[si]);
    bindVec(discProg,    'a_corner', 2, quadBuf,       8,  0,  0);  /* per-vertex */
    bindScalar(discProg, 'a_r',      discBufs[si], 32,  0,  1);
    bindScalar(discProg, 'a_a0',     discBufs[si], 32,  4,  1);
    bindScalar(discProg, 'a_spd',    discBufs[si], 32,  8,  1);
    bindScalar(discProg, 'a_yj',     discBufs[si], 32, 12,  1);
    bindScalar(discProg, 'a_sz',     discBufs[si], 32, 16,  1);
    bindScalar(discProg, 'a_ax',     discBufs[si], 32, 20,  1);
    bindScalar(discProg, 'a_ay',     discBufs[si], 32, 24,  1);
    bindScalar(discProg, 'a_ba',     discBufs[si], 32, 28,  1);
    gl.bindVertexArray(null);
  }

  applyResize(w, h, dpr);
  return true;
}

/* ── Resize: rebuild disc buffers for new viewport width ─────────────────── */
function applyResize(w, h, dpr){
  W = w; H = h;
  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  cam.f  = Math.min(W * 0.92, H * 1.25);
  diskY  = 0.46 * H - 0.21 * cam.f;
  diskX  = -0.20 * (W / 2);

  /* upload each group's Float32Array to its VRAM buffer */
  const groups = buildDisk(W);
  for (let si=0; si<8; si++){
    gl.bindBuffer(gl.ARRAY_BUFFER, discBufs[si]);
    gl.bufferData(gl.ARRAY_BUFFER, groups[si], gl.STATIC_DRAW);
  }
}

/* ── Draw: 3 phases, 10 draw calls total (1 stars + 1 halo + 8 disc groups) */
function draw(now){
  rafId = requestAnimationFrame(draw);
  const t = (now - startWall - totalPauseMs) * 0.001;

  gl.clearColor(0.012, 0.004, 0.035, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);

  /* ── 1. Stars: normal alpha blend (canvas source-over equivalent) ──────── */
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(starProg);
  gl.uniform1f(U.star.u_now, now);
  gl.uniform1f(U.star.u_f,   cam.f);
  gl.uniform2f(U.star.u_vp,  W, H);
  gl.bindVertexArray(starVAO);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 780);

  /* ── 2 & 3. Halo + disc: additive blend (canvas 'lighter' equivalent) ─── */
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  /* 2. Halo */
  gl.useProgram(haloProg);
  gl.uniform2f(U.halo.u_vp, W, H);
  gl.uniform1f(U.halo.u_dx, diskX);
  gl.uniform1f(U.halo.u_dy, diskY);
  gl.uniform1f(U.halo.u_f,  cam.f);
  gl.bindVertexArray(haloVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  /* 3. Disc — 8 parallel GPU sweeps, one per colour group */
  gl.useProgram(discProg);
  gl.uniform1f(U.disc.u_t,  t);
  gl.uniform1f(U.disc.u_f,  cam.f);
  gl.uniform1f(U.disc.u_dx, diskX);
  gl.uniform1f(U.disc.u_dy, diskY);
  gl.uniform2f(U.disc.u_vp, W, H);
  gl.uniform1i(U.disc.u_sprite, 0);
  gl.activeTexture(gl.TEXTURE0);
  for (let si=0; si<8; si++){
    if (discCounts[si] === 0) continue;
    gl.bindTexture(gl.TEXTURE_2D, discTextures[si]);
    gl.bindVertexArray(discVAOs[si]);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, discCounts[si]);
  }

  gl.bindVertexArray(null);
}

/* ── Pause / resume (tab visibility) ─────────────────────────────────────── */
function pause(){
  if (rafId){ cancelAnimationFrame(rafId); rafId=0; pausedAt=performance.now(); }
}
function resume(){
  if (pausedAt){ totalPauseMs += performance.now()-pausedAt; pausedAt=0; }
  if (!rafId) rafId = requestAnimationFrame(draw);
}

self.onmessage = function(e){
  const d = e.data;
  if      (d.type === 'init')       { if (!init(d.canvas,d.W,d.H,d.dpr)) return; startWall=performance.now(); resume(); }
  else if (d.type === 'resize')     { applyResize(d.W, d.H, d.dpr); }
  else if (d.type === 'visibility') { d.hidden ? pause() : resume(); }
};
`;

export default function BgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Guards against React Strict Mode double-invoking the effect —
  // a canvas can only be transferred to a worker once.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getDpr = () =>
      Math.min(window.devicePixelRatio || 1, window.innerWidth >= 1500 ? 1 : 1.5);

    // Fallback: no OffscreenCanvas support — paint base colour once, no animation.
    if (typeof OffscreenCanvas === "undefined" || !canvas.transferControlToOffscreen) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = "#030109";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      startedRef.current = true;
      return;
    }

    startedRef.current = true;

    const offscreen = canvas.transferControlToOffscreen();
    const blob   = new Blob([WORKER_SRC], { type: "application/javascript" });
    const url    = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.postMessage(
      { type: "init", canvas: offscreen, W: window.innerWidth, H: window.innerHeight, dpr: getDpr() },
      [offscreen],
    );

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => worker.postMessage({ type: "resize", W: window.innerWidth, H: window.innerHeight, dpr: getDpr() }),
        150,
      );
    };
    const onVisibility = () => worker.postMessage({ type: "visibility", hidden: document.hidden });

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    URL.revokeObjectURL(url);
    // Canvas lives for the app's lifetime; no teardown needed.
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
