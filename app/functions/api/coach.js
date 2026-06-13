// Cloudflare Pages Function — server-side Macro Coach proxy.
// Route: POST /api/coach   Body: { system, question, history? }
// Uses the hosted GEMINI_API_KEY (Cloudflare → Settings → Environment variables)
// so every user gets a real, reasoning coach grounded in the Coach Brain
// system prompt — no personal key required, and the key never ships in the bundle.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// Try current Gemini models in order; skip past any that have been retired
// (404 "is not found") so a single deprecation can't silently break the coach.
async function callGemini(key, payload, preferred) {
  const models = [preferred, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
    .filter(Boolean).filter((m, i, a) => a.indexOf(m) === i);
  let res;
  for (const model of models) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    );
    if (res.ok) return res;
    if (res.status !== 404) return res; // real error (auth, quota…) — stop
    // 404 → model retired/unknown; clone-read detail then try the next model
    const copy = res.clone();
    let detail = '';
    try { detail = (await copy.json())?.error?.message ?? ''; } catch { /* ignore */ }
    if (!/is not found|not supported/i.test(detail)) return res;
  }
  return res; // all exhausted — return last response for error reporting
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const key = env.GEMINI_API_KEY;
  if (!key) return json({ error: 'not_configured' }, 501);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const { system, question, history } = body || {};
  if (!question) return json({ error: 'no_question' }, 400);

  // Rebuild the conversation so the coach has memory of the chat so far.
  const contents = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      if (!h || !h.text) continue;
      contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: String(h.text) }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: String(question) }] });

  const payload = {
    systemInstruction: system ? { parts: [{ text: String(system) }] } : undefined,
    contents,
    generationConfig: { temperature: 0.6 },
  };

  let res, lastStatus = 0, lastDetail = '';
  try {
    res = await callGemini(key, payload, env.GEMINI_MODEL);
  } catch {
    return json({ error: 'upstream_unreachable' }, 502);
  }
  if (!res.ok) {
    lastStatus = res.status;
    try { lastDetail = (await res.json())?.error?.message ?? ''; } catch { /* ignore */ }
    return json({ error: 'gemini', status: lastStatus, detail: lastDetail }, 502);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) return json({ error: 'empty' }, 502);
  return json({ reply });
}
