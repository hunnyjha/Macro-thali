import { useRef, useState } from 'react';

interface Props {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

// Freely editable numeric field. Users can clear/retype without the value
// snapping to min mid-edit; invalid input is clamped (or reverted) on blur.
// type="text" + inputMode keeps the numeric keyboard on mobile while avoiding
// the quirks of type="number" (spinners, silent empty values).
export function NumberInput({ label, suffix, value, min, max, onChange }: Props) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(',', '.'));
    const next = Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : value;
    const rounded = Math.round(next * 10) / 10;
    onChange(rounded);
    setText(String(rounded));
  };

  return (
    <div>
      <label className="mb-1 block text-xs text-ink-faint">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={focused.current ? text : String(value)}
        onFocus={(e) => { focused.current = true; setText(String(value)); e.target.select(); }}
        onChange={(e) => {
          // allow only digits and one decimal point while typing (incl. empty)
          const raw = e.target.value;
          if (/^\d*\.?\d*$/.test(raw)) setText(raw);
        }}
        onBlur={() => { focused.current = false; commit(text); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="input-surface w-full px-3 py-2.5 text-center font-display text-lg font-bold"
      />
      <p className="mt-0.5 text-center text-[10px] text-ink-faint">{suffix}</p>
    </div>
  );
}
