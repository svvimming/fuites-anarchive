// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import SettingsData from '@/data/settings.json'

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
/**
 * Get the active fonts from the site data
 * @returns {Array} The active fonts
 */
const getActiveFonts = () => {
  try {
    const generalStore = useGeneralStore()
    const siteFonts = generalStore?.siteData?.settings?.fonts
    if (Array.isArray(siteFonts) && siteFonts.length > 0) {
      return siteFonts
    }
  } catch {}
  return Array.isArray(SettingsData?.fonts) ? SettingsData.fonts : []
}

/**
 * Get the default font from the list of fonts
 * @param {Array} list - The list of fonts
 * @returns {Object} The default font
 */
const getDefaultFont = (list) => (Array.isArray(list) && list.find(f => f.default)) || list[0]

/**
 * Handle text node
 * @param {Node} node - The text node to handle
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} collector - The collector object
 * @returns {Object} The text node data
 */
const handleTextNode = (node, ctx, collector) => {
  const fontsList = getActiveFonts()
  const defaultFont = getDefaultFont(fontsList)
  const fontSize = (parseInt(collector.fontSize) || 16) * (collector.fontSize?.includes('pt') ? 1.33 : 1)
  const fontFamily = collector.fontFamily || defaultFont?.styleAttribute
  const font = fontsList.find(item => item.styleAttribute === fontFamily || item.fontFaceDeclaration === fontFamily)
  // Set font properties
  ctx.font = `${fontSize}px ${font?.fontFaceDeclaration || defaultFont.styleAttribute}`
  // Measure text width
  const textMetrics = ctx.measureText(node.textContent)
  // Return text node data
  return {
    text: node.textContent,
    font: font || defaultFont,
    fontSize,
    bold: !!collector.bold,
    italic: !!collector.italic,
    underline: !!collector.underline,
    color: collector.color || '#000000',
    width: textMetrics.width,
    height: textMetrics.fontBoundingBoxAscent
  }
}

/**
 * Handle element node
 * @param {Node} node - The element node to handle
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} collector - The collector object
 * @returns {Object} The element node data
 */
const handleNode = (node, ctx, collector = {}) => {

  if (node.nodeType === 3) {
    return [handleTextNode(node, ctx, collector)]
  }
  
  if (!node || node.nodeType !== 1 || !node.tagName) {
    console.log('Found other type of node while parsing text')
    return []
  }

  switch (node.tagName.toLowerCase()) {
    case 'span':
      const fontSize = node.style.fontSize
      const fontFamily = node.style.fontFamily
      const color = node.style.color
      collector = Object.assign({}, collector, {
        ...fontSize && { fontSize },
        ...fontFamily && { fontFamily },
        ...color && { color }
      })
      break
    case 'br':
      return [{ br: true, height: 16 }]
    case 'strong':
      collector = Object.assign({}, collector, { bold: true })
      break
    case 'em':
      collector = Object.assign({}, collector, { italic: true })
      break
    case 'u':
      collector = Object.assign({}, collector, { underline: true })
      break
  }

  const innerNodes = node.childNodes
  const len = innerNodes.length
  const data = []
  for (let i = 0; i < len; i++) {
    const innerNode = innerNodes[i]
    const el = handleNode(innerNode, ctx, collector)
    data.push(...el)
  }

  return data
}

// ////////////////////////////////////////////////////////////////////// Exports
// -----------------------------------------------------------------------------
/**
 * Render the text element to the canvas
 * @param {Canvas} canvas - The canvas to render the text to
 * @param {Element} element - The element to render the text from
 * @param {Object} config - The configuration object
 * @returns {Canvas} The canvas with the text rendered
 */
export const useRenderTextElementToCanvas = (canvas, element, config) => {
  const ctx = canvas.getContext('2d')

  /**
   * Apply font settings from a token to the canvas context
   */
  const applyFont = (token) => {
    const defaultFamily = token.font?.styleAttribute || 'sans-serif'
    ctx.font = `normal ${token.fontSize || 16}px ${defaultFamily}`
    const bold = token.bold ? 'bold ' : ''
    ctx.font = `${bold}${token.italic ? 'italic' : 'normal'} ${token.fontSize}px ${token.font.styleAttribute}`
  }

  // --------------------------------------------------------- Parse paragraphs
  // Each paragraph tracks its text-align and pre-broken visual lines.
  const paragraphs = []
  const children = element.children
  const cLen = children.length

  for (let i = 0; i < cLen; i++) {
    const p = children[i]
    const align = p.style?.textAlign || 'left'

    // Parse all inline elements within this paragraph
    const elements = []
    const pNodes = p.childNodes
    const pLen = pNodes.length
    for (let j = 0; j < pLen; j++) {
      elements.push(...handleNode(pNodes[j], ctx))
    }

    // Flatten elements into individual word tokens, measuring each word
    const tokens = []
    for (const el of elements) {
      if (el.br) {
        tokens.push({ br: true, height: el.height })
        continue
      }
      applyFont(el)
      const spaceWidth = ctx.measureText(' ').width
      const words = el.text.split(' ')
      for (let k = 0; k < words.length; k++) {
        const word = words[k]
        if (word === '') { continue }
        const wordWidth = ctx.measureText(word).width
        tokens.push({ ...el, text: word, wordWidth, spaceWidth })
      }
    }

    // Break tokens into visual lines via word-wrap, respecting config.width
    const visualLines = []
    let currentLineTokens = []
    let currentLineWidth = 0
    let lastWasBr = false

    for (const token of tokens) {
      if (token.br) {
        visualLines.push({ words: currentLineTokens })
        currentLineTokens = []
        currentLineWidth = 0
        lastWasBr = true
        continue
      }
      lastWasBr = false

      const neededWidth = currentLineWidth > 0
        ? currentLineWidth + token.spaceWidth + token.wordWidth
        : token.wordWidth

      if (currentLineWidth > 0 && neededWidth > config.width) {
        // Word doesn't fit — wrap to next line
        visualLines.push({ words: currentLineTokens })
        currentLineTokens = [token]
        currentLineWidth = token.wordWidth
      } else {
        currentLineTokens.push(token)
        currentLineWidth = neededWidth
      }
    }

    // Flush remaining tokens, or an empty line if the last token was a <br>
    if (!lastWasBr || currentLineTokens.length > 0) {
      visualLines.push({ words: currentLineTokens })
    }

    paragraphs.push({ align, visualLines })
  }

  // ------------------------------------------------------------------ Render
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let currentY = 0

  for (const para of paragraphs) {
    const { align, visualLines } = para
    const vLen = visualLines.length

    for (let vi = 0; vi < vLen; vi++) {
      const words = visualLines[vi].words
      // The last visual line of a paragraph is never justified (standard typography)
      const isLastLine = vi === vLen - 1

      const lineHeight = words.length > 0
        ? words.reduce((max, t) => Math.max(max, t.height || 0), 0) * 1.2
        : 16 * 1.2 // fallback height for blank lines

      currentY += lineHeight

      if (words.length === 0) { continue }

      // Justify all but the last line; single-word lines are never justified
      const shouldJustify = align === 'justify' && !isLastLine && words.length > 1

      let extraSpacePerGap = 0
      if (shouldJustify) {
        const totalWordWidth = words.reduce((sum, t) => sum + t.wordWidth, 0)
        extraSpacePerGap = (config.width - totalWordWidth) / (words.length - 1)
      }

      let currentX = 0
      for (let wi = 0; wi < words.length; wi++) {
        const token = words[wi]

        // Set a sensible dynamic default before final font assignment
        const defaultFamily = token.font?.styleAttribute || 'sans-serif'
        ctx.font = `normal ${token.fontSize || 16}px ${defaultFamily}`
        applyFont(token)
        ctx.fillStyle = token.color
        ctx.textBaseline = 'bottom'
        ctx.fillText(token.text, currentX, currentY)

        const gapWidth = shouldJustify ? extraSpacePerGap : token.spaceWidth

        if (token.underline) {
          ctx.strokeStyle = token.color
          ctx.lineWidth = token.fontSize / 16
          ctx.beginPath()
          ctx.moveTo(currentX, currentY)
          // Extend underline to cover the gap after the word (except for the last word)
          const underlineWidth = wi < words.length - 1
            ? token.wordWidth + gapWidth
            : token.wordWidth
          ctx.lineTo(currentX + underlineWidth, currentY)
          ctx.stroke()
        }

        if (wi < words.length - 1) {
          currentX += token.wordWidth + gapWidth
        }
      }
    }
  }

  return canvas
}
