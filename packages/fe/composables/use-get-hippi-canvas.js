export const useGetHiPPICanvas = (dimensions) => {
   // Initialize data
   const canvas = ref(null)
 
   const createHiPPICanvas = (w, h, ratio) => {
     const cnv = document.createElement('canvas')
     cnv.width = w * ratio
     cnv.height = h * ratio
     cnv.style.width = w + 'px'
     cnv.style.height = h + 'px'
     cnv.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
     return cnv
   }
 
   // Create hi res canvas
   canvas.value = createHiPPICanvas(dimensions.width, dimensions.height, 2)
 
   return canvas.value
 }
