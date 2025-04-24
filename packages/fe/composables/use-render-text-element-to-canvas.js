import SiteSettings from '@/data/settings.json'

const fonts = SiteSettings.fonts
const defaultFont = fonts.find(font => font.default)

/**
 * Handle text node
 * @param {Node} node - The text node to handle
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} collector - The collector object
 * @returns {Object} The text node data
 */
const handleTextNode = (node, ctx, collector) => {
  const fontSize = (parseInt(collector.fontSize) || 16) * (collector.fontSize?.includes('pt') ? 1.33 : 1)
  const fontFamily = collector.fontFamily || defaultFont.styleAttribute
  const font = fonts.find(item => item.styleAttribute === fontFamily || item.fontFaceDeclaration === fontFamily)
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

export const useRenderTextElementToCanvas = (canvas, element, config) => {
  const ctx = canvas.getContext('2d')
  const lines = []
  const children = element.children
  const cLen = children.length
  for (let i = 0; i < cLen; i++) {
    const elements = []
    const p = children[i]
    const pNodes = p.childNodes
    const pLen = pNodes.length
    for (let j = 0; j < pLen; j++) {
      const pNode = pNodes[j]
      const el = handleNode(pNode, ctx)
      elements.push(...el)
    }
    lines.push(elements)
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let currentX = 0
  let currentY = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const len = line.length
    const lineHeight = (line.reduce((max, el) => Math.max(max, el.height || 0), 0)) * 1.2
    currentX = 0
    currentY += lineHeight
    for (let j = 0; j < len; j++) {
      const el = line[j]

      if (el.br) { continue }
      
      // Set text properties
      ctx.font = 'normal 16px Source Sans Pro, sans-serif'
      const bold = el.bold ? 'bold ' : ''
      const font = bold + `${el.italic ? 'italic' : 'normal'} ${el.fontSize}px ${el.font.styleAttribute}`
      ctx.font = font
      ctx.fillStyle = el.color
      ctx.textBaseline = 'bottom'
      
      const words = el.text.split(' ')
      for (let k = 0; k < words.length; k++) {
        const word = words[k]
        const wordWidth = ctx.measureText(word).width
        if (currentX + wordWidth > config.width) {
          currentX = 0
          currentY += lineHeight
        }
        ctx.fillText(word, currentX, currentY)
        // Measure the width of the space after the word
        const spaceWidth = ctx.measureText(' ').width
        // Draw underline if it exists
        if (el.underline) {
          ctx.strokeStyle = el.color
          ctx.lineWidth = el.fontSize / 16
          ctx.beginPath()
          ctx.moveTo(currentX, currentY)
          ctx.lineTo(currentX + wordWidth + spaceWidth, currentY)
          ctx.stroke()
        }
        // Add to currentX the width of the word plus the width of the space after it
        currentX += wordWidth + (k < words.length - 1 ? spaceWidth : 0)
      }
    }
  }

  return canvas
}
