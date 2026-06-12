#!/usr/bin/env node
/**
 * Minimal in-memory Redis (RESP2) for local dev/QA on machines without Redis.
 * Implements exactly the commands FORGE uses: GET, SET (EX), DEL, EXPIRE,
 * ZADD, ZCARD, ZREMRANGEBYSCORE, PING — enough for lib/db/redis.ts and
 * lib/rateLimit.ts to behave like production.
 *
 *   node scripts/dev-redis.mjs   # listens on 127.0.0.1:6379
 *
 * NOT for production. No persistence, no auth, single process.
 */
import net from "net";

const PORT = Number(process.env.PORT ?? 6379);
const store = new Map(); // key -> { type: "string"|"zset", value, expireAt: ms|null }

function alive(key) {
  const e = store.get(key);
  if (!e) return null;
  if (e.expireAt !== null && Date.now() > e.expireAt) { store.delete(key); return null; }
  return e;
}

function encode(v) {
  if (v === null) return "$-1\r\n";
  if (typeof v === "number") return `:${v}\r\n`;
  if (typeof v === "string" && v.startsWith("+")) return `${v}\r\n`;
  const s = String(v);
  return `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
}

function run(args) {
  const cmd = args[0].toUpperCase();
  switch (cmd) {
    case "PING": return "+PONG";
    case "INFO": return "redis_version:7.0.0-devstub";
    case "COMMAND": return "+OK";
    case "GET": {
      const e = alive(args[1]);
      return e && e.type === "string" ? e.value : null;
    }
    case "SET": {
      let expireAt = null;
      for (let i = 3; i < args.length; i++) {
        if (args[i].toUpperCase() === "EX") expireAt = Date.now() + Number(args[i + 1]) * 1000;
      }
      store.set(args[1], { type: "string", value: args[2], expireAt });
      return "+OK";
    }
    case "DEL": {
      let n = 0;
      for (const k of args.slice(1)) if (store.delete(k)) n++;
      return n;
    }
    case "EXPIRE": {
      const e = alive(args[1]);
      if (!e) return 0;
      e.expireAt = Date.now() + Number(args[2]) * 1000;
      return 1;
    }
    case "ZADD": {
      let e = alive(args[1]);
      if (!e) { e = { type: "zset", value: new Map(), expireAt: null }; store.set(args[1], e); }
      let added = 0;
      for (let i = 2; i + 1 < args.length; i += 2) {
        if (!e.value.has(args[i + 1])) added++;
        e.value.set(args[i + 1], Number(args[i]));
      }
      return added;
    }
    case "ZCARD": {
      const e = alive(args[1]);
      return e && e.type === "zset" ? e.value.size : 0;
    }
    case "ZREMRANGEBYSCORE": {
      const e = alive(args[1]);
      if (!e || e.type !== "zset") return 0;
      const min = args[2] === "-inf" ? -Infinity : Number(args[2]);
      const max = args[3] === "+inf" ? Infinity : Number(args[3]);
      let removed = 0;
      for (const [member, score] of e.value) {
        if (score >= min && score <= max) { e.value.delete(member); removed++; }
      }
      return removed;
    }
    default:
      return new Error(`unknown command '${cmd}'`);
  }
}

const server = net.createServer((sock) => {
  let buf = Buffer.alloc(0);
  sock.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    let out = "";
    for (;;) {
      const parsed = parseOne(buf);
      if (!parsed) break;
      buf = buf.slice(parsed.consumed);
      const result = run(parsed.args);
      out += result instanceof Error ? `-ERR ${result.message}\r\n` : encode(result);
    }
    if (out) sock.write(out);
  });
  sock.on("error", () => {});
});

/** Parse one RESP array of bulk strings; returns { args, consumed } or null if incomplete. */
function parseOne(buf) {
  if (buf.length === 0 || buf[0] !== 0x2a /* '*' */) return null;
  let pos = buf.indexOf("\r\n");
  if (pos === -1) return null;
  const count = Number(buf.slice(1, pos));
  let offset = pos + 2;
  const args = [];
  for (let i = 0; i < count; i++) {
    if (buf[offset] !== 0x24 /* '$' */) return null;
    const lineEnd = buf.indexOf("\r\n", offset);
    if (lineEnd === -1) return null;
    const len = Number(buf.slice(offset + 1, lineEnd));
    const start = lineEnd + 2;
    if (buf.length < start + len + 2) return null;
    args.push(buf.slice(start, start + len).toString());
    offset = start + len + 2;
  }
  return { args, consumed: offset };
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`dev-redis (in-memory stub) listening on 127.0.0.1:${PORT}`);
});
