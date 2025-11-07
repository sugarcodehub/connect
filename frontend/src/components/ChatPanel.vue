<template>
  <div class="chat-panel" :class="{ collapsed: isCollapsed }">
    <div class="chat-header">
      <h3>Chat</h3>
      <button @click="toggleCollapse" class="collapse-btn">
        {{ isCollapsed ? '◀' : '▶' }}
      </button>
    </div>

    <div v-if="!isCollapsed" class="chat-content">
      <div class="messages" ref="messagesContainer">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.isOwn ? 'own' : 'other']"
        >
          <div class="message-header">
            <span class="sender">{{ msg.sender }}</span>
            <span class="time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-text">{{ msg.text }}</div>
        </div>
        <div v-if="messages.length === 0" class="no-messages">
          No messages yet. Start the conversation!
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="messageInput"
          @keypress.enter="sendMessage"
          placeholder="Type a message..."
          :disabled="!connected"
        />
        <button @click="sendMessage" :disabled="!messageInput.trim() || !connected">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch } from 'vue'

export default {
  name: 'ChatPanel',
  props: {
    room: Object,
    connected: Boolean,
    currentUsername: String
  },
  setup(props, { emit }) {
    const messages = ref([])
    const messageInput = ref('')
    const messagesContainer = ref(null)
    const isCollapsed = ref(false)

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value
    }

    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
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
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    // Watch for room changes to set up data listener
    watch(() => props.room, (newRoom) => {
      if (newRoom) {
        newRoom.on('DataReceived', receiveMessage)
      }
    })

    return {
      messages,
      messageInput,
      messagesContainer,
      isCollapsed,
      toggleCollapse,
      formatTime,
      sendMessage
    }
  }
}
</script>

<style scoped>
.chat-panel {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 350px;
  max-height: 500px;
  background: #1a1f2e;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1000;
}

.chat-panel.collapsed {
  width: 60px;
  max-height: 50px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #30363d;
  background: #21262d;
  border-radius: 12px 12px 0 0;
}

.chat-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.collapse-btn {
  background: none;
  border: none;
  color: #8b949e;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
}

.collapse-btn:hover {
  color: #fff;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 450px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: #0d1117;
}

.messages::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}

.no-messages {
  text-align: center;
  color: #8b949e;
  padding: 40px 20px;
  font-size: 14px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 8px;
  word-wrap: break-word;
}

.message.own {
  align-self: flex-end;
  background: #1f6feb;
  color: #fff;
}

.message.other {
  align-self: flex-start;
  background: #21262d;
  color: #fff;
  border: 1px solid #30363d;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
  opacity: 0.7;
}

.sender {
  font-weight: 600;
}

.time {
  font-size: 10px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 15px;
  border-top: 1px solid #30363d;
  background: #0d1117;
  border-radius: 0 0 12px 12px;
}

.chat-input input {
  flex: 1;
  padding: 10px 12px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.chat-input input:focus {
  outline: none;
  border-color: #1f6feb;
}

.chat-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-input button {
  padding: 10px 20px;
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-input button:hover:not(:disabled) {
  background: #2ea043;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #30363d;
}

@media (max-width: 768px) {
  .chat-panel {
    width: calc(100% - 40px);
    right: 20px;
    left: 20px;
    bottom: 70px;
  }
}
</style>