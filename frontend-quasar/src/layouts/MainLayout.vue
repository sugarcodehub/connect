<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="videocam" size="sm" class="q-mr-sm" />
          Video Chat
        </q-toolbar-title>

        <q-space />

        <div class="row q-gutter-sm items-center">
          <q-btn
            flat
            dense
            round
            icon="notifications"
          >
            <q-badge color="red" floating>3</q-badge>
            <q-tooltip>Notifications</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
          >
            <q-avatar size="32px">
              <img v-if="authStore.currentUser?.avatar" :src="authStore.currentUser.avatar" />
              <span v-else class="text-white">
                {{ authStore.currentUser?.username[0].toUpperCase() }}
              </span>
            </q-avatar>
            <q-menu>
              <q-list style="min-width: 200px">
                <q-item>
                  <q-item-section avatar>
                    <q-avatar size="48px" color="primary" text-color="white">
                      {{ authStore.currentUser?.username[0].toUpperCase() }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ authStore.currentUser?.username }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ authStore.currentUser?.email }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="$router.push('/profile')">
                  <q-item-section avatar>
                    <q-icon name="person" />
                  </q-item-section>
                  <q-item-section>Profile</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="$router.push('/settings')">
                  <q-item-section avatar>
                    <q-icon name="settings" />
                  </q-item-section>
                  <q-item-section>Settings</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="handleLogout">
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-negative">Logout</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'MainLayout',
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const handleLogout = () => {
      $q.dialog({
        title: 'Logout',
        message: 'Are you sure you want to logout?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        authStore.logout()
        router.push('/login')
        $q.notify({
          type: 'info',
          message: 'Logged out successfully',
          icon: 'logout'
        })
      })
    }

    return {
      authStore,
      handleLogout
    }
  }
}
</script>