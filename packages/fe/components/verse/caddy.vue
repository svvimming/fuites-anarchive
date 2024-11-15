<template>
  <div id="caddy">
    
    <template v-for="param in params" :key="param.directive">

      <ButtonRetrigger
        v-if="param.button === 'retrigger'"
        @retrigger="handleClick(param.directive)">
        {{ param.inner }}
      </ButtonRetrigger>

      <button @click="handleClick(param.directive)">
        {{ param.inner }}
      </button>

    </template>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'

// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)

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
#caddy {
  position: absolute;
  z-index: 1;
  top: torem(50);
  left: torem(50);
  padding: 1rem;
  background-color: red;
  color: white;
}
</style>
