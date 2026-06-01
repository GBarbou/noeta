import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Locate `original` inside `text`, preferring the occurrence that lies inside
// the LLM-supplied `anchor` context (10-30 surrounding words). Falls back to a
// plain indexOf scan that skips ranges already consumed by other findings
// (`usedRanges`: array of [start, end] pairs). Returns the start index of the
// match, or -1 if none. Mirrors the original ProofreadEditor.jsx helper so both
// the highlight pass and scroll navigation pin to the same occurrence.
export function findInTextWithAnchor(text, original, anchor, usedRanges = []) {
  if (!original || !text) return -1;
  if (anchor && anchor.length > original.length) {
    let s = 0;
    while (s < text.length) {
      const ai = text.indexOf(anchor, s);
      if (ai === -1) break;
      const oi = anchor.indexOf(original);
      if (oi !== -1) {
        const ci = ai + oi;
        if (ci + original.length <= text.length && text.substring(ci, ci + original.length) === original) {
          const e = ci + original.length;
          if (!usedRanges.some(([rs, re]) => ci < re && e > rs)) return ci;
        }
      }
      s = ai + 1;
    }
  }
  let s = 0;
  while (s < text.length) {
    const i = text.indexOf(original, s);
    if (i === -1) return -1;
    const e = i + original.length;
    if (!usedRanges.some(([rs, re]) => i < re && e > rs)) return i;
    s = i + 1;
  }
  return -1;
}
