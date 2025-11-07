<template>
  <div class="room-container">
    <div v-if="connecting" class="loading-screen">
      <div class="spinner"></div>
      <p v-if="!connectionError">Connecting to room...</p>
      <p v-else class="error-message">{{ connectionError }}</p>
    </div>

    <div v-else class="room-content">
      <div class="video-grid">
        <!-- Local Video -->
        <div class="video-wrapper local">
          <video ref="localVideo" autoplay muted playsinline></video>
          <div class="video-label">You ({{ username }})</div>
        </div>

        <!-- Remote Video -->
        <div class="video-wrapper remote">
          <video ref="remoteVideo" autoplay playsinline></video>
          <div v-if="remoteUsername" class="video-label">
            {{ remoteUsername }}
          </div>
          <div v-else class="waiting">Waiting for participant...</div>
        </div>

        <!-- Screen Share Display -->
        <div v-if="screenShareTrack" class="video-wrapper screen-share">
          <video ref="screenShareVideo" autoplay playsinline></video>
          <div class="video-label">Screen Share</div>
        </div>
      </div>

      <div class="controls">
        <button
          @click="toggleAudio"
          :class="['control-btn', { active: !audioMuted }]"
          title="Toggle microphone"
        >
          <span v-if="!audioMuted">🎤</span>
          <span v-else>🔇</span>
        </button>

        <button
          @click="toggleVideo"
          :class="['control-btn', { active: !videoMuted }]"
          title="Toggle camera"
        >
          <span v-if="!videoMuted">📹</span>
          <span v-else>📷</span>
        </button>

        <button
          @click="toggleScreenShare"
          :class="['control-btn', { active: isScreenSharing }]"
          title="Toggle screen share"
        >
          <span>🖥️</span>
        </button>

        <button
          @click="toggleRecording"
          :class="['control-btn', { active: isRecording }]"
          title="Toggle recording"
        >
          <span v-if="!isRecording">⏺️</span>
          <span v-else>⏹️</span>
        </button>

        <button @click="endCall" class="control-btn end-call" title="End call">
          <span>❌</span>
        </button>
      </div>

      <div class="room-info">Room: {{ roomName }}</div>

      <!-- Chat Panel -->
      <ChatPanel
        :room="room"
        :connected="connected"
        :current-username="username"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import axios from "axios";
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
  TrackPublication,
} from "livekit-client";

export default {
  name: "Room",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();

    const roomName = ref(route.params.roomName);
    const username = ref(authStore.currentUser?.username || "Guest");
    const remoteUsername = ref("");

    const localVideo = ref(null);
    const remoteVideo = ref(null);
    const screenShareVideo = ref(null);

    const connected = ref(false);
    const connecting = ref(true);
    const audioMuted = ref(false);
    const videoMuted = ref(false);
    const isScreenSharing = ref(false);
    const isRecording = ref(false);
    const screenShareTrack = ref(null);
    const connectionError = ref("");

    let room = null;
    let localAudioTrack = null;
    let localVideoTrack = null;
    let localScreenTrack = null;

    const connectToRoom = async () => {
      try {
        // Ensure user is authenticated
        if (!authStore.currentUser) {
          console.error("User not authenticated");
          await authStore.checkAuth();
          if (!authStore.currentUser) {
            alert("Please login first");
            router.push("/login");
            return;
          }
        }

        // Update username from store
        username.value = authStore.currentUser.username;

        // Get LiveKit token from backend
        const response = await axios.post(
          "/api/rooms/join",
          {
            roomName: roomName.value,
            calleeUsername: route.query.callee,
          },
          {
            headers: authStore.getAuthHeader(),
          }
        );

        const { token, url } = response.data;

        console.log("LiveKit URL:", url);
        console.log("Token received:", typeof token, token ? "yes" : "no");

        // Create room instance
        room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        // Set up event listeners
        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.on(
          RoomEvent.ParticipantDisconnected,
          handleParticipantDisconnected
        );
        room.on(RoomEvent.Disconnected, (reason) => {
          console.log("Disconnected:", reason);
        });

        // Connect to room - ensure token is a string
        await room.connect(url, String(token));

        // Create and publish local tracks
        const tracks = await createLocalTracks({
          audio: true,
          video: true,
        });

        console.log("Created local tracks:", tracks.length);

        for (const track of tracks) {
          await room.localParticipant.publishTrack(track);

          if (track.kind === Track.Kind.Video) {
            localVideoTrack = track;
            // Attach to local video element
            setTimeout(() => {
              if (localVideo.value) {
                track.attach(localVideo.value);
                console.log("Local video attached");
              }
            }, 100);
          } else if (track.kind === Track.Kind.Audio) {
            localAudioTrack = track;
            console.log("Local audio track created");
          }
        }

        connected.value = true;
        connecting.value = false;

        console.log("Connected to room, waiting for participants...");

        // Check for existing participants and their tracks
        room.remoteParticipants.forEach((participant) => {
          console.log("Existing participant:", participant.identity);
          remoteUsername.value = participant.identity;

          // Subscribe to existing tracks
          participant.trackPublications.forEach((publication) => {
            if (publication.track) {
              handleTrackSubscribed(
                publication.track,
                publication,
                participant
              );
            }
          });
        });
      } catch (error) {
        console.error("Failed to connect to room:", error);
        connectionError.value =
          error.response?.data?.error || error.message || "Connection failed";
        connecting.value = false;

        setTimeout(() => {
          alert("Failed to connect to room. Please try again.");
          router.push("/");
        }, 2000);
      }
    };

    const handleTrackSubscribed = (track, publication, participant) => {
      console.log(
        "Track subscribed:",
        track.kind,
        "from",
        participant.identity
      );

      if (track.kind === Track.Kind.Video) {
        if (publication.source === Track.Source.ScreenShare) {
          screenShareTrack.value = track;
          // Wait for next tick to ensure ref is available
          setTimeout(() => {
            if (screenShareVideo.value) {
              track.attach(screenShareVideo.value);
              console.log("Screen share attached");
            }
          }, 100);
        } else {
          // Regular video track
          setTimeout(() => {
            if (remoteVideo.value) {
              track.attach(remoteVideo.value);
              console.log("Remote video attached");
            }
          }, 100);
        }
      } else if (track.kind === Track.Kind.Audio) {
        // Audio track - attach but don't need ref
        const audioElement = track.attach();
        document.body.appendChild(audioElement);
        console.log("Remote audio attached");
      }
    };

    const handleTrackUnsubscribed = (track, publication, participant) => {
      console.log("Track unsubscribed:", track.kind);
      track.detach();
      if (publication.source === Track.Source.ScreenShare) {
        screenShareTrack.value = null;
      }
    };

    const handleParticipantConnected = (participant) => {
      console.log("Participant connected:", participant.identity);
      remoteUsername.value = participant.identity;
    };

    const handleParticipantDisconnected = (participant) => {
      console.log("Participant disconnected:", participant.identity);
      if (remoteUsername.value === participant.identity) {
        remoteUsername.value = "";
      }
    };

    const toggleAudio = async () => {
      if (localAudioTrack) {
        if (audioMuted.value) {
          await localAudioTrack.unmute();
        } else {
          await localAudioTrack.mute();
        }
        audioMuted.value = !audioMuted.value;
      }
    };

    const toggleVideo = async () => {
      if (localVideoTrack) {
        if (videoMuted.value) {
          await localVideoTrack.unmute();
        } else {
          await localVideoTrack.mute();
        }
        videoMuted.value = !videoMuted.value;
      }
    };

    const toggleScreenShare = async () => {
      try {
        if (isScreenSharing.value) {
          // Stop screen sharing
          if (localScreenTrack) {
            const publications = Array.from(
              room.localParticipant.trackPublications.values()
            );
            const screenPub = publications.find(
              (p) => p.source === Track.Source.ScreenShare
            );

            if (screenPub) {
              await room.localParticipant.unpublishTrack(screenPub.track);
            }

            localScreenTrack.stop();
            localScreenTrack = null;
          }
          isScreenSharing.value = false;
          console.log("Screen share stopped");
        } else {
          // Start screen sharing - use browser's native API
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: "always",
              displaySurface: "monitor",
            },
            audio: false,
          });

          const screenVideoTrack = screenStream.getVideoTracks()[0];

          if (!screenVideoTrack) {
            throw new Error("No video track in screen share");
          }

          // Publish to LiveKit
          await room.localParticipant.publishTrack(screenVideoTrack, {
            name: "screen-share",
            source: Track.Source.ScreenShare,
          });

          localScreenTrack = screenVideoTrack;
          isScreenSharing.value = true;
          console.log("Screen share started");

          // Handle when user stops sharing from browser UI
          screenVideoTrack.onended = () => {
            console.log("Screen share ended by user");
            if (isScreenSharing.value) {
              isScreenSharing.value = false;
              localScreenTrack = null;
            }
          };
        }
      } catch (error) {
        console.error("Screen share error:", error);

        if (error.name === "NotAllowedError") {
          alert("Screen sharing permission denied");
        } else if (error.name === "AbortError") {
          console.log("Screen share cancelled by user");
        } else {
          alert("Failed to share screen: " + error.message);
        }

        isScreenSharing.value = false;
      }
    };

    const toggleRecording = async () => {
      try {
        if (isRecording.value) {
          // Stop recording
          await axios.post(
            "/api/rooms/stop-recording",
            {
              roomName: roomName.value,
            },
            {
              headers: authStore.getAuthHeader(),
            }
          );
          isRecording.value = false;
          console.log("Recording stopped");
        } else {
          // Start recording
          await axios.post(
            "/api/rooms/start-recording",
            {
              roomName: roomName.value,
            },
            {
              headers: authStore.getAuthHeader(),
            }
          );
          isRecording.value = true;
          console.log("Recording started (requires LiveKit Egress service)");
        }
      } catch (error) {
        console.error("Recording error:", error);
        alert(
          "Recording feature requires LiveKit Egress service. Feature disabled for now."
        );
      }
    };

    const endCall = async () => {
      if (room) {
        room.disconnect();
      }

      try {
        await axios.post(
          "/api/rooms/end-call",
          {
            roomName: roomName.value,
          },
          {
            headers: authStore.getAuthHeader(),
          }
        );
      } catch (error) {
        console.error("End call error:", error);
      }

      router.push("/");
    };

    onMounted(() => {
      connectToRoom();
    });

    onUnmounted(() => {
      if (room) {
        room.disconnect();
      }
    });

    return {
      roomName,
      username,
      remoteUsername,
      localVideo,
      remoteVideo,
      screenShareVideo,
      connected,
      connecting,
      audioMuted,
      videoMuted,
      isScreenSharing,
      isRecording,
      screenShareTrack,
      connectionError,
      toggleAudio,
      toggleVideo,
      toggleScreenShare,
      toggleRecording,
      endCall,
    };
  },
};
</script>

<style scoped>
.room-container {
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #fff;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #30363d;
  border-top-color: #1f6feb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #f85149;
  margin-top: 10px;
}

.room-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.video-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px;
}

.video-grid.has-screen-share {
  grid-template-columns: 1fr 1fr 2fr;
}

.video-wrapper {
  position: relative;
  background: #1a1f2e;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
  display: block;
}

.video-wrapper.local video {
  transform: scaleX(-1); /* Mirror local video */
}

.video-wrapper.screen-share {
  grid-column: span 2;
}

.video-wrapper.screen-share video {
  object-fit: contain;
}

.video-label {
  position: absolute;
  bottom: 15px;
  left: 15px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 14px;
}

.waiting {
  color: #8b949e;
  font-size: 18px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background: #1a1f2e;
}

.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #30363d;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: #3d444d;
  transform: scale(1.1);
}

.control-btn.active {
  background: #238636;
}

.control-btn.end-call {
  background: #da3633;
}

.control-btn.end-call:hover {
  background: #f85149;
}

.room-info {
  text-align: center;
  padding: 15px;
  background: #0d1117;
  color: #8b949e;
  font-size: 14px;
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .video-wrapper.screen-share {
    grid-column: span 1;
  }

  .controls {
    gap: 10px;
  }

  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}
</style>
