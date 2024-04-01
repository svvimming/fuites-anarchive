<template>
  <div :class="['releases-content', { 'high-z': visible }]">
    <div class="grid-noGutter full full-height">

      <div 
        class="col-5_sm-hidden">
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
        class="col-5_sm-8_ti-9"
        data-push-left="off-2_md-1_sm-4_ti-3">
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
              :active="release.name === selectedName"
              :mobile="mobile"
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
      selectedName: '',
      resize: false,
      mobile: false
    }
  },

  computed: {
    selected () {
      return this.releases.find(item => item.name === this.selectedName)
    }
  },

  watch: {
    visible (val) {
      if (!val && this.selectedName) {
        this.selectedName = ''
      }
    }
  },

  mounted () {
    this.resize = () => { this.checkSmallBreakpoint() }
    window.addEventListener('resize', this.resize)
    this.checkSmallBreakpoint()
  },

  beforeDestroy () {
    if (this.resize) {
      window.removeEventListener('resize', this.resize)
    }
  },

  methods: {
    setSelectedRelease (incoming) {
      this.selectedName = incoming
    },
    checkSmallBreakpoint () {
      if (this.selectedName) {
        this.selectedName = ''
      }
      if (window.matchMedia('(max-width: 53.125rem)').matches) {
        if (!this.mobile) {
          this.mobile = true
        }
      } else {
        if (this.mobile) {
          this.mobile = false
        }
      }
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
  margin-top: toRem(313);
  padding-left: calc(toRem(90) - 0.5rem);
  padding-right: toRem(60);
  @include medium {
    padding-left: calc(toRem(60) - 0.5rem);
    padding-right: 0;
  }
  @include small {
    padding-left: calc(toRem(30) - 0.5rem);
  }
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

.releases-panel {
  max-height: 100vh;
  overflow: scroll;
  @include small {
    min-height: toRem(1080);
    padding-left: 1rem;
  }
}

#close-releases {
  position: absolute;
  font-weight: 500;
  right: 1.5rem;
  bottom: 12%;
  padding: 1rem;
  @include large {
    right: 1rem;
  }
  @include small {
    transform: translateX(100%);
    right: calc(100% - 1rem);
  }
  @include mini {
    right: calc(100% - 0.5rem);
  }
}

.release-list {
  padding: 0 toRem(95);
  @include large {
    padding: 0 toRem(40);
  }
  @include medium {
    padding: 0 toRem(75);
  }
  @include small {
    padding: 0;
  }
  @include tiny {
    padding-right: 1rem;
  }
}

</style>