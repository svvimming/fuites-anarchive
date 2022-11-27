<template>
  <div :class="['landing-site', { 'low-z': authenticated && isNotLandingPage && !tipsOpen }]">
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
              :font-size="24"
              :custom="link.bingo" />
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
                class="tip">
                {{ tip }}
              </li>
              <br v-else>
            </template>
          </ul>
        </div>
      </template>

      <!-- ============================================================ AUTH -->

      <template v-if="!authenticated && isNotLandingPage">
        <div :class="['auth-container', { active: authPanelOpen }]">
          <button
            v-if="!authPanelOpen"
            class="link portal-link"
            @click="toggleAuth(true)">
            enter token
          </button>
          <div
            :class="['input-container', { visible: authPanelOpen }]">
            <div class="input-wrapper">
              <input
                v-model="token"
                ref="input"
                type="text"
                autocomplete="off"
                class="input"
                @keyup.enter="authenticate(token)" />
            </div>
            <button
              class="link portal-link submit"
              @click="authenticate(token)">
              submit
            </button>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Bingo from '@/components/bingo';

// ====================================================================== Export
export default {
  name: 'LandingSite',

  components: {
    Bingo
  },

  props: {
    links: {
      type: Array,
      required: false,
      default: () => []
    },
    tips: {
      type: Array,
      required: false,
      default: () => []
    },
    tipsOpen: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  data () {
    return {
      authPanelOpen: false,
      token: '',
      key: 0
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated'
    }),
    isNotLandingPage () {
      return this.$route.path !== '/' && this.$route.path !== '/info'
    }
  },

  methods: {
    ...mapActions({
      authenticate: 'general/authenticate'
    }),
    toggleAuth (status) {
      this.authPanelOpen = status
      if (!status) {
        this.token = ''
      }
      this.$refs.input.focus()
    }
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////////// nav
.landing-site {
  position: absolute;
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
  @include fontSize_Main;
  &:before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 2px;
    background-color: black;
    border-radius: 50%;
  }
}

// ////////////////////////////////////////////////////////////// authentication
.input-container {
  display: flex;
  position: relative;
  flex-direction: column;
  margin-right: 0.25rem;
  width: 100%;
  visibility: hidden;
  &.visible {
    visibility: visible;
  }
}

.input-wrapper {
  flex-grow: 1;
  margin: 0.25rem 0;
  margin-left: 1.5rem;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    left: 0;
    bottom: -2px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    opacity: 0.7;
    transition: 200ms ease;
  }
  &:hover {
    &:after {
      width: calc(100% + 1rem);
      left: -0.5rem;
    }
  }
}

.input {
  width: 100%;
  @include fontSize_Main;
  @include fontWeight_Bold;
  letter-spacing: 0.1em;
}

.submit {
  margin: 0.25rem 0;
  margin-left: 1.5rem;
  text-align: left;
}

</style>
