/**
 * Parses HTML string and extracts text nodes with their styling and position into JSON
 * @param {string} htmlString - The HTML string to parse
 * @param {Object} options - Configuration options
 * @param {number} options.width - Container width (default: 800)
 * @param {number} options.fontSize - Base font size (default: 16)
 * @returns {Array} Array of text nodes with their styling and position information
 */
export const useHtmlToJson = (htmlString, options = {}) => {
  const {
    width = 800,
    fontSize = 16
  } = options;

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  const textNodes = [];
  let currentX = 0; // Starting x position at 0
  let currentY = 0; // Starting y position at 0
  let lineHeight = fontSize * 1.5; // Line height based on font size

  /**
   * Convert font size string to integer
   * @param {string} fontSize - Font size string (e.g. "16px")
   * @returns {number} Integer font size
   */
  function parseFontSize(fontSize) {
    if (!fontSize || typeof fontSize === 'number') return fontSize;
    return parseInt(fontSize.replace('px', ''), 10);
  }

  /**
   * Process a text node and extract its content and styling
   * @param {Text} textNode - The text node to process
   * @param {Object} parentStyle - Parent node's style
   * @param {string} parentTag - Parent HTML tag name
   */
  function processTextNode(textNode, parentStyle = {}, parentTag = '') {
    const text = textNode.textContent;
    if (!text) return;

    const elementStyle = textNode.parentElement?.style || {};
    const currentFontSize = parseFontSize(elementStyle.fontSize) || fontSize;
    
    // Create a temporary span to measure text width
    const measureSpan = document.createElement('span');
    measureSpan.style.fontSize = `${currentFontSize}px`;
    measureSpan.style.fontFamily = elementStyle.fontFamily || '';
    measureSpan.style.fontWeight = elementStyle.fontWeight || '';
    measureSpan.style.fontStyle = elementStyle.fontStyle || '';
    measureSpan.style.whiteSpace = 'pre'; // Preserve whitespace
    measureSpan.textContent = text;
    
    // Add to document temporarily to measure
    document.body.appendChild(measureSpan);
    const textWidth = measureSpan.offsetWidth;
    document.body.removeChild(measureSpan);

    // Check if we need to wrap to next line
    if (currentX + textWidth > width) {
      currentX = 0;
      currentY += lineHeight;
    }

    textNodes.push({
      text,
      tag: parentTag,
      position: {
        x: currentX,
        y: currentY
      },
      style: {
        fontWeight: elementStyle.fontWeight || '',
        fontStyle: elementStyle.fontStyle || '',
        color: elementStyle.color || '',
        fontSize: currentFontSize,
        fontFamily: elementStyle.fontFamily || ''
      },
      parentStyle: {
        ...parentStyle,
        fontSize: parseFontSize(parentStyle.fontSize)
      }
    });

    // Update x position for next text node
    currentX += textWidth;
  }

  /**
   * Process a node and its children
   * @param {Node} node - The node to process
   * @param {Object} parentStyle - Parent node's style
   */
  function processNode(node, parentStyle = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node, parentStyle, node.parentElement?.tagName.toLowerCase() || '');
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elementStyle = node.style;
      const currentStyle = {
        ...parentStyle,
        fontWeight: elementStyle.fontWeight || '',
        fontStyle: elementStyle.fontStyle || '',
        color: elementStyle.color || '',
        fontSize: parseFontSize(elementStyle.fontSize),
        fontFamily: elementStyle.fontFamily || ''
      };

      // Handle block elements by adding line breaks
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName.toLowerCase())) {
        if (currentX !== 0) {
          currentX = 0;
          currentY += lineHeight;
        }
      }

      // Process child nodes
      Array.from(node.childNodes).forEach(child => {
        processNode(child, currentStyle);
      });
    }
  }

  // Process all nodes in the temporary div
  Array.from(tempDiv.childNodes).forEach(node => {
    processNode(node);
  });

  return textNodes;
}

/**
 * Example usage:
 * 
 * const html = `
 *   <p>This is a <strong>bold text</strong> paragraph with some <em>italic text</em>.</p>
 *   <p>This is another paragraph with a <span style="color: red;">colored text</span>.</p>
 * `;
 * 
 * const result = useHtmlToJson(html, {
 *   width: 600,
 *   fontSize: 16
 * });
 * 
 * Output will be an array of objects like:
 * [
 *   {
 *     text: "This is a ",
 *     tag: "p",
 *     position: {
 *       x: 0,
 *       y: 0
 *     },
 *     style: {
 *       fontWeight: "",
 *       fontStyle: "",
 *       color: "",
 *       fontSize: 16,
 *       fontFamily: ""
 *     },
 *     parentStyle: {}
 *   },
 *   {
 *     text: "bold text",
 *     tag: "strong",
 *     position: {
 *       x: 0,
 *       y: 24
 *     },
 *     style: {
 *       fontWeight: "bold",
 *       fontStyle: "",
 *       color: "",
 *       fontSize: 16,
 *       fontFamily: ""
 *     },
 *     parentStyle: {
 *       fontWeight: "",
 *       fontStyle: "",
 *       color: "",
 *       fontSize: 16,
 *       fontFamily: ""
 *     }
 *   }
 * ]
 */ 
