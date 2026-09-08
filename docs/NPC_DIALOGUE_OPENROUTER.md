# Alderwatch NPC dialogue + OpenRouter

## What ships without any API key

NPC conversation is fully playable offline. Every Alderbrook NPC has a authored persona, profession, opinions about other townsfolk, topic banks, suggested questions, relationship-aware gossip, and deterministic fallback replies. NPCs also gossip, trade, and beef with each other in nearby ambient events.

The browser always prefers the same-origin `/api/npc-chat` endpoint when it exists. If that endpoint is missing, disabled, slow, or unavailable, dialogue falls back to the authored bank instead of blocking gameplay.

## Why the OpenRouter key never goes in the browser

Alderwatch is currently a static Vite deployment. Putting `OPENROUTER_API_KEY` into a `VITE_*` variable would ship the secret to every browser. Do not do that.

`server/npc-chat-server.mjs` is a tiny loopback-only Node proxy. Nginx should expose only `/api/npc-chat` to the game origin. The proxy owns the API key, request size cap, same-origin check, rate limit, short-output cap, model selection, and OpenRouter call.

OpenRouter's current API is the OpenAI-compatible `POST https://openrouter.ai/api/v1/chat/completions` endpoint using `Authorization: Bearer ...`. The app attribution headers are `HTTP-Referer` and `X-OpenRouter-Title`.

## Cheap model configuration

The proxy defaults to:

```text
OPENROUTER_MODEL=openrouter/free
```

That is ideal for first bring-up. Later, set `OPENROUTER_MODEL` to any inexpensive model slug from the live OpenRouter catalog without changing game code. Keep `OPENROUTER_MAX_TOKENS` around 100-160 for NPC banter; Alderwatch deliberately sends only the last six turns and compact world context so a conversation does not grow into a giant token bill.

## Server bring-up once Jared provides the key

On the Hetzner host, keep the key in a root/service-readable environment file, never under `/opt/infra/alderwatch/current` and never in git.

Example service environment:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/free
OPENROUTER_MAX_TOKENS=140
OPENROUTER_APP_TITLE='Alderwatch NPCs'
ALDERWATCH_ORIGIN='https://alderwatch.167.233.105.77.sslip.io'
NPC_CHAT_HOST=127.0.0.1
NPC_CHAT_PORT=8787
```

Example systemd unit (paths may be adjusted to the final host layout):

```ini
[Unit]
Description=Alderwatch NPC dialogue proxy
After=network-online.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/infra/alderwatch/current
EnvironmentFile=/etc/alderwatch/npc-chat.env
ExecStart=/usr/bin/node /opt/infra/alderwatch/current/server/npc-chat-server.mjs
Restart=on-failure
RestartSec=2
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Nginx location inside the Alderwatch HTTPS server:

```nginx
location = /api/npc-chat {
    proxy_pass http://127.0.0.1:8787/api/npc-chat;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Origin $scheme://$host;
    proxy_read_timeout 8s;
}
```

Before enabling it publicly:

```bash
curl http://127.0.0.1:8787/health
curl -X POST http://127.0.0.1:8787/api/npc-chat \
  -H 'Content-Type: application/json' \
  -d '{"npcId":"mara","npcName":"Mara Pennymarch","role":"Trader","message":"Any rumors?","history":[]}'
```

## Authority boundary

The language model is flavor, not game authority. It cannot grant or remove crowns, items, reputation, skills, quest state, combat outcomes, or save mutations. Actual trade still goes through `market.ts`; actual game actions remain deterministic state commands. This lets NPCs lie, joke, threaten, bargain, and gossip without handing the simulation to a text model.

## Autonomous NPC conversation budget

NPC-to-NPC chatter uses authored dialogue immediately. The client may ask the same proxy for an enhanced ambient line at a slow cadence, but it caches provider unavailability and does not spam requests when the proxy/key is absent. Keep autonomous model calls sparse even with a cheap model; gameplay should never depend on them.
