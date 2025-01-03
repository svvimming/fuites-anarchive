export const useGetSelectionColor = colors => {

  const hexToRgb = hex => {
    const r = parseInt(hex.substr(1,2), 16)
    const g = parseInt(hex.substr(3,2), 16)
    const b = parseInt(hex.substr(5,2), 16)
    return { r, g, b }
  }
  
  const rgbToHsl = rgb => {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h
    let s
    const l = (max + min) / 2
  
    if (max == min) {
      h = 0
      s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return { h, s, l }
  }

  const maxIndex = computed(() => {
    const hslColors = colors.map(hex => rgbToHsl(hexToRgb(hex)))
    const visibilityScores = hslColors.map((hsl) => hsl.s - Math.abs(50 - hsl.l))
    const max = Math.max(...visibilityScores)
    return visibilityScores.indexOf(max)
  })
  
  return colors[maxIndex.value]
}
