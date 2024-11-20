<template>
  <div v-if="items.length > 0" class="command-palette">

    <template
      v-for="(item, index) in items"
      :key="index">

      <button
        class="item"
        :class="[item.classes, {
          'is-selected': index === selectedIndex
        }]"
        @click="selectItem(index)">
        <component
          :is="icons[item.icon]"
          v-if="item.icon"
          class="icon" />
        {{ item.label }}
      </button>

      <div
        v-if="item.endOfGroup"
        class="divider" />

    </template>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  command: {
    type: Function,
    required: true
  }
})

// ======================================================================== Data
const icons = {
  IconTypeBold: resolveComponent('IconTypeBold'),
  IconTypeItalic: resolveComponent('IconTypeItalic'),
  IconTypeUnderline: resolveComponent('IconTypeUnderline'),
  IconTypeStrikethrough: resolveComponent('IconTypeStrikethrough'),
  IconBlockquoteLeft: resolveComponent('IconBlockquoteLeft'),
  IconCodeSlash: resolveComponent('IconCodeSlash'),
  IconListUl: resolveComponent('IconListUl'),
  IconListOl: resolveComponent('IconListOl'),
  IconListCheck: resolveComponent('IconListCheck')
}

const selectedIndex = ref(0)

// ==================================================================== Watchers
watch(() => props.items, () => {
  selectedIndex.value = 0
})

// ===================================================================== Methods
/**
 * @method onKeyDown
 */

const onKeyDown = ({ event }) => {
  const key = event.key
  const code = event.code
  const keyCode = event.keyCode
  const up = key === 'ArrowUp' || code === 'ArrowUp' || keyCode === 38
  const down = key === 'ArrowDown' || code === 'ArrowDown' || keyCode === 40
  const enter = key === 'Enter' || code === 'Enter' || keyCode === 13
  if (up) {
    selectedIndex.value = ((selectedIndex.value + props.items.length) - 1) % props.items.length
    return true
  }
  if (down) {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length
    return true
  }
  if (enter) {
    selectItem(selectedIndex.value)
    return true
  }
  return false
}

/**
 * @method selectItem
 */

const selectItem = index => {
  const item = props.items[index]
  if (item) {
    props.command(item)
  }
}

defineExpose({ onKeyDown })
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.command-palette {
  display: flex;
  flex-direction: column;
  border-radius: toRem(9);
  overflow: hidden;
}

.item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: toRem(8) toRem(10);
  border-radius: toRem(6);
  transition: 50ms ease-out;
  &:hover,
  &.is-selected {
    transition: 50ms ease-in;
  }
  &.type-h1 {
    font-size: toRem(16);
    font-weight: 700;
  }
  &.type-h2 {
    font-size: toRem(15);
    font-weight: 600;
  }
  &.type-h3 {
    font-weight: 500;
  }
}

.icon {
  width: toRem(16);
  margin-right: toRem(8);
}

.divider {
  width: calc(100% - toRem(24));
  height: toRem(2);
  margin: toRem(5) 0;
  margin-left: toRem(12);
  border-radius: toRem(4);
}
</style>
