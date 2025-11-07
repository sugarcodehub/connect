<template>
  <div class="chat-drawer column full-height">
    <!-- Header -->
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>
        <q-icon name="chat" />
        Chat
      </q-toolbar-title>
    </q-toolbar>

    <!-- Messages -->
    <q-scroll-area
      ref="scrollArea"
      class="col messages-area"
    >
      <q-chat-message
        v-for="(msg, index) in messages"
        :key="index"
        :name="msg.sender"
        :text="[msg.text]"
        :sent="msg.isOwn"
        :stamp="formatTime(msg.timestamp)"
        :bg-color="msg.isOwn ? 'primary' : 'grey-3'"
        :text-color="msg.isOwn ? 'white' : 'black'"
      />

      <div v-if="messages.length === 0" class="text-center q-pa-md text-grey-6">
        <q-icon name="chat_bubble_outline" size="64px" />
        <div class="q-mt-md">No messages yet</div>
        <div class="text-caption">Start the conversation!</div>
      </div>
    </q-scroll-area>

    <!-- Input -->
    <q-separator />
    <q-toolbar class="bg-grey-9">
      <q-input
        v-model="messageInput"
        @keypress.enter="sendMessage"
        outlined
        dense
        bg-color="white"
        placeholder="Type a message..."
        :disable="!connected"
        class="col"
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            icon="send"
            @click="sendMessage"
            :disable="!messageInput.trim() || !connected"
            color="primary"
          />
        </template>
      </q-input>
    </q-toolbar>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'ChatDrawer',
  props: {
    room: Object,
    connected: Boolean,
    currentUsername: String
  },
  emits: ['new-message'],
  setup(props, { emit }) {
    const messages = ref([])
    const messageInput = ref('')
    const scrollArea = ref(null)

    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (scrollArea.value) {
          scrollArea.value.setScrollPercentage('vertical', 1, 300)
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

      // Send via LiveKit
      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify(message))
      props.room.localParticipant.publishData(data, { reliable: true })

      messages.value.push(message)
      messageInput.value = ''
      scrollToBottom()
    }

    const receiveMessage = (payload) => {
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

    watch(() => props.room, (newRoom) => {
      if (newRoom) {
        newRoom.on('DataReceived', receiveMessage)
      }
    })

    return {
      messages,
      messageInput,
      scrollArea,
      formatTime,
      sendMessage
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-drawer {
  height: 100%;
}

.messages-area {
  background: #f5f5f5;
}
</style>