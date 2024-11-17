<template>
  <UseDraggable
    :initial-value="{ x: 40, y: 40 }"
    :prevent-default="true"
    :handle="handle"
    :container-element="container"
    class="caddy-wrapper">
    <div id="caddy" :class="{ active: thingie }">

      <div ref="handle" class="handle">
        handle
      </div>
      
      <template v-for="param in params" :key="param.directive">

        <ButtonRetrigger
          v-if="param.button === 'retrigger'"
          @retrigger="handleClick(param.directive)">
          {{ param.inner }}
        </ButtonRetrigger>

        <button v-else @click="handleClick(param.directive)">
          {{ param.inner }}
        </button>

      </template>

    </div>
  </UseDraggable>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'
import { UseDraggable } from '@vueuse/components'

// ======================================================================= Setup
defineProps({
  container: {
    type: [Object, null],
    required: true
  }
})

// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)

const handle = ref(null)

// ==================================================================== Computed
const editableParams = computed(() => siteData.value?.settings?.thingieEditableParams || [])
const shared = computed(() => editableParams.value?.shared || [])
const params = computed(() => shared.value.concat([]))
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data._id))

// ===================================================================== Methods
/**
 * @method handleClick
 */

const handleClick = directive => {
  switch (directive) {
    case 'rotateCW' : rotateThingie(1); break
    case 'rotateCCW' : rotateThingie(-1); break
    case 'bringForward' : bringThingieForward(); break
    case 'sendBack' : sendThingieBack(); break
  }
}

/**
 * @method rotateThingie
 */

const rotateThingie = delta => {
  if (thingie.value) {
    update({
      at: Object.assign({}, thingie.value.at, { rotation: thingie.value.at.rotation + delta })
    })
  }
}

/**
 * @method bringThingieForward
 */

const bringThingieForward = () => {
  if (thingie.value) {
    const location = thingie.value.location
    let max
    if (location === 'pocket') {
      max = Math.max(...pocketThingies.value.map(item => item.zIndex))
    } else {
      max = Math.max(...pageThingies.value.map(item => item.zIndex))
    }
    update({ zIndex: max + 1 })
  }
}

/**
 * @method sendThingieBack
 */

const sendThingieBack = () => {
  if (thingie.value) {
    const location = thingie.value.location
    let min
    if (location === 'pocket') {
      min = Math.min(...pocketThingies.value.map(item => item.zIndex))
    } else {
      min = Math.min(...pageThingies.value.map(item => item.zIndex))
    }
    update({ zIndex: min - 1 })
  }
}

/**
 * @method update
 */

const update = useThrottleFn(data => {
  collectorStore.initThingieUpdate(Object.assign(data, { _id: thingie.value._id }))
}, 5)
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.caddy-wrapper {
  position: absolute;
  z-index: 1;
}

#caddy {
  padding: 1rem;
  background-color: red;
  color: white;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: 200ms ease;
  &.active {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }
}
</style>
