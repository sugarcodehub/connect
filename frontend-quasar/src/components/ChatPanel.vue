<template>
  <div class="chat-panel">
    <q-scroll-area 
      ref="scrollArea"
      class="messages-area"
      :thumb-style="thumbStyle"
    >
      <q-chat-message
        v-for="(msg, index) in messages"
        :key="index"
        :name="msg.sender"
        :text="[msg.text]"
        :sent="msg.isOwn"
        :stamp="formatTime(msg.timestamp)"
        :bg-color="msg.isOwn ? 'primary' : 'grey-8'"
        :text-color="'white'"
      />

      <div v-if="messages.length === 0" class="no-messages">
        <q-icon name="chat_bubble_outline" size="48px" color="grey-6" />
        <div class="text-grey-6 q-mt-md">No messages yet</div>
        <div class="text-grey-7 text-caption">Start the conversation!</div>
      </div>
    </q-scroll-area>

    <q-separator />

    <div class="chat-input-container">
      <q-input
        v-model="messageInput"
        outlined
        dense
        placeholder="Type a message..."
        class="chat-input"
        :disable="!connected"
        @keyup.enter="sendMessage"
      >
        <template v-slot:append>
          <q-btn
            flat
            dense
            round
            icon="send"
            color="primary"
            :disable="!messageInput.trim() || !connected"
            @click="sendMessage"
          >
            <q-tooltip>Send Message</q-tooltip>
          </q-btn>
        </template>

        <template v-slot:prepend>
          <q-btn
            flat
            dense
            round
            icon="emoji_emotions"
            color="grey-6"
          >
            <q-menu>
              <div class="emoji-picker">
                <q-btn
                  v-for="emoji in commonEmojis"
                  :key="emoji"
                  flat
                  dense
                  :label="emoji"
                  @click="addEmoji(emoji)"
                />
              </div>
            </q-menu>
            <q-tooltip>Add Emoji</q-tooltip>
          </q-btn>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'ChatPanel',
  props: {
    room: {
      type: Object,
      default: null
    },
    connected: {
      type: Boolean,
      default: false
    },
    currentUsername: {
      type: String,
      required: true
    }
  },
  emits: ['new-message'],
  setup(props, { emit }) {
    const messages = ref([])
    const messageInput = ref('')
    const scrollArea = ref(null)

    const commonEmojis = [
      '👍', '❤️', '😊', '😂', '🎉', '👏', '🔥', '✨',
      '💯', '🙌', '👌', '✅', '❌', '⚡', '🎯', '💪'
    ]

    const thumbStyle = {
      right: '4px',
      borderRadius: '5px',
      backgroundColor: '#027be3',
      width: '5px',
      opacity: 0.75
    }

    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (scrollArea.value) {
          const scrollTarget = scrollArea.value.getScrollTarget()
          scrollArea.value.setScrollPosition('vertical', scrollTarget.scrollHeight, 300)
        }
      })
    }

    const sendMessage = () => {
      if (!messageInput.value.trim() || !props.connected || !props.room) return

      const message = {
        text: messageInput.value.trim(),
        sender: props.currentUsername,
        timestamp: Date.now(),
        isOwn: true
      }

      // Send via LiveKit data channel
      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify(message))
      props.room.localParticipant.publishData(data, { reliable: true })

      // Add to local messages
      messages.value.push(message)
      messageInput.value = ''
      scrollToBottom()
    }

    const addEmoji = (emoji) => {
      messageInput.value += emoji
    }

    const receiveMessage = (payload, participant) => {
      try {
        const decoder = new TextDecoder()
        const messageStr = decoder.decode(payload)
        const message = JSON.parse(messageStr)

        messages.value.push({
          ...message,
          isOwn: false
        })
        scrollToBottom()
        emit('new-message')
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    // Watch for room changes to set up data listener
    watch(() => props.room, (newRoom) => {
      if (newRoom) {
        newRoom.on('DataReceived', receiveMessage)
      }
    }, { immediate: true })

    return {
      messages,
      messageInput,
      scrollArea,
      commonEmojis,
      thumbStyle,
      formatTime,
      sendMessage,
      addEmoji
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
}

.messages-area {
  flex: 1;
  padding: 16px;
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.chat-input-container {
  padding: 16px;
  background: rgba(26, 31, 46, 0.5);
}

.chat-input {
  width: 100%;
}

.emoji-picker {
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
  max-width: 320px;
}
</style>