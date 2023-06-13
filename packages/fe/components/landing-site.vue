<template>
  <div :class="['landing-site', { 'low-z': authenticated && isNotLandingPage && !tipsOpen }, { authenticated }]">
    <div class="inner-panel">

      <!-- ============================================================= NAV -->

      <template v-if="!authenticated || !isNotLandingPage">
        <div
          v-for="link in links"
          :key="link.text"
          :class="['link', link.component === 'Bingo' ? 'fuites' : 'portal-link']">
          <nuxt-link
            :to="link.route">
            <Bingo
              v-if="link.component === 'Bingo'"
              :text="link.text"
              :font-size="mobile ? 10 : 24"
              :custom="getBingoParameters(link)" />
            <div v-else>
              {{ link.text }}
            </div>
          </nuxt-link>
        </div>
      </template>

      <!-- ============================================================ TIPS -->

      <template v-if="authenticated && isNotLandingPage">
        <div :class="['tips', { tipsOpen }]">
          <ul>
            <template v-for="tip in tips">
              <li
                v-if="tip !== 'br'"
                :key="tip"
                class="tip"
                v-html="tip">
              </li>
              <br v-else>
            </template>
          </ul>
        </div>
      </template>

      <!-- ============================================================ AUTH -->

      <Auth />

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters } from 'vuex'

import Bingo from '@/components/bingo'
import Auth from '@/components/auth'
import LandingSiteData from '@/data/landing.json'

// ====================================================================== Export
export default {
  name: 'LandingSite',

  components: {
    Bingo,
    Auth
  },

  props: {
    tipsOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    mobile: {
      type: Boolean,
      required: false,
      default: false
    },
    page: {
      type: String,
      required: true,
      default: 'index'
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      landing: 'general/landing'
    }),
    isNotLandingPage () {
      return this.$route.path !== '/' && this.$route.path !== '/info'
    },
    links () {
      return this.landing.data[this.page].links
    },
    tips () {
      return this.page === 'spaze' ? this.landing.data[this.page].tips : []
    }
  },

  methods: {
    getBingoParameters (link) {
      return this.mobile ? link.bingo_touchmode : link.bingo
    }
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////////// nav
.landing-site {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  &.low-z {
    z-index: -1;
  }
}

.inner-panel {
  padding-top: 4rem;
  padding-left: 4rem;
}

.link {
  position: relative;
  transition: 300ms ease;
  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0));
  @include fontSize_Main;
  @include fontWeight_Bold;
  letter-spacing: 0.1em;
  @include fontFamily_NanumMyeongjo;
  &:hover {
    @include linkShadow;
  }
}

.fuites {
  margin-bottom: 4rem;
}

.portal-link {
  margin: 0.25rem 0;
  margin-left: 1.5rem;
}

// //////////////////////////////////////////////////////////////////////// tips
.tips {
  margin-left: 1rem;
  padding: 0.5rem;
  transition: 250ms ease;
  transform: scale(0.8);
  opacity: 0;
  z-index: -1;
  &.tipsOpen {
    transform: scale(1);
    opacity: 1;
    z-index: 100;
  }
}

.tip {
  position: relative;
  list-style-type: none;
  max-width: 37.5rem;
  @include fontSize_Main;
  &:before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 0.6875rem;
    width: 2px;
    height: 2px;
    background-color: black;
    border-radius: 50%;
  }
}

// ////////////////////////////////////////////////////////////// authentication
:deep(.auth-container) {
  .portal-link {
    margin: 0.25rem 0;
    margin-left: 1.5rem;
  }
}

</style>
