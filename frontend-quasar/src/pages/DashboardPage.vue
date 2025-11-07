<template>
  <q-page class="dashboard-page" padding>
    <div class="row q-col-gutter-xl">
      <!-- Start Call Section -->
      <div class="col-12 col-md-6">
        <q-card class="call-card">
          <q-card-section>
            <div class="text-h5 q-mb-md">
              <q-icon name="video_call" size="sm" class="q-mr-sm" />
              Start a Call
            </div>

            <div class="q-gutter-md">
              <q-select
                v-model="selectedUser"
                :options="userOptions"
                label="Select User to Call"
                outlined
                clearable
                use-input
                input-debounce="300"
                @filter="filterUsers"
              >
                <template v-slot:prepend>
                  <q-icon name="person_search" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No users available
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                        {{ scope.opt.label[0].toUpperCase() }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <div class="text-center text-grey-6 q-my-md">OR</div>

              <q-input
                v-model="customRoomName"
                label="Enter Room Name"
                outlined
                hint="Create or join a custom room"
              >
                <template v-slot:prepend>
                  <q-icon name="meeting_room" />
                </template>
              </q-input>

              <q-btn
                label="Start Call"
                color="primary"
                size="lg"
                icon="videocam"
                unelevated
                class="full-width"
                :disable="!canStartCall"
                @click="startCall"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Quick Actions -->
        <q-card class="q-mt-md quick-actions-card">
          <q-card-section>
            <div class="text-subtitle1 q-mb-md">Quick Actions</div>
            <div class="row q-gutter-sm">
              <q-btn
                label="Schedule Meeting"
                icon="event"
                outline
                color="primary"
                @click="$q.notify('Coming soon!')"
              />
              <q-btn
                label="Join by Code"
                icon="login"
                outline
                color="primary"
                @click="showJoinDialog = true"
              />
              <q-btn
                label="Settings"
                icon="settings"
                outline
                color="grey-7"
                @click="$router.push('/settings')"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Users Section -->
      <div class="col-12 col-md-6">
        <q-card class="users-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h5">
                <q-icon name="people" size="sm" class="q-mr-sm" />
                Available Users
              </div>
              <q-space />
              <q-btn
                flat
                dense
                round
                icon="refresh"
                @click="fetchUsers"
                :loading="loading"
              >
                <q-tooltip>Refresh</q-tooltip>
              </q-btn>
            </div>

            <q-input
              v-model="searchQuery"
              outlined
              dense
              placeholder="Search users..."
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <q-scroll-area style="height: 500px">
              <q-list v-if="filteredUsers.length > 0" separator>
                <q-item
                  v-for="user in filteredUsers"
                  :key="user.id"
                  clickable
                  @click="selectUser(user.username)"
                  class="user-item"
                >
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white" size="48px">
                      {{ user.username[0].toUpperCase() }}
                      <q-badge floating color="positive" rounded>
                        <q-icon name="circle" size="8px" />
                      </q-badge>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ user.username }}
                    </q-item-label>
                    <q-item-label caption class="text-positive">
                      <q-icon name="circle" size="8px" class="q-mr-xs" />
                      Online
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn
                      flat
                      dense
                      round
                      icon="videocam"
                      color="primary"
                      @click.stop="quickCall(user.username)"
                    >
                      <q-tooltip>Call {{ user.username }}</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-else-if="loading" class="text-center q-pa-lg">
                <q-spinner-dots color="primary" size="40px" />
                <div class="text-grey-6 q-mt-md">Loading users...</div>
              </div>

              <div v-else class="text-center q-pa-lg">
                <q-icon name="person_off" size="64px" color="grey-5" />
                <div class="text-grey-6 q-mt-md">No users available</div>
                <div class="text-caption text-grey-7">
                  Invite friends to join!
                </div>
              </div>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Join by Code Dialog -->
    <q-dialog v-model="showJoinDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Join by Code</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="joinCode"
            label="Enter Room Code"
            outlined
            autofocus
            @keyup.enter="joinByCode"
          >
            <template v-slot:prepend>
              <q-icon name="vpn_key" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn label="Join" color="primary" @click="joinByCode" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

export default {
  name: 'DashboardPage',
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const users = ref([])
    const selectedUser = ref(null)
    const customRoomName = ref('')
    const searchQuery = ref('')
    const loading = ref(false)
    const showJoinDialog = ref(false)
    const joinCode = ref('')

    const userOptions = computed(() => {
      return users.value.map(user => ({
        label: user.username,
        value: user.username
      }))
    })

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value

      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user =>
        user.username.toLowerCase().includes(query)
      )
    })

    const canStartCall = computed(() => {
      return selectedUser.value || customRoomName.value.trim()
    })

    const fetchUsers = async () => {
      loading.value = true
      try {
        const response = await api.get('/rooms/users', {
          headers: authStore.getAuthHeader()
        })
        users.value = response.data.users
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Failed to fetch users',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    const selectUser = (username) => {
      selectedUser.value = { label: username, value: username }
      customRoomName.value = ''
    }

    const quickCall = (username) => {
      const names = [authStore.currentUser.username, username].sort()
      const roomName = `call-${names[0]}-${names[1]}`
      
      router.push({
        name: 'Room',
        params: { roomName },
        query: { callee: username }
      })
    }

    const startCall = () => {
      let roomName

      if (customRoomName.value.trim()) {
        roomName = customRoomName.value.trim()
      } else if (selectedUser.value) {
        const names = [authStore.currentUser.username, selectedUser.value.value].sort()
        roomName = `call-${names[0]}-${names[1]}`
      }

      if (roomName) {
        router.push({
          name: 'Room',
          params: { roomName },
          query: { callee: selectedUser.value?.value }
        })
      } else {
        $q.notify({
          type: 'warning',
          message: 'Please select a user or enter a room name'
        })
      }
    }

    const joinByCode = () => {
      if (joinCode.value.trim()) {
        router.push({
          name: 'Room',
          params: { roomName: joinCode.value.trim() }
        })
      }
    }

    const filterUsers = (val, update) => {
      update(() => {
        // Filtering is handled by computed property
      })
    }

    onMounted(() => {
      fetchUsers()
    })

    return {
      users,
      selectedUser,
      customRoomName,
      searchQuery,
      loading,
      showJoinDialog,
      joinCode,
      userOptions,
      filteredUsers,
      canStartCall,
      fetchUsers,
      selectUser,
      quickCall,
      startCall,
      joinByCode,
      filterUsers,
      $q
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: calc(100vh - 50px);
}

.call-card,
.users-card,
.quick-actions-card {
  border-radius: 16px;
}

.user-item {
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(var(--q-primary-rgb), 0.1);
  }
}
</style>