/**
 * helpers.js — HTML utility functions shared across pages
 */

/**
 * Escape a string for safe insertion into HTML.
 * Always use this when inserting user-supplied data into innerHTML.
 */
export function esc(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Build an initials-based avatar element (as an HTML string).
 * @param {string} firstName
 * @param {string} [lastName]
 */
export function initialsAvatar(firstName, lastName) {
  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?'

  // Deterministic colour based on first character code
  const palette = [
    '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB',
    '#1DD1A1', '#54A0FF', '#5F27CD', '#C44569',
  ]
  const bg = palette[(firstName?.charCodeAt(0) ?? 0) % palette.length]

  return `
    <div class="w-full h-full flex items-center justify-center font-bold text-2xl text-white"
         style="background:${bg}">
      ${initials}
    </div>
  `
}
