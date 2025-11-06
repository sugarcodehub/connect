<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Video Chat</h1>
      <div class="user-info">
        <span>{{ authStore.currentUser?.username }}</span>
        <button @click="handleLogout" class="btn-logout">Logout</button>
      </div>
    </header>

    <div class="dashboard-content">
      <div class="call-section">
        <h2>Start a Call</h2>
        
        <div class="call-form">
          <div class="form-group">
            <label>Select User to Call</label>
            <select v-model="selectedUser" class="user-select">
              <option value="">-- Select a user --</option>
              <option v-for="user in users" :key="user.id" :value="user.username">
                {{ user.username }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Or Enter Room Name</label>
            <input 
              v-model="customRoomName" 
              type="text" 
              placeholder="Enter room name"
            />
          </div>

          <button 
            @click="startCall" 
            class="btn-primary btn-large"
            :disabled="!canStartCall"
          >
            Start Call
          </button>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div class="users-section">
        <h2>Available Users</h2>
        <div v-if="loading" class="loading">Loading users...</div>
        <div v-else-if="users.length === 0" class="no-users">
          No other users available
        </div>
        <div v-else class="users-list">
          <div 
            v-for="user in users" 
            :key="user.id" 
            class="user-item"
            @click="selectUser(user.username)"
          >
            <div class="user-avatar">{{ user.username[0].toUpperCase() }}</div>
            <div class="user-name">{{ user.username }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const users = ref([])
    const selectedUser = ref('')
    const customRoomName = ref('')
    const loading = ref(false)
    const error = ref('')

    const canStartCall = computed(() => {
      return selectedUser.value || customRoomName.value.trim()
    })

    const fetchUsers = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/rooms/users', {
          headers: authStore.getAuthHeader()
        })
        users.value = response.data.users
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        loading.value = false
      }
    }

    const selectUser = (username) => {
      selectedUser.value = username
      customRoomName.value = ''
    }

    const startCall = () => {
      error.value = ''
      
      let roomName
      if (customRoomName.value.trim()) {
        roomName = customRoomName.value.trim()
      } else if (selectedUser.value) {
        // Create a consistent room name for 1-on-1 calls
        const names = [authStore.currentUser.username, selectedUser.value].sort()
        roomName = `call-${names[0]}-${names[1]}`
      }

      if (roomName) {
        router.push({
          name: 'Room',
          params: { roomName },
          query: { callee: selectedUser.value }
        })
      } else {
        error.value = 'Please select a user or enter a room name'
      }
    }

    const handleLogout = () => {
      authStore.logout()
      router.push('/login')
    }

    onMounted(() => {
      fetchUsers()
    })

    return {
      authStore,
      users,
      selectedUser,
      customRoomName,
      loading,
      error,
      canStartCall,
      selectUser,
      startCall,
      handleLogout
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #0f1419;
}

.dashboard-header {
  background: #1a1f2e;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #30363d;
}

.dashboard-header h1 {
  color: #fff;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #8b949e;
}

.btn-logout {
  padding: 8px 16px;
  background: #30363d;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-logout:hover {
  background: #3d444d;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.call-section, .users-section {
  background: #1a1f2e;
  padding: 30px;
  border-radius: 12px;
}

h2 {
  margin-bottom: 20px;
  color: #fff;
  font-size: 20px;
}

.call-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  color: #8b949e;
  font-size: 14px;
}

.user-select, input {
  padding: 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.user-select:focus, input:focus {
  outline: none;
  border-color: #1f6feb;
}

.btn-primary {
  padding: 12px;
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2ea043;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-large {
  padding: 16px;
  font-size: 18px;
  margin-top: 10px;
}

.error {
  color: #f85149;
  background: rgba(248, 81, 73, 0.1);
  padding: 12px;
  border-radius: 6px;
  margin-top: 15px;
  font-size: 14px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-item:hover {
  background: #161b22;
  border-color: #1f6feb;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1f6feb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.user-name {
  color: #fff;
  font-size: 16px;
}

.loading, .no-users {
  color: #8b949e;
  text-align: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>