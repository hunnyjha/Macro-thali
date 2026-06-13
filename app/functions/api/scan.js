// Cloudflare Pages Function — server-side AI food scan proxy.
// Route: POST /api/scan   Body: { base64, mime }
// The Gemini key lives ONLY in the GEMINI_API_KEY environment variable
// (Cloudflare dashboard → Settings → Environment variables), never in the app
// bundle, so users don't need their own key and the key stays private.

const PROMPT =
  'You are a food & packaged-product recognition system with OCR. Examine the photo carefully.\n' +
  '1) If it shows a PACKAGED PRODUCT, SUPPLEMENT, or any LABEL/wrapper, READ the visible text (OCR) and identify ' +
  'the exact BRAND and PRODUCT NAME first (e.g. "MuscleBlaze Biozyme Performance Whey", "Amul Masti Dahi").\n' +
  '2) Otherwise identify the prepared dish/food (prefer Indian dishes).\n' +
  'Return ONLY a JSON array of up to 3 guesses, most likely first, each: ' +
  '{"name":"brand + product or dish name","confidence":0.0-1.0}. No prose, no markdown.';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// Try current Gemini vision models in order; skip past any that have been
// retired (404 "is not found") so a deprecation can't silently break scanning.
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
    if (res.status !== 404) return res;
    const copy = res.clone();
    let detail = '';
    try { detail = (await copy.json())?.error?.message ?? ''; } catch { /* ignore */ }
    if (!/is not found|not supported/i.test(detail)) return res;
  }
  return res;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const key = env.GEMINI_API_KEY;
  if (!key) return json({ error: 'not_configured' }, 501);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const { base64, mime } = body || {};
  if (!base64) return json({ error: 'no_image' }, 400);

  const payload = {
    contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: mime || 'image/jpeg', data: base64 } }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  };

  let res;
  try {
    res = await callGemini(key, payload, env.GEMINI_MODEL);
  } catch {
    return json({ error: 'upstream_unreachable' }, 502);
  }

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message ?? ''; } catch { /* ignore */ }
    return json({ error: 'gemini', status: res.status, detail }, 502);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  let parsed = [];
  try { parsed = JSON.parse(text); } catch { /* leave empty */ }
  const predictions = (Array.isArray(parsed) ? parsed : [])
    .filter((p) => p && p.name)
    .slice(0, 3)
    .map((p) => ({ name: String(p.name), confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0.5)) }));
  return json({ predictions });
}
