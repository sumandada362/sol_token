/**
 * k6 load test — run with:
 *   k6 run --vus 50 --duration 10m scripts/load-test-api.js
 *   k6 run --vus 50 --duration 10m -e BASE_URL=https://your-preview.vercel.app scripts/load-test-api.js
 *
 * Success criteria (from QA matrix B4):
 *   - Zero 5xx during the run
 *   - p95 response time < 2 000 ms
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

export const options = {
  vus: 50,
  duration: "10m",
  thresholds: {
    http_req_failed: ["rate<0.01"],       // <1% non-2xx/3xx
    http_req_duration: ["p(95)<2000"],    // 95th pct < 2 s
    "checks{type:no_5xx}": ["rate>0.99"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

const FAKE_PUBKEY = "11111111111111111111111111111111";
const FAKE_SIG    = "5A" + "A".repeat(85);  // 87-char base58-ish string

const txPayload = JSON.stringify({
  payer: FAKE_PUBKEY,
  name: "LoadTest",
  symbol: "LT",
  decimals: 9,
  supply: "1000000",
  revokeMint: false,
  revokeFreeze: false,
});

const confirmPayload = JSON.stringify({
  signature: FAKE_SIG,
  action: "createToken",
  wallet: FAKE_PUBKEY,
});

const HEADERS = { "Content-Type": "application/json" };

export default function () {
  // 1. Transaction builder
  const txRes = http.post(`${BASE_URL}/api/tx/create-token`, txPayload, { headers: HEADERS });
  check(txRes, {
    "tx builder not 5xx": (r) => r.status < 500,
  }, { type: "no_5xx" });

  // 2. Confirm endpoint (will 400 — tx doesn't exist — but must not 5xx)
  const confirmRes = http.post(`${BASE_URL}/api/confirm`, confirmPayload, { headers: HEADERS });
  check(confirmRes, {
    "confirm not 5xx": (r) => r.status < 500,
  }, { type: "no_5xx" });

  // 3. Static page — verifies ISR/CDN isn't blocking under load
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "home 200": (r) => r.status === 200,
  }, { type: "no_5xx" });

  sleep(0.2 + Math.random() * 0.6); // 200-800 ms jitter per VU
}
