// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import SettingsData from '@/data/settings.json'

// ////////////////////////////////////////////////////////////////////// Exports
// -----------------------------------------------------------------------------
/**
 * Resolve the list of font metadata objects to expose in the UI for a given verse.
 * - Falls back to global defaults from `@/data/settings.json` when no override exists
 * - Accepts `verseDoc.settings.fonts` as an ordered array of COMPLETE font objects
 *   matching the shape of `settings.json` → fonts[]:
 *   { class, display, styleAttribute, fontFaceDeclaration, default? }
 * - Preserves the verse-specified order; ignores unknown classes gracefully
 *
 * @param {Object} verseDoc - The verse document as returned by the API
 * @returns {Array<Object>} - Array of font metadata objects (display, class, styleAttribute, fontFaceDeclaration, ...)
 */
export function useResolveVerseFonts(verseDoc) {
  const defaults = Array.isArray(SettingsData?.fonts) ? SettingsData.fonts : []
  const selected = Array.isArray(verseDoc?.settings?.fonts) ? verseDoc.settings.fonts : null
  if (!selected || selected.length === 0) {
    return defaults
  }

  // Map defaults by class for quick lookup; build result preserving verse order
  const byClass = new Map(defaults.map(f => [f.class, f]))
  return selected
    .map(item => {
      // Accept full object or legacy string
      if (typeof item === 'object' && item) {
        // If class matches a known default, merge to ensure complete shape
        if (item.class && byClass.has(item.class)) {
          return Object.assign({}, byClass.get(item.class), item)
        }
        // If it's already a complete object (fontFaceDeclaration/display present), trust it
        if (item.fontFaceDeclaration || item.display || item.styleAttribute) {
          return item
        }
        return null
      }
      if (typeof item === 'string') {
        return byClass.get(item) || null
      }
      return null
    })
    .filter(Boolean)
}

/**
 * Get the site's global default body font declaration string from settings.json.
 * @returns {string} - e.g., "\"Source Sans Pro\", sans-serif"
 */
export function getGlobalDefaultBodyFontDeclaration() {
  const defaults = Array.isArray(SettingsData?.fonts) ? SettingsData.fonts : []
  const preferred = defaults.find(f => f.default === true) || defaults[0]
  return preferred?.fontFaceDeclaration || '"Source Sans Pro", sans-serif'
}

/**
 * Resolve the body font declaration to use for a verse.
 * Preference order:
 * 1) An entry within the verse-resolved list that is marked default
 * 2) The first entry in the verse-resolved list
 * 3) The global default from settings.json
 *
 * @param {Object} verseDoc
 * @returns {string} - CSS font-family declaration string
 */
export function resolveVerseBodyFontDeclaration(verseDoc) {
  const list = useResolveVerseFonts(verseDoc)
  if (Array.isArray(list) && list.length > 0) {
    const preferred = list.find(f => f.default === true) || list[0]
    return preferred?.fontFaceDeclaration || getGlobalDefaultBodyFontDeclaration()
  }
  return getGlobalDefaultBodyFontDeclaration()
}

