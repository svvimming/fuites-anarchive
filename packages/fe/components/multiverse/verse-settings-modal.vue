<template>
  <ZeroAlert
    mode="alert"
    alert-id="multiverse-verse-settings-modal">
    <div class="verse-settings-modal">

      <span class="modal-heading">{{ modalHeading }}</span>

      <div class="verse-settings-content">
        <!-- ============================================== Invite Generator -->
        <span class="section-heading">{{ inviteHeading }}</span>
        <span class="description">{{ inviteDescription }}</span>
        
        <div class="invite-link input-row">
          <div class="input-wrapper">
            <input
              v-model="inviteUrl"
              autocomplete="off"
              class="input"
              autocapitalize="none"
              readonly />
          </div>
          <ButtonBasic
            v-if="!inviteUrl"
            :force-loading="generating"
            :force-disabled="generating"
            :class="['add-token-button', { disabled: generating }]"
            @clicked="submitGenerateInvite">
            <span>Generate</span>
          </ButtonBasic>
          <ButtonBasic
            v-else-if="isSupported"
            :class="['copy-button']"
            @clicked="copy(inviteUrl)">
            <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
          </ButtonBasic>
        </div>

        <!-- ================================================= Cron Settings -->
        <div class="cron-settings">
          <span class="section-heading">{{ cronSettings.heading }}</span>
          <div
            v-for="cron in cronSettings.available"
            :key="cron.name"
            class="cron">
            <span class="cron-name">{{ cron.label }}</span>
            <span class="description">{{ cron.description }}</span>
            <div
              v-for="setting in cron.settings"
              :key="setting.name"
              class="setting-row">
              <div class="info-row">
                <span class="setting-label">{{ setting.label }}</span>
                <span class="description">{{ setting.description }}</span>
              </div>
              <div
                v-if="verseSettings && typeof verseSettings[cron.name] === 'object'"
                class="range-wrapper">
                <input
                  v-model="rangeValues[`${cron.name}-${setting.name}`]"
                  type="range"
                  :min="setting.min"
                  :max="setting.max"
                  :step="setting.step"
                  class="input range-input"
                  @input="updateRangeValues(`${cron.name}-${setting.name}`, $event)" />
                <span class="range-value">
                  {{ getDisplayValue(`${cron.name}-${setting.name}`, setting.unit) }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
      <!-- ========================================================= Buttons -->
      <div class="button-row bottom-buttons">
        <ButtonBasic
          :class="['save-button', { disabled: saving }]"
          :force-disabled="saving"
          :force-loading="saving"
          @clicked="saveVerseSettings">
          <span>Save</span>
        </ButtonBasic>
        <ButtonBasic
          :class="['cancel-button']"
          @clicked="emit('close-alert')">
          <span>Close</span>
        </ButtonBasic>
      </div>

    </div>
  </ZeroAlert>    
</template>

<script setup>
// ===================================================================== Imports
import { useClipboard } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  verse: {
    type: Object,
    required: false,
    default: false
  }
})

const emit = defineEmits(['close-alert'])

// ======================================================================== Data
const alertStore = useZeroAlertStore()
const pocketStore = usePocketStore()
const verseStore = useVerseStore()
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const inviteUrl = ref('')
const generating = ref(false)
const { copy, copied, isSupported } = useClipboard({ source: inviteUrl })
const rangeValues = ref({})
const saving = ref(false)

// ==================================================================== Computed
const inviteSettings = computed(() => siteData.value?.settings?.verseSettings.invite)
const modalHeading = computed(() => `Settings for '${props.verse?.name}'`)
const inviteHeading = computed(() => inviteSettings.value?.heading.replace('<<verse-name>>', props.verse?.name))
const inviteDescription = computed(() => inviteSettings.value?.description)
const cronSettings = computed(() => siteData.value?.settings?.verseSettings.crons)
const verseSettings = computed(() => props.verse?.settings || false)

// ==================================================================== Watchers
watch(() => props.verse?._id, (val) => {
  const alert = alertStore.getAlert('multiverse-verse-settings-modal')
  if (val) {
    inviteUrl.value = ''
    generating.value = false
    initRangeValues()
    alertStore.openAlert('multiverse-verse-settings-modal')
  } else if (alert.status === 'open') {
    alertStore.closeAlert('multiverse-verse-settings-modal')
  }
})

// ===================================================================== Methods
/**
 * @method submitGenerateInvite
 */

const submitGenerateInvite = async() => {
  generating.value = true
  const result = await pocketStore.postGenerateInvite({
    verses: props.verse.name
  })
  if (result) {
    inviteUrl.value = result.url
  }
  generating.value = false
}

/**
 * @method updateRangeValues
 * @param {string} key
 * @param {string} value
 */

const updateRangeValues = (key, e) => {
  rangeValues.value[key] = e.target.value
}

/**
 * @method initRangeValues
 */

const initRangeValues = () => {
  if (cronSettings.value && verseSettings.value) {
    const crons = cronSettings.value.available
    crons.forEach(cron => {
      cron.settings.forEach(setting => {
        const key = `${cron.name}-${setting.name}`
        const verseCron = verseSettings.value[cron.name]
        if (typeof verseCron === 'object' && verseCron.hasOwnProperty(setting.name)) {
          rangeValues.value[key] = verseCron[setting.name]
        } else {
          rangeValues.value[key] = setting.default
        }
      })
    })
  }
}

/**
 * @method getDisplayValue
 * @param {string} key
 * @param {string} unit
 * @returns {string}
 */

const getDisplayValue = (key, unit) => {
  const value = rangeValues.value[key]
  if (unit) {
    if (value <= 1) {
      return `${value} ${unit.slice(0, -1)}`
    } else {
      return `${value} ${unit}`
    }
  }
  if (key === 'fuitesbot-overflowIntensity') {
    const num = parseInt(value)
    return num === 0 ? 'Off' :
      num === 1 ? 'Mischievous' :
      num > 1 && num <= 4 ? 'Anarchic' :
      num > 4 && num <= 7 ? 'Chaotic' : 'Disruptive'
  }
  return value
}

/**
 * @method saveVerseSettings
 */

const saveVerseSettings = async () => {
  // Set the saving state
  saving.value = true
  // Convert the range values object from a flat object to the nested settings format
  const newCronSettings = Object.keys(rangeValues.value).reduce((acc, key) => {
    const [cron, setting] = key.split('-')
    acc[cron] = Object.assign({}, acc[cron], { [setting]: rangeValues.value[key] })
    return acc
  }, {})
  // Copy all existing settings overwriting changes cron setting values
  const settings = {}
  Object.keys(verseSettings.value).forEach(key => {
    settings[key] = Object.assign({}, verseSettings.value[key], newCronSettings[key] || {})
  })
  // Save the settings
  await verseStore.postUpdateVerseSettings({
    _id: props.verse._id,
    settings
  })
  // Reset the saving state
  saving.value = false
  // Close the alert
  emit('close-alert')
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-settings-modal {
  padding: torem(16) torem(2);
  border-radius: torem(20);
  transition: 300ms ease;
  background-color: $athensGray;
  min-width: torem(500);
  max-width: torem(560);
  @include modalShadow;
}

.input-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  // justify-content: space-between;
  margin-bottom: torem(18);
}

.verse-settings-content {
  padding: torem(8) torem(16);
  max-height: torem(500);
  overflow-y: scroll;
}

// ////////////////////////////////////////////////////////// Modal Form Styling
.modal-heading {
  display: block;
  padding-bottom: torem(18);
  margin: 0 torem(16);
  margin-bottom: torem(18);
  font-weight: 600;
  font-size: torem(20);
  color: $drippyDark;
  border-bottom: 1px solid rgba(#B2B9CC, 0.5);
}

.body-text {
  display: block;
  font-size: torem(14);
  font-weight: 400;
  color: $drippyDark;
  margin-bottom: torem(18);
}

.section-heading {
  display: block;
  font-size: torem(16);
  font-weight: 500;
  color: $drippyDark;
  margin-bottom: torem(10);
}

.description {
  display: block;
  font-size: torem(14);
  font-weight: 400;
  line-height: 1.3;
  color: $drippyDark;
  margin-bottom: torem(18);
}

.input-wrapper {
  position: relative;
  margin-right: torem(10);
  margin-bottom: torem(10);
  width: 100%;
  border-radius: torem(10);
  background-color: #DFE0E5;
  box-shadow: inset 0 2px 4px rgba(#595555, 0.25), inset 0 -2px 0 #F6F7FA;
  &.error {
    .input {
      color: $pollyPink;
    }
  }
}

.input {
  width: 100%;
  padding: torem(12) torem(20);
  height: torem(43);
  font-size: torem(16);
  font-weight: 500;
  color: $drippyDark;
}

input::-webkit-input-placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

input::-moz-placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

input::-ms-placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

input::placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

.add-token-button {
  margin-bottom: torem(2);
  &.disabled {
    pointer-events: none;
  }
}

.button-row {
  display: flex;
  :deep(.basic-button) {
    flex-grow: 1;
    &:not(:last-child) {
      margin-right: torem(30);
    }
  }
}

// ///////////////////////////////////////////////////////////////// Invite Link
.invite-link {
  border-bottom: 1px solid rgba(#B2B9CC, 0.5);
  padding-bottom: torem(18);
  margin-bottom: torem(18);
}

// /////////////////////////////////////////////////////////////// Cron Settings
.setting-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-top: torem(8);
  margin: 0 torem(22);
  border-top: 1px solid rgba(#B2B9CC, 0.33);
  &:last-child {
    border-bottom: 1px solid rgba(#B2B9CC, 0.33);
    margin-bottom: torem(18);
  }
}

.info-row {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 66%;
  margin-right: torem(22);
  .setting-label {
    font-size: torem(14);
    font-weight: 500;
    color: $drippyDark;
  }
  .description {
    font-size: torem(12);
  }
}

.range-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 33%;
}

.range-input {
  display: block;
  padding: 0;
  -webkit-appearance: none;
  width: 100%;
  height: torem(4);
  background: transparent;
  margin: torem(8) 0;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: torem(16);
    height: torem(16);
    border-radius: 50%;
    background: #F6F7FA;
    cursor: pointer;
    border: 2px solid #B2B9CC;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-top: torem(-6);
  }
  &::-moz-range-thumb {
    width: torem(16);
    height: torem(16);
    border-radius: 50%;
    background: #F6F7FA;
    cursor: pointer;
    border: 2px solid #B2B9CC;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: torem(4);
    cursor: pointer;
    background: #B2B9CC;
    border-radius: torem(2);
    margin: torem(8) 0;
  }
  &::-moz-range-track {
    width: 100%;
    height: torem(4);
    cursor: pointer;
    background: #B2B9CC;
    border-radius: torem(2);
  }
  &:focus {
    outline: none;
  }
  &:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 2px rgba(#B2B9CC, 0.3);
  }
  &:focus::-moz-range-thumb {
    box-shadow: 0 0 0 2px rgba(#B2B9CC, 0.3);
  }
}

.range-value {
  font-size: torem(12);
  font-weight: 500;
  color: $drippyDark;
}

// /////////////////////////////////////////////////////////////// Cancel Button
.bottom-buttons {
  padding: 0 torem(14);
}

.save-button {
  background-color: $kellyGreen;
  box-shadow: 0 2px 8px rgba($kellyGreen, 0.5);
  margin-top: torem(18);
}

.cancel-button {
  background-color: $pollyPink;
  box-shadow: 0 2px 8px rgba($pollyPink, 0.5);
  margin-top: torem(18);
}

.feedback-message {
  position: absolute;
  bottom: torem(-20);
  left: torem(20);
  font-size: torem(12);
  color: $kellyGreen;
  font-weight: 500;
  &.error {
    color: $pollyPink;
  }
}
</style>
