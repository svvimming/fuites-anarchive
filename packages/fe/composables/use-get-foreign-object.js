import DataUriFonts from '../assets/fonts/data-uri-fonts.json'
import SiteSettings from '../data/settings.json'

const siteFonts = SiteSettings.fonts

export const useGetForeignObject = (html, dimensions) => {
  // Remove br elements from input html
  html = html.replace(/<br\s*\/?>/gi, '')
  // Parse input html to find font families used
  const parsed = html.split('font-family:').map(line => line.replaceAll('&quot;', '').trim()).filter(line => line !== '')
  // Match fonts used to font face declarations with data URIs from data-uri-fonts.json
  const declarations = []
  const availableFonts = siteFonts.map(font => font.display)
  const defaultFont = DataUriFonts.default
  // Loop through parse results
  for (const line of parsed) {
    const len = siteFonts.length
    // Loop through site fonts checking for matches
    for (let i = 0; i < len; i++) {
      const font = siteFonts[i]
      // Skip if font is not available
      if (!availableFonts.includes(font.display)) { continue }
      // Add font face declaration to declarations array
      if (line.startsWith(font.styleAttribute) || font.display === defaultFont) {
        const fontFaceData = DataUriFonts[font.display]
        if (fontFaceData) {
          Object.values(fontFaceData).forEach(fontFace => {
            declarations.push(fontFace)
          })
          // Remove font from available fonts
          const index = availableFonts.indexOf(font.display)
          if (index > -1) {
            availableFonts.splice(index, 1)
            break
          }
        }
      }
    }
  }
  // Return SVG
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}">
      <style>
        div {
          position: relative;
          display: table;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          outline: none;
          box-shadow: none;
          background-color: transparent;
          box-sizing: border-box;
          line-height: 1 !important;
          white-space: break-spaces;
          word-wrap: break-word;
          font-family: 'Source Sans Pro', sans-serif;
          height: auto;
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: 0px;
        }
        p,
        li,
        span {
          font-family: 'Source Sans Pro', sans-serif;
          height: auto;
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: 0px;
          position: relative;
          display: inline-block;
          margin-top: 0;
          margin-bottom: 0;
          line-height: 1 !important;
        }
        p {
          width: 100%;
        }
        ${declarations.join('\n')}
      </style>
      <foreignObject width="100%" height="100%">
        <div
          xmlns="http://www.w3.org/1999/xhtml">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;
}
