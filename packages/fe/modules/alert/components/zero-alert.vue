<template>
  <div :class="['alert', `mode__${mode}`, { open }]">

    <slot
      :close-alert="closeAlert"
      :data="data" />

  </div>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  alertId: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'alert', // 'alert' or 'modal'
    required: false
  }
})

// ======================================================================= Setup
const emit = defineEmits(['completed'])

const alertStore = useZeroAlertStore()
alertStore.setAlert({
  id: props.alertId,
  status: 'closed'
})

// ==================================================================== Computed
const alert = computed(() => alertStore.getAlert(props.alertId))
const open = computed(() => alert.value?.status === 'open')
const data = computed(() => alert.value?.data)

// ======================================================================= Hooks
onBeforeUnmount(() => {
  alertStore.removeAlert(props.alertId)
})

// ===================================================================== Methods
/**
 * @method closeAlert
 */
const closeAlert = () => {
  alertStore.closeAlert(props.alertId)
}
</script>

<style lang="scss" scoped>
.alert {
  position: absolute;
  visibility: hidden;
  opacity: 0;
  top: 50%;
  left: 50%;
  transition: 300ms ease;
  z-index: 2;
  &.mode__modal {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba($woodsmoke, 0.8);
    }
  }
  &.mode__alert {
    transform: translate(-50%, -50%);
  }
  &.open {
    visibility: visible;
    opacity: 1;
    .message {
      transform: translate(-50%, -50%) scale(1);
    }
  }
}
</style>
