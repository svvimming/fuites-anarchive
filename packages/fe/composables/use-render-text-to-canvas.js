/**
 * Renders HTML text nodes to a canvas while preserving text styling and absolute positioning
 * @param {HTMLElement} target - The element containing text nodes
 * @returns {Object} Object containing a canvas and the final position and dimensions
 */
export const useRenderTextToCanvas = (target) => {
  // Initialize data
  const canvas = ref(null)
  const ctx = ref(null)

  // Get the root span's position as reference point
  const rootRect = target?.getBoundingClientRect()
  let maxWidth = 0;
  let maxHeight = 0;

  /**
   * Process a text node and render it to canvas
   * @param {Text} textNode - The text node to process
   * @param {Object} style - Current text style
   */
  function processTextNode(textNode, style) {
    const text = textNode.textContent;
    if (!text) return;

    // Apply text style
    const fontWeight = style.fontWeight === 'bold' ? 'bold' : 'normal';
    const fontStyle = style.fontStyle === 'italic' ? 'italic' : 'normal';
    const fontSize = style.fontSize || '16px';
    const fontFamily = style.fontFamily || 'Source Sans Pro, sans-serif';
    const fontString = `${fontWeight} ${fontStyle} ${fontSize} ${fontFamily}`;

    ctx.value.font = fontString;
    ctx.value.fillStyle = style.color || '#000000';
    ctx.value.textBaseline = 'bottom'

    // Get the text node's position relative to the root span
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rect = range.getBoundingClientRect();
    
    // Calculate position relative to root span
    const relativeX = rect.left - rootRect.left
    const relativeY = rect.top - rootRect.top + 8 // 8px padding

    // Draw the text at the calculated position
    ctx.value.fillText(text, relativeX, relativeY + rect.height);

    // Update max dimensions
    maxWidth = Math.max(maxWidth, relativeX + rect.width);
    maxHeight = Math.max(maxHeight, relativeY + rect.height);
  }

  /**
   * Process a node and its children
   * @param {Node} node - The node to process
   * @param {Object} parentStyle - Parent node's style
   */
  function processNode(node, parentStyle = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node, parentStyle);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const style = {
        ...parentStyle,
        ...(node.style.color && { color: node.style.color }),
        ...(node.style.fontSize && { fontSize: node.style.fontSize }),
        ...(node.style.fontFamily && { fontFamily: node.style.fontFamily }),
        ...(node.style.fontWeight && { fontWeight: node.style.fontWeight }),
        ...(node.style.fontStyle && { fontStyle: node.style.fontStyle })
      };

      // Handle specific HTML elements
      switch (node.tagName.toLowerCase()) {
        case 'br':
          // Line breaks are handled automatically by getBoundingClientRect()
          break;
        case 'strong':
          style.fontWeight = 'bold';
          break;
        case 'em':
          style.fontStyle = 'italic';
          break;
        case 'span':
          // Process span content with inherited styles
          Array.from(node.childNodes).forEach(child => {
            processNode(child, style);
          });
          return;
      }

      // Process child nodes
      Array.from(node.childNodes).forEach(child => {
        processNode(child, style);
      });
    }
  }

  if (target) {
    const targetRect = target.getBoundingClientRect()
    canvas.value = document.createElement('canvas')
    canvas.value.width = targetRect.width
    canvas.value.height = targetRect.height
    ctx.value = canvas.value.getContext('2d')

    Array.from(target.childNodes).forEach(node => {
      processNode(node);
    })
  }

  return {
    canvas: canvas.value,
    dimensions: {
      width: maxWidth,
      height: maxHeight
    }
  };
} 
