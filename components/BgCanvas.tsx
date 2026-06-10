"use client";

import { useEffect, useRef } from "react";

/**
 * Background accretion-disc animation.
 *
 * The entire render loop runs inside a Web Worker via OffscreenCanvas so it
 * never competes with scrolling / interaction on the main thread.
 */

// Worker source — runs the whole animation off the main thread.
const WORKER_SRC = `
let canvas, ctx, W, H, cx, cy, dpr;
const cam = { yaw: 0.65, pitch: 0.2, dist: 900, f: 1200 };
let diskY = 0, diskX = 0;

function applyResize(w, h, d) {
    W = w; H = h; dpr = d;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    cam.f  = Math.min(W * 0.92, H * 1.25);
    diskY  = 0.46 * H - 0.21 * cam.f;
    diskX  = -0.20 * cx; /* shift disc left by 20% of centre x */
}

function project(x, y, z) {
    const cyaw = Math.cos(cam.yaw), syaw = Math.sin(cam.yaw);
    const x1 =  x * cyaw + z * syaw;
    const z1 = -x * syaw + z * cyaw;
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const y2 =  y * cp + z1 * sp;
    const z2 = -y * sp + z1 * cp;
    const zz = z2 + cam.dist;
    if (zz < 1) return { vis: false };
    const s = cam.f / zz;
    return { vis: true, sx: cx + x1 * s, sy: cy - y2 * s, s };
}

const PALETTE = [
    'rgba(215,250,255,','rgba(120,240,255,','rgba(41,182,246,',
    'rgba(57,90,235,',  'rgba(124,77,255,', 'rgba(213,0,249,',
    'rgba(255,45,208,', 'rgba(255,170,60,'
];

function makeGlow(prefix) {
    const S = 32;
    const cv = new OffscreenCanvas(S, S);
    const g  = cv.getContext('2d');
    const rad = g.createRadialGradient(S/2,S/2,0, S/2,S/2,S/2);
    rad.addColorStop(0,    prefix + '1)');
    rad.addColorStop(0.3,  prefix + '0.28)');
    rad.addColorStop(0.65, prefix + '0.07)');
    rad.addColorStop(1,    prefix + '0)');
    g.fillStyle = rad; g.fillRect(0,0,S,S);
    return cv;
}

const SPRITES = PALETTE.map(makeGlow);
const rIn = 4, rOut = 470;
const DISK = [];

function makeParticle(r) {
    const a = Math.random() * Math.PI * 2;
    const f = (r - rIn) / (rOut - rIn);
    let si;
    if      (Math.random() < 0.05) si = 7;
    else if (f < 0.10) si = 0;
    else if (f < 0.26) si = 1;
    else if (f < 0.42) si = 2;
    else if (f < 0.58) si = 3;
    else if (f < 0.74) si = 4;
    else if (f < 0.88) si = 5;
    else               si = 6;
    let size = 0.6 + Math.pow(Math.random(), 3) * 9;
    if (Math.random() < 0.75) size *= 0.5;
    const thick = 80 * (1 - Math.min(1, f)) + 6;
    return {
        r, a, si, size,
        ax: 0.72 + Math.random() * 0.75,
        ay: 0.72 + Math.random() * 0.75,
        yJit: (Math.random() - 0.5) * thick,
        baseA: 0.3 + Math.random() * 0.7,
        speed: 0.020 * Math.pow(rOut / Math.max(rIn, r), 0.55)
    };
}

function buildDisk(w) {
    DISK.length = 0;
    const N = w < 600 ? 3500 : w < 1000 ? 6000 : 9000;
    let cCnt=0, mCnt=0, eCnt=0;
    for (let i = 0; i < N; i++) {
        const r = rIn + (rOut - rIn) * Math.pow(Math.random(), 0.9);
        DISK.push(makeParticle(r));
        const f = (r - rIn) / (rOut - rIn);
        if (f < 0.33) cCnt++; else if (f < 0.66) mCnt++; else eCnt++;
    }
    for (let i = 0; i < Math.round(cCnt * 1.0); i++)
        DISK.push(makeParticle(rIn + (rOut-rIn)*0.33*Math.pow(Math.random(),0.8)));
    for (let i = 0; i < Math.round(mCnt * 0.125); i++)
        DISK.push(makeParticle(rIn + (rOut-rIn)*(0.33+0.33*Math.random())));
    for (let i = 0; i < Math.round(eCnt * 0.10); i++)
        DISK.push(makeParticle(rOut*(0.68+Math.random()*0.48)));
    const addF = Math.round(eCnt * 0.68);
    for (let i = 0; i < addF; i++) {
        const p = makeParticle(rOut*(1.0+Math.pow(Math.random(),1.6)*0.6));
        p.baseA *= 0.6; DISK.push(p);
    }
    const addAbove = Math.round(DISK.length * 0.20);
    for (let i = 0; i < addAbove; i++) {
        const r = rIn + (rOut-rIn)*Math.pow(Math.random(),0.9);
        const p = makeParticle(r);
        const f = (r-rIn)/(rOut-rIn);
        p.yJit = 4 + Math.pow(Math.random(),1.6)*(80*(1-Math.min(1,f))+12);
        p.baseA *= 0.85; DISK.push(p);
    }
}

const STARS = [];
for (let i = 0; i < 780; i++) {
    const u = Math.random()*2-1, t = Math.random()*Math.PI*2;
    const rr = Math.sqrt(1-u*u), R = 1500+Math.random()*700;
    STARS.push({
        x: R*rr*Math.cos(t), y: R*u, z: R*rr*Math.sin(t),
        b: 0.3+Math.random()*0.7, ph: Math.random()*6.28,
        sp: 1+Math.random()*2
    });
}

let last = 0;

function draw(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#030109';
    ctx.fillRect(0, 0, W, H);

    for (const st of STARS) {
        const p = project(st.x, st.y, st.z);
        if (!p.vis) continue;
        const tw = st.b * (0.55 + 0.45 * Math.sin(now * 0.001 * st.sp + st.ph));
        ctx.fillStyle = 'rgba(255,255,255,' + tw + ')';
        ctx.fillRect(p.sx, p.sy, 1.4, 1.4);
    }

    ctx.globalCompositeOperation = 'lighter';
    const core = project(0, 0, 0);

    /* tilt the whole disc 15 degrees clockwise around its centre */
    const tilt = 15 * Math.PI / 180;
    const pivotX = core.sx + diskX, pivotY = core.sy + diskY;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(tilt);
    ctx.translate(-pivotX, -pivotY);

    ctx.save();
    ctx.translate(core.sx + diskX, core.sy + diskY + rOut * core.s * 0.16);
    ctx.scale(1, Math.max(0.12, Math.sin(cam.pitch)));
    const hr = rOut * core.s * 1.15;
    const hg = ctx.createRadialGradient(0,0,0, 0,0,hr);
    hg.addColorStop(0,    'rgba(60,190,235,0.12)');
    hg.addColorStop(0.4,  'rgba(70,90,225,0.078)');
    hg.addColorStop(0.75, 'rgba(150,40,205,0.066)');
    hg.addColorStop(1,    'rgba(80,20,120,0)');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(0,0,hr,0,6.283); ctx.fill();
    ctx.restore();

    const cyaw = Math.cos(cam.yaw), syaw = Math.sin(cam.yaw);
    const cpit = Math.cos(cam.pitch), spit = Math.sin(cam.pitch);
    const fcl = cam.f, dist = cam.dist, oy = cy + diskY, ox = cx + diskX;
    for (const p of DISK) {
        p.a += p.speed * dt;
        const x = p.r*Math.cos(p.a), z = p.r*Math.sin(p.a), y = p.yJit;
        const x1 = x*cyaw + z*syaw;
        const z1 = -x*syaw + z*cyaw;
        const z2 = -y*spit + z1*cpit;
        const zz = z2 + dist;
        if (zz < 1) continue;
        const s = fcl / zz;
        const d = p.size * s * 1.7;
        const w = d*p.ax, h = d*p.ay;
        const a = p.baseA * s;
        ctx.globalAlpha = a < 1 ? a : 1;
        ctx.drawImage(SPRITES[p.si], (ox+x1*s)-w/2, (oy-(y*cpit+z1*spit)*s)-h/2, w, h);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    requestAnimationFrame(draw);
}

self.onmessage = function(e) {
    const d = e.data;
    if (d.type === 'init') {
        canvas = d.canvas;
        ctx    = canvas.getContext('2d');
        applyResize(d.W, d.H, d.dpr);
        buildDisk(d.W);
        last = performance.now();
        requestAnimationFrame(draw);
    } else if (d.type === 'resize') {
        applyResize(d.W, d.H, d.dpr);
    } else if (d.type === 'visibility') {
        if (!d.hidden) last = performance.now();
    }
};
`;

export default function BgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Guards against React Strict Mode double-invoking the effect (a canvas can
  // only be transferred to a worker once).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getDpr = () =>
      Math.min(window.devicePixelRatio || 1, window.innerWidth >= 1500 ? 1 : 1.5);

    // Fallback: no OffscreenCanvas support — paint the base colour once.
    if (typeof OffscreenCanvas === "undefined" || !canvas.transferControlToOffscreen) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.fillStyle = "#030109";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      startedRef.current = true;
      return;
    }

    startedRef.current = true;

    const offscreen = canvas.transferControlToOffscreen();
    const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        W: window.innerWidth,
        H: window.innerHeight,
        dpr: getDpr(),
      },
      [offscreen],
    );

    const onResize = () =>
      worker.postMessage({
        type: "resize",
        W: window.innerWidth,
        H: window.innerHeight,
        dpr: getDpr(),
      });
    const onVisibility = () =>
      worker.postMessage({ type: "visibility", hidden: document.hidden });

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    // The worker has already loaded the script, so the URL can be released.
    URL.revokeObjectURL(url);

    // This canvas lives in the root layout for the app's lifetime; no teardown
    // is needed (and avoids breaking the one-shot OffscreenCanvas transfer).
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
