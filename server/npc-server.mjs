// Alderwatch NPC dialogue service.
//
// The browser never holds the OpenRouter key. The game posts an npcId plus a line
// of player speech to /api/npc; this process attaches the persona and the key and
// talks upstream. It binds to loopback only — Caddy is the sole way in.
//
//   OPENROUTER_API_KEY   required; the process refuses to start without it
//   NPC_PORT             default 5011
//   NPC_MODEL            default mistralai/mistral-nemo
//   NPC_FALLBACK_MODEL   used when the primary is unavailable, default meta-llama/llama-3.1-8b-instruct
//   NPC_RATE_LIMIT       requests per minute per client IP, default 20

import { createServer } from 'node:http';
import { buildMessages, validateRequest, RateLimiter, MAX_REPLY_TOKENS } from './personas.mjs';

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error('OPENROUTER_API_KEY is not set — refusing to start.');
  process.exit(1);
}

const PORT = Number(process.env.NPC_PORT ?? 5011);
const MODEL = process.env.NPC_MODEL ?? 'mistralai/mistral-nemo';
const FALLBACK = process.env.NPC_FALLBACK_MODEL ?? 'meta-llama/llama-3.1-8b-instruct';
const RATE_LIMIT = Number(process.env.NPC_RATE_LIMIT ?? 20);
const UPSTREAM = 'https://openrouter.ai/api/v1/chat/completions';
const UPSTREAM_TIMEOUT_MS = 20_000;
const MAX_BODY_BYTES = 8 * 1024;

const limiter = new RateLimiter(RATE_LIMIT, 60_000);
setInterval(() => limiter.sweep(), 60_000).unref();

const send = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
};

// Caddy terminates the connection, so the left-most forwarded address is the player.
const clientIp = req => (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
  || req.socket.remoteAddress || 'unknown';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Provider-side 429s are common on cheap models, so one retry and a second model are worth having. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

async function attempt(messages) {
  const response = await fetch(UPSTREAM, {
    method: 'POST',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      authorization: 'Bearer ' + KEY,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://alderwatch.167.233.105.77.sslip.io',
      'X-Title': 'Alderwatch',
    },
    // `models` is OpenRouter's routing list: the second model is tried if the first is unavailable.
    body: JSON.stringify({ models: [MODEL, FALLBACK], messages, max_tokens: MAX_REPLY_TOKENS, temperature: 0.85 }),
  });
  if (!response.ok) {
    // Upstream text can echo request detail; log it, never return it.
    const error = new Error('upstream ' + response.status + ': ' + (await response.text()).slice(0, 300));
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  // A reasoning model can return null content once its budget is spent; treat that as a failure.
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('upstream returned no content');
  return reply;
}

async function ask(messages) {
  try {
    return await attempt(messages);
  } catch (error) {
    if (!RETRYABLE.has(error.status)) throw error;
    await new Promise(resolve => setTimeout(resolve, 700));
    return attempt(messages);
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/npc/health') return send(res, 200, { ok: true, model: MODEL });
  if (req.url !== '/api/npc') return send(res, 404, { error: 'Not found' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });

  const ip = clientIp(req);
  const { allowed, retryAfter } = limiter.take(ip);
  if (!allowed) {
    res.setHeader('retry-after', String(retryAfter));
    return send(res, 429, { error: 'They have said their piece for now. Try again shortly.' });
  }

  let parsed;
  try {
    parsed = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: 'Malformed request' });
  }

  const check = validateRequest(parsed);
  if (!check.ok) return send(res, check.status, { error: check.error });

  try {
    const reply = await ask(buildMessages(check.npcId, check.message, check.history));
    send(res, 200, { reply });
  } catch (error) {
    console.error('[npc]', check.npcId, String(error.message ?? error));
    send(res, 502, { error: 'They turn away, distracted. Try again in a moment.' });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`[npc] listening on 127.0.0.1:${PORT} model=${MODEL} fallback=${FALLBACK}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
