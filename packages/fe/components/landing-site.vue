<template>
  <div class="landing-site">

    <div class="inner-panel">
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

      <div v-if="isNotIndex">
        <div
          v-if="!authenticated"
          :class="['auth-container', { active: authPanelOpen }]">

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
      </div>

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
    }
  },

  data () {
    return {
      authPanelOpen: false,
      token: ''
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated'
    }),
    isNotIndex () {
      return this.$route.path !== '/'
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
// ///////////////////////////////////////////////////////////////////// General
.landing-site {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
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
