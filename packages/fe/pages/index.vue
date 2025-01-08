<template>
  <div class="index-page">
    <div class="grid">
      <div class="col-12_lg-10_ti-12" data-push-left="off-0_lg-1_ti-0">

        <div class="title">
          <SiteLogo v-once />
        </div>

        <nav class="navigation">
          <ButtonBasic
            v-for="link in navigation"
            :key="link.text"
            :tag="link.tag"
            :to="link.to"
            :theme="link.theme"
            class="nav-link">
            {{ link.text }}
          </ButtonBasic>
        </nav>

      </div>
    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
import SettingsData from '@/data/settings.json'

definePageMeta({ layout: 'empty' })

// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)

await generalStore.setSiteData({ key: 'settings', value: SettingsData })

// ==================================================================== Computed
const navigation = computed(() => siteData.value?.settings?.navigation || [])

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.index-page {
  position: relative;
  padding-top: torem(140);
  height: 100%;
  overflow: hidden;
  &:before,
  &:after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    width: torem(1800);
    height: torem(1350);
    transform: translate(-50%, torem(-260));
    z-index: 1;
  }
  &:before {
    background-image: url('/irridescent.png');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: left bottom;
    opacity: 0.2;
  }
  &:after {
    background: linear-gradient(97deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 33%, rgba(255,255,255,0) 66%, rgba(255,255,255,1) 100%), linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%);;
  }
}

.title,
.navigation {
  position: relative;
  z-index: 2;
}

.navigation {
  display: flex;
  flex-direction: column;
  padding: torem(20) 0;
  margin-left: torem(8);
}

.nav-link {
  width: fit-content;
}
</style>
