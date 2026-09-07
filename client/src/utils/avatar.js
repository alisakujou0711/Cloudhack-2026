// The account's mark — the initials and the colour drawn for a name. Shared by the header avatar
// and the settings page's record, which draw the same disc at two sizes; keeping one copy is what
// stops the two from ever disagreeing about a person's colour.

// How many `--avatar-tone-*` tokens index.css defines. The colour is picked from the name rather
// than stored, so it survives a reload without anything being persisted for it.
export const TONE_COUNT = 8;

// First letters of the first two words — "Mei Ling Tan" is ML, "Ravi" is R. A profile with no
// name cannot reach the header (the routing gate stops it), but an avatar with nothing in it
// would read as broken, so it falls back rather than rendering empty.
export function initialsFrom(name) {
  const letters = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  return letters || '?';
}

// djb2 over the whole name, so two accounts differing only in their surname still land on
// different tones. Deterministic by construction: same name in, same tone out, every load.
export function toneFrom(name) {
  const text = String(name || '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return Math.abs(hash) % TONE_COUNT;
}
