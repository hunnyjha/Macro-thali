import type { FoodVisionProvider, FoodPrediction } from './types';

// ── Demo provider ───────────────────────────────────────────────────────────
// Free, on-device, no key. Returns plausible top-3 from the catalog so the full
// Scan → confirm → log flow works now. Honest: labelled as demo predictions.
const demoProvider: FoodVisionProvider = {
  id: 'demo',
  label: 'Demo (free, on-device)',
  requiresKey: false,
  async analyze(_img, deps) {
    await new Promise((r) => setTimeout(r, 900)); // simulate inference
    const picks = deps.sampleFoods(3);
    const confs = [0.74, 0.51, 0.32];
    const predictions: FoodPrediction[] = picks.map((f, i) => ({
      name: f.name,
      foodId: f.id,
      confidence: confs[i] ?? 0.25,
    }));
    return { predictions, note: 'Demo predictions — add a Gemini key in Account for real photo recognition.' };
  },
};

// ── Gemini provider ─────────────────────────────────────────────────────────
// Google Gemini 1.5 Flash (free tier). Activates when the user supplies a key.
// Returns dish names which we ground to catalog ids via deps.matchFood.
const geminiProvider: FoodVisionProvider = {
  id: 'gemini',
  label: 'Gemini 1.5 Flash (free tier)',
  requiresKey: true,
  async analyze(img, deps, opts) {
    if (!opts.apiKey) throw new Error('Add your Gemini API key in Account → AI Scanner.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${opts.apiKey}`;
    const prompt =
      'Identify the Indian (or general) food in this photo. Reply ONLY with a JSON array of up to 3 guesses, ' +
      'most likely first: [{"name":"dish name","confidence":0.0-1.0}]. No prose.';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: img.mime, data: img.base64 } }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}. Check your key or quota.`);
    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    let parsed: { name: string; confidence?: number }[] = [];
    try { parsed = JSON.parse(text); } catch { throw new Error('Could not read the AI response. Try again.'); }
    const predictions: FoodPrediction[] = parsed.slice(0, 3).map((p) => {
      const match = deps.matchFood(p.name);
      return { name: match?.name ?? p.name, foodId: match?.id, confidence: Math.max(0, Math.min(1, p.confidence ?? 0.5)) };
    });
    return { predictions };
  },
};

export const PROVIDERS: FoodVisionProvider[] = [demoProvider, geminiProvider];

export function getProvider(id: string): FoodVisionProvider {
  return PROVIDERS.find((p) => p.id === id) ?? demoProvider;
}
