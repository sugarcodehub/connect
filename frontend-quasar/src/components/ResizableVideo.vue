<template>
  <div 
    class="resizable-video"
    :class="{ 
      'is-speaking': isSpeaking,
      'video-muted': videoMuted 
    }"
    ref="videoContainer"
  >
    <video 
      ref="videoElement" 
      autoplay 
      playsinline
      :muted="isLocal"
      :class="{ mirrored: isLocal }"
    ></video>

    <div v-if="videoMuted" class="no-video-placeholder">
      <q-avatar size="80px" color="grey-7" text-color="white">
        {{ participantName[0].toUpperCase() }}
      </q-avatar>
    </div>

    <div class="video-overlay">
      <div class="video-info">
        <span class="participant-name">{{ participantName }}</span>
        <q-icon 
          v-if="audioMuted" 
          name="mic_off" 
          size="xs" 
          class="q-ml-xs"
          color="negative"
        />
      </div>

      <div class="video-actions">
        <q-btn
          dense
          flat
          round
          size="sm"
          icon="push_pin"
          color="white"
          @click="$emit('toggle-pin')"
        >
          <q-tooltip>Pin Video</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Speaking indicator -->
    <div v-if="isSpeaking" class="speaking-indicator"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import interact from 'interactjs'

export default {
  name: 'ResizableVideo',
  props: {
    videoTrack: {
      type: Object,
      default: null
    },
    participantName: {
      type: String,
      required: true
    },
    isLocal: {
      type: Boolean,
      default: false
    },
    audioMuted: {
      type: Boolean,
      default: false
    },
    videoMuted: {
      type: Boolean,
      default: false
    },
    isSpeaking: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-pin'],
  setup(props) {
    const videoElement = ref(null)
    const videoContainer = ref(null)

    const attachTrack = () => {
      if (videoElement.value && props.videoTrack?.track) {
        props.videoTrack.track.attach(videoElement.value)
      }
    }

    const detachTrack = () => {
      if (videoElement.value && props.videoTrack?.track) {
        props.videoTrack.track.detach(videoElement.value)
      }
    }

    onMounted(() => {
      attachTrack()

      // Make video resizable and draggable (disabled by default in grid view)
      // You can enable this for floating video windows
      /*
      if (videoContainer.value) {
        interact(videoContainer.value)
          .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            listeners: {
              move (event) {
                const { target } = event
                let x = parseFloat(target.getAttribute('data-x')) || 0
                let y = parseFloat(target.getAttribute('data-y')) || 0

                target.style.width = event.rect.width + 'px'
                target.style.height = event.rect.height + 'px'

                x += event.deltaRect.left
                y += event.deltaRect.top

                target.style.transform = `translate(${x}px, ${y}px)`
                target.setAttribute('data-x', x)
                target.setAttribute('data-y', y)
              }
            },
            modifiers: [
              interact.modifiers.restrictSize({
                min: { width: 150, height: 100 }
              })
            ]
          })
          .draggable({
            listeners: {
              move (event) {
                const target = event.target
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

                target.style.transform = `translate(${x}px, ${y}px)`
                target.setAttribute('data-x', x)
                target.setAttribute('data-y', y)
              }
            }
          })
      }
      */
    })

    watch(() => props.videoTrack, (newTrack, oldTrack) => {
      if (oldTrack) {
        detachTrack()
      }
      if (newTrack) {
        attachTrack()
      }
    })

    onUnmounted(() => {
      detachTrack()
    })

    return {
      videoElement,
      videoContainer
    }
  }
}
</script>

<style lang="scss" scoped>
.resizable-video {
  position: relative;
  background: #1a1f2e;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.3s;

  &.is-speaking {
    border-color: $positive;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
    display: block;
  }

  .mirrored {
    transform: scaleX(-1);
  }

  .no-video-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%);
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 15px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .video-overlay {
    opacity: 1;
  }

  .video-info {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .participant-name {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }

  .video-actions {
    display: flex;
    gap: 5px;
  }

  .speaking-indicator {
    position: absolute;
    inset: 0;
    border: 3px solid $positive;
    border-radius: 12px;
    pointer-events: none;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
}
</style>