<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Settings</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-tabs
          v-model="tab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="audio" icon="mic" label="Audio" />
          <q-tab name="video" icon="videocam" label="Video" />
          <q-tab name="general" icon="settings" label="General" />
        </q-tabs>

        <q-separator class="q-my-md" />

        <q-tab-panels v-model="tab" animated>
          <!-- Audio Settings -->
          <q-tab-panel name="audio">
            <div class="q-gutter-md">
              <div>
                <div class="text-subtitle2 q-mb-sm">Microphone</div>
                <q-select
                  :model-value="selectedAudioDevice"
                  @update:model-value="$emit('update:audio-device', $event)"
                  :options="audioDeviceOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  option-value="value"
                  option-label="label"
                >
                  <template v-slot:prepend>
                    <q-icon name="mic" />
                  </template>
                </q-select>
              </div>

              <div>
                <div class="text-subtitle2 q-mb-sm">Microphone Volume</div>
                <q-slider
                  v-model="micVolume"
                  :min="0"
                  :max="100"
                  :step="1"
                  label
                  color="primary"
                />
              </div>

              <div>
                <div class="text-subtitle2 q-mb-sm">Test Microphone</div>
                <div class="mic-test">
                  <q-linear-progress
                    :value="micLevel / 100"
                    color="positive"
                    size="20px"
                    class="q-mb-sm"
                  />
                  <q-btn
                    :label="isTesting ? 'Stop Test' : 'Start Test'"
                    :color="isTesting ? 'negative' : 'primary'"
                    @click="toggleMicTest"
                    size="sm"
                  />
                </div>
              </div>

              <q-toggle
                v-model="noiseSuppression"
                label="Noise Suppression"
                color="primary"
              />

              <q-toggle
                v-model="echoCancellation"
                label="Echo Cancellation"
                color="primary"
              />
            </div>
          </q-tab-panel>

          <!-- Video Settings -->
          <q-tab-panel name="video">
            <div class="q-gutter-md">
              <div>
                <div class="text-subtitle2 q-mb-sm">Camera</div>
                <q-select
                  :model-value="selectedVideoDevice"
                  @update:model-value="$emit('update:video-device', $event)"
                  :options="videoDeviceOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  option-value="value"
                  option-label="label"
                >
                  <template v-slot:prepend>
                    <q-icon name="videocam" />
                  </template>
                </q-select>
              </div>

              <div>
                <div class="text-subtitle2 q-mb-sm">Video Quality</div>
                <q-select
                  v-model="videoQuality"
                  :options="videoQualityOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                />
              </div>

              <div>
                <div class="text-subtitle2 q-mb-sm">Preview</div>
                <div class="video-preview">
                  <video ref="previewVideo" autoplay muted playsinline></video>
                </div>
              </div>

              <q-toggle
                v-model="mirrorVideo"
                label="Mirror My Video"
                color="primary"
              />

              <q-toggle
                v-model="hdVideo"
                label="HD Video (requires more bandwidth)"
                color="primary"
              />
            </div>
          </q-tab-panel>

          <!-- General Settings -->
          <q-tab-panel name="general">
            <div class="q-gutter-md">
              <q-toggle
                v-model="darkMode"
                label="Dark Mode"
                color="primary"
              />

              <q-toggle
                v-model="showCaptions"
                label="Show Captions (Beta)"
                color="primary"
              />

              <q-toggle
                v-model="virtualBackground"
                label="Virtual Background"
                color="primary"
              />

              <div>
                <div class="text-subtitle2 q-mb-sm">Layout</div>
                <q-select
                  v-model="layoutPreference"
                  :options="layoutOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                />
              </div>

              <q-separator />

              <div>
                <div class="text-subtitle2 q-mb-md">Keyboard Shortcuts</div>
                <q-list dense bordered class="rounded-borders">
                  <q-item>
                    <q-item-section>
                      <q-item-label>Mute/Unmute</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey-7">Ctrl + D</q-badge>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>Start/Stop Video</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey-7">Ctrl + E</q-badge>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>Share Screen</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey-7">Ctrl + Shift + S</q-badge>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>Toggle Chat</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey-7">Ctrl + Shift + C</q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn label="Save" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed } from 'vue'
import { useQuasar, LocalStorage } from 'quasar'

export default {
  name: 'SettingsDialog',
  props: {
    modelValue: Boolean,
    audioDevices: Array,
    videoDevices: Array,
    selectedAudioDevice: String,
    selectedVideoDevice: String
  },
  emits: ['update:modelValue', 'update:audio-device', 'update:video-device'],
  setup(props) {
    const $q = useQuasar()
    const tab = ref('audio')
    const previewVideo = ref(null)

    // Audio settings
    const micVolume = ref(LocalStorage.getItem('micVolume') || 80)
    const noiseSuppression = ref(LocalStorage.getItem('noiseSuppression') !== false)
    const echoCancellation = ref(LocalStorage.getItem('echoCancellation') !== false)
    const isTesting = ref(false)
    const micLevel = ref(0)

    // Video settings
    const videoQuality = ref(LocalStorage.getItem('videoQuality') || 'hd')
    const mirrorVideo = ref(LocalStorage.getItem('mirrorVideo') !== false)
    const hdVideo = ref(LocalStorage.getItem('hdVideo') || false)

    // General settings
    const darkMode = ref($q.dark.isActive)
    const showCaptions = ref(LocalStorage.getItem('showCaptions') || false)
    const virtualBackground = ref(LocalStorage.getItem('virtualBackground') || false)
    const layoutPreference = ref(LocalStorage.getItem('layoutPreference') || 'grid')

    const audioDeviceOptions = computed(() => {
      return props.audioDevices?.map(device => ({
        label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
        value: device.deviceId
      })) || []
    })

    const videoDeviceOptions = computed(() => {
      return props.videoDevices?.map(device => ({
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        value: device.deviceId
      })) || []
    })

    const videoQualityOptions = [
      { label: '360p (Low)', value: '360p' },
      { label: '720p (HD)', value: 'hd' },
      { label: '1080p (Full HD)', value: 'fullhd' }
    ]

    const layoutOptions = [
      { label: 'Grid View', value: 'grid' },
      { label: 'Speaker View', value: 'speaker' },
      { label: 'Gallery View', value: 'gallery' }
    ]

    const toggleMicTest = () => {
      isTesting.value = !isTesting.value
      
      if (isTesting.value) {
        // Simulate mic testing (in real app, use actual audio analysis)
        const interval = setInterval(() => {
          if (!isTesting.value) {
            clearInterval(interval)
            micLevel.value = 0
            return
          }
          micLevel.value = Math.random() * 80 + 20
        }, 100)
      } else {
        micLevel.value = 0
      }
    }

    return {
      tab,
      previewVideo,
      micVolume,
      noiseSuppression,
      echoCancellation,
      isTesting,
      micLevel,
      videoQuality,
      mirrorVideo,
      hdVideo,
      darkMode,
      showCaptions,
      virtualBackground,
      layoutPreference,
      audioDeviceOptions,
      videoDeviceOptions,
      videoQualityOptions,
      layoutOptions,
      toggleMicTest
    }
  }
}
</script>

<style lang="scss" scoped>
.video-preview {
  width: 100%;
  height: 200px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  position: relative;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.mic-test {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}
</style>