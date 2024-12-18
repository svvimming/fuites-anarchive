<template>
  <div v-if="textEditor" class="font-style-selector">

    <button
      class="font-style-button toggle-bold"
      @click="textEditor.chain().focus().toggleBold().run()">
      B
    </button>

    <button
      class="font-style-button toggle-italic"
      @click="textEditor.chain().focus().toggleItalic().run()">
      I
    </button>

    <button
      class="font-style-button toggle-underline"
      @click="textEditor.chain().focus().toggleUnderline().run()">
      U
    </button>

    <!-- <button
      class="font-style-button toggle-strike"
      @click="textEditor.chain().focus().toggleStrike().run()">
    </button> -->

  </div>
</template>

<script setup>
// ======================================================================== Data
const verseStore = useVerseStore()
const { textEditor } = storeToRefs(verseStore)

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.font-style-selector {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  border-radius: 50%;
  border: solid 0.5px $woodsmoke;
  background-color: white;
  overflow: hidden;
  width: torem(40);
  height: torem(40);
}

.font-style-button {
  color: $woodsmoke;
  font-size: torem(8);
  padding: torem(4);
}
</style>
