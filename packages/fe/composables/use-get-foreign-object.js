import DataUriFonts from '../assets/fonts/data-uri-fonts.json'
import SiteSettings from '../data/settings.json'

const availableFonts = SiteSettings.fonts

export const useGetForeignObject = (html, width, height) => {
  // Parse input html to find font families used
  const parsed = html.split('font-family:').map(line => line.replaceAll('&quot;', '').trim()).filter(line => line !== '')
  // Match fonts used to font face declarations with data URIs from data-uri-fonts.json
  const declarations = []
  for (const line of parsed) {
    const len = availableFonts.length
    for (let i = 0; i < len; i++) {
      const font = availableFonts[i]
      if (line.startsWith(font.styleAttribute)) {
        const fontFaceData = DataUriFonts[font.display]
        if (fontFaceData) {
          Object.values(fontFaceData).forEach(fontFace => {
            declarations.push(fontFace)
          })
        }
      }
    }
  }
  // Return SVG
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        ${declarations.join('\n')}
      </style>
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
      </foreignObject>
    </svg>
  `;
}
