<template>
  <div
    v-if="!authenticated && isNotLandingPage"
    :class="['auth-container', { touchmode }]">
    <div class="input-container">

      <div :class="['input-wrapper', { active: token }]">
        <input
          v-model="token"
          ref="input"
          type="email"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          @keyup.enter="submit(token)"
          placeholder="enter token" />
      </div>

      <button
        :class="['link', 'portal-link', 'submit', { active: token }]"
        @click="submit(token)">
        submit
      </button>

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

// ====================================================================== Export
export default {
  name: 'Auth',

  data () {
    return {
      token: ''
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      touchmode: 'general/touchmode'
    }),
    isNotLandingPage () {
      return this.$route.path !== '/' && this.$route.path !== '/info'
    }
  },

  methods: {
    ...mapActions({
      authenticate: 'general/authenticate'
    }),
    async submit (token) {
      const sanitized = token.replaceAll(' ', '-').split('-').filter(word => word !== '-').map(word => word.toLowerCase())
      const joined = sanitized.join('-')
      const authenticated = await this.authenticate(joined)
      if (process.client && authenticated) {
        localStorage.setItem('fuitesAnarchiveAuthToken', joined)
        localStorage.setItem('fuitesAnarchiveAuthDate', Date.now().toString())
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
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

.auth-container {
  &.touchmode {
    padding-left: 0.5rem;
    .input-container {
      flex-direction: row;
    }
    .input-wrapper {
      margin: 0;
    }
    .input {
      width: 8rem;
      font-size: 1.25rem;
    }
    .submit {
      position: relative;
      margin: 0 0.5rem;
      padding: 0 0.5rem;
      font-size: 1rem;
    }
  }
}

// ////////////////////////////////////////////////////////////// authentication
.input-container {
  display: flex;
  position: relative;
  flex-direction: column;
  margin-right: 0.25rem;
  width: 100%;
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
    opacity: 0;
    transition: 200ms ease;
  }
  &:hover {
    &:after {
      opacity: 0.7;
      width: calc(100% + 1rem);
      left: -0.5rem;
    }
  }
  &.active {
    &:after {
      opacity: 0.7;
    }
  }
}

.input {
  width: 100%;
  height: 2rem;
  @include fontSize_Main;
  @include fontWeight_Bold;
  letter-spacing: 0.1em;
}

input::-webkit-input-placeholder {
  color: black;
}

input::-moz-placeholder {
  color: black;
}

input::-ms-placeholder {
  color: black;
}

input::placeholder {
  color: black;
}

.submit {
  position: absolute;
  top: 100%;
  margin: 0.25rem 0;
  margin-left: 1.5rem;
  text-align: left;
  opacity: 0;
  &.active {
    opacity: 1;
  }
}

</style>
