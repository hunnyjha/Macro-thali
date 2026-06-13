// Pluggable AI vision layer. Swapping providers (Demo / Gemini / OpenAI / Claude)
// requires no UI changes — components depend only on these interfaces.

export interface FoodPrediction {
  name: string;
  confidence: number; // 0..1
  foodId?: string;    // resolved catalog id when matched
}

export interface ScanResult {
  predictions: FoodPrediction[];
  note?: string;
}

export interface ImageInput {
  base64: string; // raw base64 (no data: prefix)
  mime: string;
}

// Dependencies a provider can use to ground predictions in our catalog.
export interface VisionDeps {
  sampleFoods: (n: number) => { id: string; name: string }[];
  matchFood: (name: string) => { id: string; name: string } | null;
}

export interface ProviderOpts {
  apiKey?: string;
}

export interface FoodVisionProvider {
  id: string;
  label: string;
  requiresKey: boolean;
  analyze: (img: ImageInput, deps: VisionDeps, opts: ProviderOpts) => Promise<ScanResult>;
}
