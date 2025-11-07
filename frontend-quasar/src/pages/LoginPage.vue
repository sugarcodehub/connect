<template>
  <q-page class="auth-page flex flex-center">
    <q-card class="auth-card">
      <q-card-section class="text-center q-pb-none">
        <q-icon name="videocam" size="64px" color="primary" />
        <div class="text-h4 q-mt-md">Video Chat</div>
        <div class="text-subtitle2 text-grey-6">Sign in to your account</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="username"
            label="Username"
            outlined
            :rules="[val => !!val || 'Username is required']"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            type="password"
            outlined
            :rules="[val => !!val || 'Password is required']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <div>
            <q-btn
              label="Sign In"
              type="submit"
              color="primary"
              unelevated
              size="lg"
              class="full-width"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center">
        <div class="text-grey-7">
          Don't have an account?
          <router-link to="/register" class="text-primary">Sign up</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const username = ref('')
    const password = ref('')
    const loading = ref(false)

    const handleLogin = async () => {
      loading.value = true

      const result = await authStore.login(username.value, password.value)

      loading.value = false

      if (result.success) {
        $q.notify({
          type: 'positive',
          message: 'Login successful',
          icon: 'check_circle'
        })
        router.push('/')
      } else {
        $q.notify({
          type: 'negative',
          message: result.error,
          icon: 'error'
        })
      }
    }

    return {
      username,
      password,
      loading,
      handleLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
}

a {
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}
</style>