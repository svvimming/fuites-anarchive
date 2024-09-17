// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useSetStoreData = (original, modifiers) => {
  Object.keys(modifiers).forEach(key => {
    if (Object.hasOwn(original.value, key)) {
      original.value[key] = modifiers[key]
    }
  })
}
