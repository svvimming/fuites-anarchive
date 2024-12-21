<template>
  <div class="auth-container">
    <div class="input-container">

      <div :class="['input-wrapper', { active: value }]">
        <input
          v-model="value"
          ref="input"
          type="email"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          @keyup.enter="submit"
          placeholder="enter token" />
      </div>

      <button
        :class="['link', 'portal-link', 'submit', { active: !!value }]"
        @click="submit">
        submit
      </button>

    </div>
  </div>
</template>

<script setup>
// ======================================================================== Data
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const collectorStore = useCollectorStore()
const value = ref('')

const emit = defineEmits(['authenticate-success'])

// ===================================================================== Methods
const submit = async () => {
  const sanitized = value.value.replaceAll(' ', '-').split('-').filter(word => word !== '-').map(word => word.toLowerCase())
  const joined = sanitized.join('-')
  await pocketStore.getAuthPocket(joined)
  if (pocket.value.authenticated) {
    collectorStore.getThingies()
    emit('authenticate-success')
  }
  value.value = ''
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.link {
  position: relative;
  transition: 300ms ease;
  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0));
  font-size: torem(18);
  font-weight: 700;
  letter-spacing: 0.1em;
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
  font-size: torem(18);
  font-weight: 700;
  letter-spacing: 0.1em;
}

input::-webkit-input-placeholder {
  color: $woodsmoke;
}

input::-moz-placeholder {
  color: $woodsmoke;
}

input::-ms-placeholder {
  color: $woodsmoke;
}

input::placeholder {
  color: $woodsmoke;
}

.submit {
  margin: 0.25rem 0;
  margin-left: 1.5rem;
  text-align: left;
  opacity: 0;
  &.active {
    opacity: 1;
  }
}

</style>
