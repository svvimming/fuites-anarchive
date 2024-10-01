<template>
  <component
    :is="component"
    v-bind="{...$attrs}"
    :to="tag === 'nuxt-link' ? to : undefined"
    :href="tag === 'a' ? to : undefined"
    :disabled="disabled || loading"
    :target="target"
    :class="['button', { selected }, { disabled }]"
    @click="clickHandler($event)">

    <slot :loading="loading" />

  </component>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  tag: {
    type: String,
    required: false,
    default: 'button'
  },
  to: {
    type: [String, Object],
    required: false,
    default: undefined
  },
  target: {
    type: [String, Object],
    required: false,
    default: undefined
  },
  id: {
    type: [String, Object],
    required: false,
    default: undefined
  },
  forceDisabled: {
    type: Boolean,
    required: false,
    default: false
  },
  forceLoading: {
    type: Boolean,
    required: false,
    default: false
  },
  selected: {
    type: Boolean,
    required: false,
    default: false
  }
})

// ======================================================================= Setup
const emit = defineEmits(['clicked'])
const buttonStore = useButtonStore()
if (props.id) {
  buttonStore.setButton({ id: props.id, loading: false })
}

// ======================================================================== Data
const { buttons } = storeToRefs(buttonStore)

const { $bus } = useNuxtApp()

// ==================================================================== Computed
const button = computed(() => buttons.value[props.id])
const loading = computed(() => props.forceLoading || button.value?.loading)
const disabled = computed(() => props.forceDisabled || loading.value)
const component = computed(() => {
  const tag = props.tag
  if (disabled.value) { return 'button' }
  if (tag !== 'nuxt-link') { return tag }
  return resolveComponent('NuxtLink')
})

// ===================================================================== Methods
/**
 * @method clickHandler
 */

const clickHandler = async e => {
  e.stopPropagation()
  if (!disabled.value) {
    if (typeof props.id === 'string') {
      await buttonStore.setButton({ id: props.id, loading: true })
    }
    emit('clicked', e)
  }
}

/**
 * @method handleSessionExpired
 */

const handleSessionExpired = () => {
  if (loading.value) {
    buttonStore.setButton({ id: props.id, loading: false })
  }
}

// ======================================================================= Hooks
$bus.$on('session-expired', handleSessionExpired)

onBeforeUnmount(() => {
  $bus.$off('session-expired', handleSessionExpired)
})
</script>
