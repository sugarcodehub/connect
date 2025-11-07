<template>
  <q-page class="room-page">
    <!-- Loading Screen -->
    <div v-if="connecting" class="loading-screen">
      <q-spinner-dots color="primary" size="80px" />
      <div class="text-h6 q-mt-md">
        {{ connectionError || 'Connecting to room...' }}
      </div>
    </div>

    <!-- Room Content -->
    <div v-else class="room-content">
      <!-- Top Bar -->
      <q-toolbar class="room-toolbar bg-dark text-white">
        <q-toolbar-title>
          <q-icon name="videocam" size="sm" class="q-mr-sm" />
          {{ roomName }}
        </q-toolbar-title>

        <div class="row q-gutter-sm items-center">
          <!-- Timer -->
          <div class="text-subtitle2">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            {{ callDuration }}
          </div>

          <!-- Participants Count -->
          <q-chip dense color="primary" text-color="white">
            <q-avatar icon="people" color="primary" text-color="white" />
            {{ participantCount }}
          </q-chip>

          <!-- Settings -->
          <q-btn flat dense round icon="settings" @click="showSettings = true">
            <q-tooltip>Settings</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>

      <!-- Video Grid Container -->
      <div class="video-container" ref="videoContainer">
        <!-- Main Video (Screen Share or Featured) -->
        <div 
          v-if="featuredVideo"
          class="featured-video"
          :class="{ 'with-sidebar': sidebarOpen }"
        >
          <video 
            ref="featuredVideoEl" 
            autoplay 
            playsinline
            :class="{ mirrored: featuredVideo.isLocal && !featuredVideo.isScreenShare }"
          ></video>
          <div class="video-label">
            {{ featuredVideo.name }}
            <q-chip v-if="featuredVideo.isScreenShare" dense size="sm" color="info" class="q-ml-sm">
              Screen Share
            </q-chip>
          </div>
        </div>

        <!-- Grid View -->
        <div 
          v-else
          class="video-grid"
          :class="gridClass"
        >
          <!-- Local Video -->
          <ResizableVideo
            v-if="localVideoTrack"
            :video-track="localVideoTrack"
            :participant-name="`${username} (You)`"
            :is-local="true"
            :audio-muted="audioMuted"
            :video-muted="videoMuted"
            :is-speaking="false"
            @toggle-pin="featuredVideo = localVideoTrack"
          />

          <!-- Remote Videos -->
          <ResizableVideo
            v-for="participant in remoteParticipants"
            :key="participant.id"
            :video-track="participant.videoTrack"
            :participant-name="participant.name"
            :is-local="false"
            :audio-muted="participant.audioMuted"
            :video-muted="!participant.videoTrack"
            :is-speaking="participant.isSpeaking"
            @toggle-pin="togglePin(participant)"
          />
        </div>

        <!-- Thumbnail Grid (when featured video is active) -->
        <div v-if="featuredVideo" class="thumbnail-grid">
          <div 
            v-for="participant in allParticipantsExceptFeatured"
            :key="participant.id"
            class="thumbnail-video"
            @click="setFeaturedVideo(participant)"
          >
            <video 
              :ref="el => setVideoRef(el, participant)"
              autoplay 
              playsinline
              muted
              :class="{ mirrored: participant.isLocal && !participant.isScreenShare }"
            ></video>
            <div class="thumbnail-label">{{ participant.name }}</div>
            <q-icon 
              v-if="participant.audioMuted" 
              name="mic_off" 
              size="xs" 
              class="thumbnail-muted-icon"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Controls Bar -->
      <q-toolbar class="controls-toolbar">
        <div class="row q-gutter-md justify-center full-width">
          <!-- Audio Toggle -->
          <q-btn
            round
            :color="audioMuted ? 'negative' : 'positive'"
            :icon="audioMuted ? 'mic_off' : 'mic'"
            size="lg"
            @click="toggleAudio"
          >
            <q-tooltip>{{ audioMuted ? 'Unmute' : 'Mute' }}</q-tooltip>
          </q-btn>

          <!-- Video Toggle -->
          <q-btn
            round
            :color="videoMuted ? 'negative' : 'positive'"
            :icon="videoMuted ? 'videocam_off' : 'videocam'"
            size="lg"
            @click="toggleVideo"
          >
            <q-tooltip>{{ videoMuted ? 'Start Video' : 'Stop Video' }}</q-tooltip>
          </q-btn>

          <!-- Screen Share -->
          <q-btn
            round
            :color="isScreenSharing ? 'primary' : 'grey-7'"
            icon="screen_share"
            size="lg"
            @click="toggleScreenShare"
          >
            <q-tooltip>{{ isScreenSharing ? 'Stop Sharing' : 'Share Screen' }}</q-tooltip>
          </q-btn>

          <!-- Chat -->
          <q-btn
            round
            :color="chatOpen ? 'primary' : 'grey-7'"
            icon="chat"
            size="lg"
            @click="toggleChat"
          >
            <q-badge v-if="unreadMessages > 0" color="red" floating>
              {{ unreadMessages }}
            </q-badge>
            <q-tooltip>Chat</q-tooltip>
          </q-btn>

          <!-- Participants -->
          <q-btn
            round
            :color="participantsOpen ? 'primary' : 'grey-7'"
            icon="people"
            size="lg"
            @click="toggleParticipants"
          >
            <q-tooltip>Participants</q-tooltip>
          </q-btn>

          <!-- More Options -->
          <q-btn
            round
            color="grey-7"
            icon="more_vert"
            size="lg"
          >
            <q-menu>
              <q-list style="min-width: 200px">
                <q-item clickable v-close-popup @click="toggleRecording">
                  <q-item-section avatar>
                    <q-icon :name="isRecording ? 'stop_circle' : 'fiber_manual_record'" 
                            :color="isRecording ? 'negative' : 'grey'" />
                  </q-item-section>
                  <q-item-section>
                    {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="toggleLayoutMode">
                  <q-item-section avatar>
                    <q-icon name="grid_view" />
                  </q-item-section>
                  <q-item-section>
                    {{ layoutMode === 'grid' ? 'Speaker View' : 'Grid View' }}
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="showSettings = true">
                  <q-item-section avatar>
                    <q-icon name="settings" />
                  </q-item-section>
                  <q-item-section>Settings</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="toggleFullscreen">
                  <q-item-section avatar>
                    <q-icon :name="isFullscreen ? 'fullscreen_exit' : 'fullscreen'" />
                  </q-item-section>
                  <q-item-section>
                    {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <q-tooltip>More Options</q-tooltip>
          </q-btn>

          <!-- End Call -->
          <q-btn
            round
            color="negative"
            icon="call_end"
            size="lg"
            @click="confirmEndCall"
          >
            <q-tooltip>End Call</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>

      <!-- Right Sidebar (Chat/Participants) -->
      <q-drawer
        v-model="sidebarOpen"
        side="right"
        overlay
        behavior="desktop"
        :width="400"
        :breakpoint="500"
        class="bg-dark"
      >
        <q-tabs
          v-model="sidebarTab"
          dense
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="chat" icon="chat" label="Chat" />
          <q-tab name="participants" icon="people" label="Participants" />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-model="sidebarTab"
          animated
          class="bg-transparent"
          style="height: calc(100vh - 150px)"
        >
          <q-tab-panel name="chat">
            <ChatPanel 
              :room="room"
              :connected="connected"
              :current-username="username"
              @new-message="onNewMessage"
            />
          </q-tab-panel>

          <q-tab-panel name="participants">
            <ParticipantsPanel
              :participants="allParticipants"
              :current-user-id="username"
            />
          </q-tab-panel>
        </q-tab-panels>
      </q-drawer>
    </div>

    <!-- Settings Dialog -->
    <SettingsDialog 
      v-model="showSettings"
      :audio-devices="audioDevices"
      :video-devices="videoDevices"
      :selected-audio-device="selectedAudioDevice"
      :selected-video-device="selectedVideoDevice"
      @update:audio-device="changeAudioDevice"
      @update:video-device="changeVideoDevice"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
  createLocalAudioTrack,
  createLocalVideoTrack
} from 'livekit-client'
import ResizableVideo from 'components/ResizableVideo.vue'
import ChatPanel from 'components/ChatPanel.vue'
import ParticipantsPanel from 'components/ParticipantsPanel.vue'
import SettingsDialog from 'components/SettingsDialog.vue'

export default {
  name: 'RoomPage',
  components: {
    ResizableVideo,
    ChatPanel,
    ParticipantsPanel,
    SettingsDialog
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    // Refs
    const videoContainer = ref(null)
    const featuredVideoEl = ref(null)
    const roomName = ref(route.params.roomName)
    const username = ref(authStore.currentUser?.username || 'Guest')

    // State
    const connected = ref(false)
    const connecting = ref(true)
    const connectionError = ref('')
    const audioMuted = ref(false)
    const videoMuted = ref(false)
    const isScreenSharing = ref(false)
    const isRecording = ref(false)
    const chatOpen = ref(false)
    const participantsOpen = ref(false)
    const sidebarOpen = ref(false)
    const sidebarTab = ref('chat')
    const showSettings = ref(false)
    const unreadMessages = ref(0)
    const layoutMode = ref('grid')
    const isFullscreen = ref(false)
    const callStartTime = ref(null)
    const callDuration = ref('00:00')

    // LiveKit
    let room = null
    let localAudioTrack = ref(null)
    let localVideoTrack = ref(null)
    let localScreenTrack = null
    const remoteParticipants = ref([])
    const featuredVideo = ref(null)

    // Devices
    const audioDevices = ref([])
    const videoDevices = ref([])
    const selectedAudioDevice = ref(null)
    const selectedVideoDevice = ref(null)

    // Computed
    const participantCount = computed(() => {
      return remoteParticipants.value.length + (localVideoTrack.value ? 1 : 0)
    })

    const gridClass = computed(() => {
      const count = participantCount.value
      if (count <= 1) return 'grid-1'
      if (count <= 4) return 'grid-2'
      if (count <= 9) return 'grid-3'
      return 'grid-4'
    })

    const allParticipants = computed(() => {
      const participants = [...remoteParticipants.value]
      if (localVideoTrack.value) {
        participants.unshift({
          id: 'local',
          name: `${username.value} (You)`,
          videoTrack: localVideoTrack.value,
          audioMuted: audioMuted.value,
          isLocal: true
        })
      }
      return participants
    })

    const allParticipantsExceptFeatured = computed(() => {
      return allParticipants.value.filter(p => p !== featuredVideo.value)
    })

    // Timer
    let timerInterval = null
    const startTimer = () => {
      callStartTime.value = Date.now()
      timerInterval = setInterval(() => {
        const elapsed = Date.now() - callStartTime.value
        const minutes = Math.floor(elapsed / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        callDuration.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }, 1000)
    }

    // Device enumeration
    const enumerateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        audioDevices.value = devices.filter(d => d.kind === 'audioinput')
        videoDevices.value = devices.filter(d => d.kind === 'videoinput')
        
        if (audioDevices.value.length > 0) {
          selectedAudioDevice.value = audioDevices.value[0].deviceId
        }
        if (videoDevices.value.length > 0) {
          selectedVideoDevice.value = videoDevices.value[0].deviceId
        }
      } catch (error) {
        console.error('Failed to enumerate devices:', error)
      }
    }

    // Connect to room
    const connectToRoom = async () => {
      try {
        if (!authStore.currentUser) {
          await authStore.checkAuth()
          if (!authStore.currentUser) {
            $q.notify({
              type: 'negative',
              message: 'Please login first'
            })
            router.push('/login')
            return
          }
        }

        username.value = authStore.currentUser.username

        $q.loading.show({ message: 'Connecting...' })

        const response = await api.post(
          '/rooms/join',
          {
            roomName: roomName.value,
            calleeUsername: route.query.callee
          },
          {
            headers: authStore.getAuthHeader()
          }
        )

        const { token, url } = response.data

        room = new Room({
          adaptiveStream: true,
          dynacast: true
        })

        setupRoomListeners()

        await room.connect(url, String(token))

        await enumerateDevices()

        const tracks = await createLocalTracks({
          audio: { deviceId: selectedAudioDevice.value },
          video: { deviceId: selectedVideoDevice.value }
        })

        for (const track of tracks) {
          await room.localParticipant.publishTrack(track)

          if (track.kind === Track.Kind.Video) {
            localVideoTrack.value = {
              track,
              isLocal: true,
              name: `${username.value} (You)`
            }
          } else if (track.kind === Track.Kind.Audio) {
            localAudioTrack.value = track
          }
        }

        connected.value = true
        connecting.value = false
        $q.loading.hide()
        
        startTimer()

        $q.notify({
          type: 'positive',
          message: 'Connected to room',
          icon: 'videocam'
        })

        processExistingParticipants()
      } catch (error) {
        console.error('Failed to connect:', error)
        connectionError.value = error.response?.data?.error || error.message
        connecting.value = false
        $q.loading.hide()

        $q.notify({
          type: 'negative',
          message: 'Failed to connect to room',
          caption: connectionError.value
        })

        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }

    // Room event listeners
    const setupRoomListeners = () => {
      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
      room.on(RoomEvent.Disconnected, handleDisconnected)
    }

    const handleTrackSubscribed = (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity)

      const existingParticipant = remoteParticipants.value.find(
        p => p.id === participant.sid
      )

      if (track.kind === Track.Kind.Video) {
        if (publication.source === Track.Source.ScreenShare) {
          featuredVideo.value = {
            track,
            name: participant.identity,
            isScreenShare: true,
            id: participant.sid
          }
          
          nextTick(() => {
            if (featuredVideoEl.value) {
              track.attach(featuredVideoEl.value)
            }
          })
        } else {
          if (existingParticipant) {
            existingParticipant.videoTrack = track
          } else {
            remoteParticipants.value.push({
              id: participant.sid,
              name: participant.identity,
              videoTrack: track,
              audioMuted: false,
              isSpeaking: false
            })
          }
        }
      } else if (track.kind === Track.Kind.Audio) {
        const audioEl = track.attach()
        document.body.appendChild(audioEl)
        
        if (existingParticipant) {
          existingParticipant.audioTrack = track
        }
      }
    }

    const handleTrackUnsubscribed = (track, publication, participant) => {
      track.detach()
      
      if (publication.source === Track.Source.ScreenShare) {
        featuredVideo.value = null
      } else {
        const index = remoteParticipants.value.findIndex(
          p => p.id === participant.sid
        )
        if (index !== -1 && track.kind === Track.Kind.Video) {
          remoteParticipants.value[index].videoTrack = null
        }
      }
    }

    const handleParticipantConnected = (participant) => {
      console.log('Participant connected:', participant.identity)
      
      $q.notify({
        type: 'info',
        message: `${participant.identity} joined`,
        icon: 'person_add'
      })
    }

    const handleParticipantDisconnected = (participant) => {
      console.log('Participant disconnected:', participant.identity)
      
      const index = remoteParticipants.value.findIndex(
        p => p.id === participant.sid
      )
      if (index !== -1) {
        remoteParticipants.value.splice(index, 1)
      }

      $q.notify({
        type: 'info',
        message: `${participant.identity} left`,
        icon: 'person_remove'
      })
    }

    const handleActiveSpeakersChanged = (speakers) => {
      remoteParticipants.value.forEach(p => {
        p.isSpeaking = speakers.some(s => s.sid === p.id)
      })
    }

    const handleDisconnected = (reason) => {
      console.log('Disconnected:', reason)
      router.push('/')
    }

    const processExistingParticipants = () => {
      room.remoteParticipants.forEach(participant => {
        console.log('Existing participant:', participant.identity)
        
        participant.trackPublications.forEach(publication => {
          if (publication.track) {
            handleTrackSubscribed(
              publication.track,
              publication,
              participant
            )
          }
        })
      })
    }

    // Controls
    const toggleAudio = async () => {
      if (localAudioTrack.value) {
        if (audioMuted.value) {
          await localAudioTrack.value.unmute()
        } else {
          await localAudioTrack.value.mute()
        }
        audioMuted.value = !audioMuted.value
      }
    }

    const toggleVideo = async () => {
      if (localVideoTrack.value?.track) {
        if (videoMuted.value) {
          await localVideoTrack.value.track.unmute()
        } else {
          await localVideoTrack.value.track.mute()
        }
        videoMuted.value = !videoMuted.value
      }
    }

    const toggleScreenShare = async () => {
      try {
        if (isScreenSharing.value) {
          if (localScreenTrack) {
            const publications = Array.from(
              room.localParticipant.trackPublications.values()
            )
            const screenPub = publications.find(
              p => p.source === Track.Source.ScreenShare
            )

            if (screenPub) {
              await room.localParticipant.unpublishTrack(screenPub.track)
            }

            localScreenTrack.stop()
            localScreenTrack = null
            featuredVideo.value = null
          }
          isScreenSharing.value = false
        } else {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
              displaySurface: 'monitor'
            },
            audio: false
          })

          const screenVideoTrack = screenStream.getVideoTracks()[0]

          await room.localParticipant.publishTrack(screenVideoTrack, {
            name: 'screen-share',
            source: Track.Source.ScreenShare
          })

          localScreenTrack = screenVideoTrack
          isScreenSharing.value = true

          screenVideoTrack.onended = () => {
            if (isScreenSharing.value) {
              toggleScreenShare()
            }
          }
        }
      } catch (error) {
        console.error('Screen share error:', error)
        
        if (error.name !== 'AbortError') {
          $q.notify({
            type: 'negative',
            message: 'Failed to share screen',
            caption: error.message
          })
        }
      }
    }

    const toggleRecording = async () => {
      try {
        if (isRecording.value) {
          await api.post(
            '/rooms/stop-recording',
            { roomName: roomName.value },
            { headers: authStore.getAuthHeader() }
          )
          isRecording.value = false
          $q.notify({
            type: 'info',
            message: 'Recording stopped'
          })
        } else {
          await api.post(
            '/rooms/start-recording',
            { roomName: roomName.value },
            { headers: authStore.getAuthHeader() }
          )
          isRecording.value = true
          $q.notify({
            type: 'positive',
            message: 'Recording started'
          })
        }
      } catch (error) {
        $q.notify({
          type: 'warning',
          message: 'Recording feature requires LiveKit Egress service'
        })
      }
    }

    const toggleChat = () => {
      chatOpen.value = !chatOpen.value
      sidebarOpen.value = chatOpen.value || participantsOpen.value
      if (chatOpen.value) {
        sidebarTab.value = 'chat'
        participantsOpen.value = false
        unreadMessages.value = 0
      }
    }

    const toggleParticipants = () => {
      participantsOpen.value = !participantsOpen.value
      sidebarOpen.value = chatOpen.value || participantsOpen.value
      if (participantsOpen.value) {
        sidebarTab.value = 'participants'
        chatOpen.value = false
      }
    }

    const toggleLayoutMode = () => {
      layoutMode.value = layoutMode.value === 'grid' ? 'speaker' : 'grid'
      if (layoutMode.value === 'speaker' && remoteParticipants.value.length > 0) {
        featuredVideo.value = remoteParticipants.value[0]
      } else {
        featuredVideo.value = null
      }
    }

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        videoContainer.value?.requestFullscreen()
        isFullscreen.value = true
      } else {
        document.exitFullscreen()
        isFullscreen.value = false
      }
    }

    const togglePin = (participant) => {
      if (featuredVideo.value === participant) {
        featuredVideo.value = null
      } else {
        featuredVideo.value = participant
      }
    }

    const setFeaturedVideo = (participant) => {
      featuredVideo.value = participant
      
      nextTick(() => {
        if (featuredVideoEl.value && participant.videoTrack) {
          participant.videoTrack.track.attach(featuredVideoEl.value)
        }
      })
    }

    const confirmEndCall = () => {
      $q.dialog({
        title: 'End Call',
        message: 'Are you sure you want to end this call?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        endCall()
      })
    }

    const endCall = async () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }

      if (room) {
        room.disconnect()
      }

      try {
        await api.post(
          '/rooms/end-call',
          { roomName: roomName.value },
          { headers: authStore.getAuthHeader() }
        )
      } catch (error) {
        console.error('End call error:', error)
      }

      router.push('/')
    }

    const changeAudioDevice = async (deviceId) => {
      try {
        const newTrack = await createLocalAudioTrack({
          deviceId
        })
        
        if (localAudioTrack.value) {
          await room.localParticipant.unpublishTrack(localAudioTrack.value)
          localAudioTrack.value.stop()
        }

        await room.localParticipant.publishTrack(newTrack)
        localAudioTrack.value = newTrack
        selectedAudioDevice.value = deviceId
        
        $q.notify({
          type: 'positive',
          message: 'Audio device changed'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to change audio device'
        })
      }
    }

    const changeVideoDevice = async (deviceId) => {
      try {
        const newTrack = await createLocalVideoTrack({
          deviceId
        })
        
        if (localVideoTrack.value?.track) {
          await room.localParticipant.unpublishTrack(localVideoTrack.value.track)
          localVideoTrack.value.track.stop()
        }

        await room.localParticipant.publishTrack(newTrack)
        localVideoTrack.value = {
          track: newTrack,
          isLocal: true,
          name: `${username.value} (You)`
        }
        selectedVideoDevice.value = deviceId
        
        $q.notify({
          type: 'positive',
          message: 'Video device changed'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to change video device'
        })
      }
    }

    const onNewMessage = () => {
      if (!chatOpen.value) {
        unreadMessages.value++
      }
    }

    const setVideoRef = (el, participant) => {
      if (el && participant.videoTrack?.track) {
        participant.videoTrack.track.attach(el)
      }
    }

    // Lifecycle
    onMounted(() => {
      connectToRoom()
      
      document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement
      })
    })

    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      
      if (room) {
        room.disconnect()
      }
    })

    // Watch sidebar
    watch(sidebarOpen, (newVal) => {
      if (!newVal) {
        chatOpen.value = false
        participantsOpen.value = false
      }
    })

    return {
      videoContainer,
      featuredVideoEl,
      roomName,
      username,
      connected,
      connecting,
      connectionError,
      audioMuted,
      videoMuted,
      isScreenSharing,
      isRecording,
      chatOpen,
      participantsOpen,
      sidebarOpen,
      sidebarTab,
      showSettings,
      unreadMessages,
      layoutMode,
      isFullscreen,
      callDuration,
      participantCount,
      gridClass,
      featuredVideo,
      localVideoTrack,
      remoteParticipants,
      allParticipants,
      allParticipantsExceptFeatured,
      audioDevices,
      videoDevices,
      selectedAudioDevice,
      selectedVideoDevice,
      room,
      toggleAudio,
      toggleVideo,
      toggleScreenShare,
      toggleRecording,
      toggleChat,
      toggleParticipants,
      toggleLayoutMode,
      toggleFullscreen,
      togglePin,
      setFeaturedVideo,
      confirmEndCall,
      endCall,
      changeAudioDevice,
      changeVideoDevice,
      onNewMessage,
      setVideoRef
    }
  }
}
</script>

<style lang="scss" scoped>
.room-page {
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #fff;
}

.room-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.room-toolbar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.video-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000;
}

.featured-video {
  width: 100%;
  height: 100%;
  position: relative;
  
  &.with-sidebar {
    width: calc(100% - 400px);
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .video-label {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.video-grid {
  display: grid;
  gap: 10px;
  padding: 10px;
  width: 100%;
  height: 100%;

  &.grid-1 {
    grid-template-columns: 1fr;
  }

  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  &.grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}

.thumbnail-grid {
  position: absolute;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.thumbnail-video {
  position: relative;
  width: 150px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    border-color: $primary;
    transform: scale(1.05);
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
  }

  .thumbnail-label {
    position: absolute;
    bottom: 5px;
    left: 5px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
  }

  .thumbnail-muted-icon {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 2px;
    border-radius: 4px;
  }
}

.mirrored {
  transform: scaleX(-1);
}

.controls-toolbar {
  background: rgba(26, 31, 46, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .video-grid {
    &.grid-3,
    &.grid-4 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .thumbnail-grid {
    flex-direction: row;
    bottom: 80px;
    right: 10px;
    left: 10px;
    max-width: calc(100vw - 20px);
    overflow-x: auto;
  }

  .thumbnail-video {
    width: 120px;
    height: 80px;
  }

  .featured-video.with-sidebar {
    width: 100%;
  }
}
</style>