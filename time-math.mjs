export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function flowLabel(value) { return Math.abs(value) < .05 ? '時間凝止' : value < 0 ? '時間倒流' : '時間流動'; }
export function particlePosition(radius, angle, elevation = 0) { return [Math.cos(angle) * radius, elevation, Math.sin(angle) * radius]; }
export function renderScale(width, height, ratio, light = false) { return Math.min(ratio || 1, light ? 1 : 1.6, Math.sqrt(2200000 / Math.max(1, width * height))); }
export function seededRandom(seed = 2026) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
