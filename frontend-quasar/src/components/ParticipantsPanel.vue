<template>
  <div class="participants-panel">
    <div class="participants-header">
      <div class="text-h6">Participants ({{ participants.length }})</div>
    </div>

    <q-list padding>
      <q-item
        v-for="participant in participants"
        :key="participant.id"
        class="participant-item"
      >
        <q-item-section avatar>
          <q-avatar 
            :color="participant.isLocal ? 'primary' : 'grey-7'" 
            text-color="white"
            size="48px"
          >
            {{ participant.name[0].toUpperCase() }}
            <q-badge 
              v-if="participant.isSpeaking" 
              floating 
              color="positive" 
              rounded
            >
              <q-icon name="mic" size="xs" />
            </q-badge>
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-white">
            {{ participant.name }}
          </q-item-label>
          <q-item-label caption class="text-grey-6">
            <q-icon 
              :name="participant.audioMuted ? 'mic_off' : 'mic'" 
              size="xs"
              :color="participant.audioMuted ? 'negative' : 'positive'"
            />
            <q-icon 
              :name="participant.videoMuted ? 'videocam_off' : 'videocam'" 
              size="xs"
              class="q-ml-xs"
              :color="participant.videoMuted ? 'negative' : 'positive'"
            />
          </q-item-label>
        </q-item-section>

        <q-item-section side v-if="!participant.isLocal">
          <q-btn
            flat
            dense
            round
            icon="more_vert"
            size="sm"
            color="grey-6"
          >
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="push_pin" />
                  </q-item-section>
                  <q-item-section>Pin Video</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="chat" />
                  </q-item-section>
                  <q-item-section>Send Message</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>

      <div v-if="participants.length === 0" class="no-participants">
        <q-icon name="people_outline" size="48px" color="grey-6" />
        <div class="text-grey-6 q-mt-md">No participants</div>
      </div>
    </q-list>
  </div>
</template>

<script>
export default {
  name: 'ParticipantsPanel',
  props: {
    participants: {
      type: Array,
      default: () => []
    },
    currentUserId: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.participants-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.participants-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.participant-item {
  border-radius: 8px;
  margin-bottom: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.no-participants {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}
</style>