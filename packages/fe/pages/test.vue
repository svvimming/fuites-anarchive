<template>
  <div>
    <h1>Test</h1>

    <div ref="canvasContainer" class="canvas-container">

    </div>
  </div>
</template>

<script setup>
const html = `
  <p>This is a <strong>bold</strong> paragraph with some <em>italic</em> text.</p>
  <p>This is another paragraph with a <span style="color: red;">colored</span> text.</p>
  <p>      <span style="color: rgb(47, 45, 54)"> </span><span style="font-family: &quot;Nanum Myeongjo&quot;, serif; font-size: 14px; color: #343043">     hi there this</span></p><p><br></p><p>                         <span style="font-family: &quot;Source Code Pro&quot;, monospace"><strong><em> </em></strong></span><span style="font-family: &quot;Source Code Pro&quot;, monospace; color: rgb(151, 112, 168)"><strong><em> is a big</em></strong></span></p><p><br></p><p><br></p><p><span style="font-family: &quot;Source Serif Pro&quot;, serif; font-size: 20px; color: rgb(123, 38, 159)"><strong>old test</strong></span></p>
`;

const canvasContainer = ref(null)

onMounted(() => {
  if (process.client) {
    const canvas = useHtmlToCanvas(html, {
      width: 600,
      height: 400
    })
    canvasContainer.value.appendChild(canvas)
  }
})
</script>
