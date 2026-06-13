import type { FoodVisionProvider, FoodPrediction } from './types';

// ── Gemini provider ─────────────────────────────────────────────────────────
// Direct Gemini call (used as a personal-key fallback, e.g. local dev).
// Reads packaging labels via OCR and identifies brand + product first.
const geminiProvider: FoodVisionProvider = {
  id: 'gemini',
  label: 'Gemini 1.5 Flash (personal key)',
  requiresKey: true,
  async analyze(img, deps, opts) {
    if (!opts.apiKey) throw new Error('Add your Gemini API key in Account → AI Scanner.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${opts.apiKey}`;
    const prompt =
      'You are a food & packaged-product recognition system with OCR. Examine the photo carefully.\n' +
      '1) If it shows a PACKAGED PRODUCT, SUPPLEMENT, or any LABEL/wrapper, READ the visible text (OCR) and identify ' +
      'the exact BRAND and PRODUCT NAME first (e.g. "MuscleBlaze Biozyme Performance Whey", "Amul Masti Dahi").\n' +
      '2) Otherwise identify the prepared dish/food (prefer Indian dishes).\n' +
      'Return ONLY a JSON array of up to 3 guesses, most likely first, each: ' +
      '{"name":"brand + product or dish name","confidence":0.0-1.0}. No prose, no markdown.';
    console.log('[gemini] request sent · model=gemini-1.5-flash · imageBytes≈', img.base64.length, '· mime=', img.mime);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: img.mime, data: img.base64 } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    });
    console.log('[gemini] response status:', res.status);
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json())?.error?.message ?? ''; } catch { /* ignore */ }
      console.error('[gemini] error body:', detail);
      if (res.status === 400 || res.status === 403) throw new Error('Gemini rejected the key. Check it in Account → AI Scanner.');
      if (res.status === 429) throw new Error('Gemini rate limit hit. Wait a moment and try again.');
      throw new Error(`Gemini error ${res.status}. ${detail}`.trim());
    }
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    console.log('[gemini] raw response text:', text);
    let parsed: { name: string; confidence?: number }[] = [];
    try { parsed = JSON.parse(text); } catch { console.error('[gemini] JSON parse failed'); throw new Error('Could not read the AI response. Try again.'); }
    if (!Array.isArray(parsed)) parsed = [];
    const predictions: FoodPrediction[] = parsed
      .filter((p) => p && p.name)
      .slice(0, 3)
      .map((p) => {
        const match = deps.matchFood(p.name);
        return { name: match?.name ?? p.name, foodId: match?.id, confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0.5)) };
      });
    console.log('[gemini] parsing succeeded · predictions:', predictions.length);
    return { predictions };
  },
};

// ── Server provider (DEFAULT) ───────────────────────────────────────────────
// Calls our serverless /api/scan (Gemini key held server-side). Works for ALL
// users with no key. Throws { code:'unconfigured' } when the function/env isn't
// set up so the caller can fall back to a personal key (e.g. local dev).
export class UnconfiguredError extends Error { code = 'unconfigured' as const; }

const serverProvider: FoodVisionProvider = {
  id: 'server',
  label: 'Macro Katori AI',
  requiresKey: false,
  async analyze(img, deps) {
    console.log('[scan] calling /api/scan · imageBytes≈', img.base64.length);
    let res: Response;
    try {
      res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: img.base64, mime: img.mime }),
      });
    } catch {
      throw new UnconfiguredError('Scan service unreachable');
    }
    const ct = res.headers.get('content-type') || '';
    console.log('[scan] /api/scan status:', res.status, '· content-type:', ct);
    // 404/501 or non-JSON (e.g. SPA HTML in local dev) => not configured here.
    if (res.status === 404 || res.status === 501 || !ct.includes('application/json')) {
      throw new UnconfiguredError('Scan service not configured');
    }
    const data: any = await res.json().catch(() => ({}));
    if (data?.error === 'not_configured') throw new UnconfiguredError('Server key not set');
    if (!res.ok) {
      if (data?.status === 429) throw new Error('Scanner is busy right now. Try again in a moment.');
      throw new Error('Scanner failed. Please try again.');
    }
    const predictions: FoodPrediction[] = (data?.predictions || [])
      .filter((p: any) => p && p.name)
      .slice(0, 3)
      .map((p: any) => {
        const match = deps.matchFood(p.name);
        return { name: match?.name ?? p.name, foodId: match?.id, confidence: Math.max(0, Math.min(1, Number(p.confidence) || 0.5)) };
      });
    console.log('[scan] parsed predictions:', predictions.length, predictions);
    return { predictions, note: 'Recognised by Macro Katori AI. Confirm before logging.' };
  },
};

// No demo provider: the scanner never shows random/placeholder predictions.
export const PROVIDERS: FoodVisionProvider[] = [serverProvider, geminiProvider];

export function getProvider(id: string): FoodVisionProvider {
  return PROVIDERS.find((p) => p.id === id) ?? serverProvider; // default = server
}
