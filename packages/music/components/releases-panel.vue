<template>
  <div :class="['releases-content', { 'high-z': visible }]">
    <div class="grid-noGutter full full-height">

      <div 
        class="col-5">
        <div
          v-if="selected"
          :class="['selected-release', { visible }]">

          <div class="name">
            {{ selected.name }}
          </div>

          <div class="artist">
            {{ selected.artist }}
          </div>

          <div class="description">
            {{ selected.description }}
          </div>

        </div>
      </div>

      <div
        class="col-5"
        data-push-left="off-2">
        <div :class="['releases-panel', { visible }]">
          
          <button
            id="close-releases"
            class="button"
            @click="$emit('close-releases')">
            close
          </button>

          <div class="release-list">
            <ReleaseCard
              v-for="release in releases"
              :key="release.name"
              :card="release"
              :class="[{ active: release.name === selectedName }]"
              @over-release="setSelectedRelease" />
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import ReleaseCard from '@/components/release-card'

// ====================================================================== Export
export default {
  name: 'ReleasesPanel',

  components: {
    ReleaseCard
  },

  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    releases: {
      type: Array,
      required: true,
      default: () => []
    }
  },

  data () {
    return {
      selectedName: ''
    }
  },

  computed: {
    selected () {
      return this.releases.find(item => item.name === this.selectedName)
    }
  },

  methods: {
    setSelectedRelease (incoming) {
      this.selectedName = incoming
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.releases-content {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  &.high-z {
    z-index: 10;
  }
}

.full-height {
  height: 100%;
}

.selected-release {
  margin-top: 29vh;
  padding-left: calc(toRem(90) - 0.5rem);
  padding-right: toRem(60);
}

.name,
.artist,
.description {
  color: white;
  @include fontFamily_Roboto;
  letter-spacing: 0.02em;
}

.name {
  margin-bottom: toRem(12);
  font-weight: 500;
  font-size: toRem(20);
}

.artist {
  @include fontFamily_FrauncesItalic;
  margin-bottom: toRem(28);
}

.description {
  line-height: 1.6;
  font-weight: 400;
}

.selected-release,
.releases-panel {
  visibility: hidden;
  transition: 500ms ease 300ms;
  opacity: 0;
  &.visible {
    visibility: visible;
    opacity: 1;
  }
}

#close-releases {
  position: absolute;
  font-weight: 500;
  right: 1.5rem;
  bottom: 12%;
  padding: 1rem;
}

.release-list {
  padding: 0 toRem(95);
}

</style>