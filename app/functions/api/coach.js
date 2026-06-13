// Cloudflare Pages Function — server-side Macro Coach proxy.
// Route: POST /api/coach   Body: { system, question, history? }
// Uses the hosted GEMINI_API_KEY (Cloudflare → Settings → Environment variables)
// so every user gets a real, reasoning coach grounded in the Coach Brain
// system prompt — no personal key required, and the key never ships in the bundle.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

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

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: String(system) }] } : undefined,
          contents,
          generationConfig: { temperature: 0.6 },
        }),
      },
    );
  } catch {
    return json({ error: 'upstream_unreachable' }, 502);
  }

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message ?? ''; } catch { /* ignore */ }
    return json({ error: 'gemini', status: res.status, detail }, 502);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) return json({ error: 'empty' }, 502);
  return json({ reply });
}
