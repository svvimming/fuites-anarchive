/**
 * Parses HTML string and renders it to a canvas element
 * @param {string} htmlString - The HTML string to parse and render
 * @param {Object} options - Configuration options
 * @param {number} options.width - Canvas width (default: 800)
 * @param {number} options.height - Canvas height (default: 600)
 * @param {string} options.fontFamily - Font family (default: 'Arial')
 * @param {number} options.fontSize - Base font size (default: 16)
 * @returns {HTMLCanvasElement} The canvas element with rendered content
 */
export const useHtmlToCanvas = (htmlString, options = {}) => {
  const {
    width = 800,
    height = 600
  } = options;

  // Create canvas and context
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlString

  // Initialize text positioning
  let x = 0
  let y = 0
  const baseFontSize = 16
  const lineHeight = baseFontSize
  const defaultFontFamily = 'serif'

  /**
   * Process a text node and render it to canvas
   * @param {Text} textNode - The text node to process
   * @param {Object} style - Current text style
   */
  function processTextNode(textNode, style) {
    
    const text = textNode.textContent
    const words = text.split(' ')
    
    words.forEach(word => {
      const wordWidth = ctx.measureText(word + ' ').width
      
      // Check if we need to wrap to next line
      if (x + wordWidth > width - 20) {
        x = 20
        y += lineHeight
      }

      // Apply text style
      const fontWeight = style.fontWeight === 'bold' ? 'bold' : 'normal'
      const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal'
      const fontSize = style.fontSize ? `${style.fontSize}` : `${baseFontSize}px`
      const fontFamily = style.fontFamily ? `${style.fontFamily}` : `${defaultFontFamily}`
      const fontString = `${fontWeight} ${fontStyle} ${fontSize} ${fontFamily}`
      ctx.font = fontString
      ctx.fillStyle = style.color || '#000000'
      // Draw the word
      ctx.fillText(word + ' ', x, y)
      x += wordWidth
    })
  }

  /**
   * Process a node and its children
   * @param {Node} node - The node to process
   * @param {Object} parentStyle - Parent node's style
   */
  function processNode(node, parentStyle = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node, parentStyle)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const style = {
        ...parentStyle,
        ...(node.style.color && { color: node.style.color }),
        ...(node.style.fontSize && { fontSize: node.style.fontSize }),
        ...(node.style.fontFamily && { fontFamily: node.style.fontFamily })
      }
      // Handle specific HTML elements
      switch (node.tagName.toLowerCase()) {
        case 'p':
          // Add spacing before paragraphs
          if (x !== 1) {
            y += lineHeight
            x = 1
          }
          break;
        case 'br':
          y += lineHeight
          break;
        case 'strong':
          style.fontWeight = 'bold'
          break;
        case 'em':
          style.fontStyle = 'italic'
          break;
        case 'span':
          // Process span content with inherited styles
          Array.from(node.childNodes).forEach(child => {
            processNode(child, style)
          })
          return;
      }

      // Process child nodes
      Array.from(node.childNodes).forEach(child => {
        processNode(child, style)
      })
    }
  }

  // Process all nodes in the temporary div
  Array.from(tempDiv.childNodes).forEach(node => {
    processNode(node)
  })

  return canvas
} 
