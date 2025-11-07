<template>
  <q-page class="auth-page flex flex-center">
    <q-card class="auth-card">
      <q-card-section class="text-center q-pb-none">
        <q-icon name="videocam" size="64px" color="primary" />
        <div class="text-h4 q-mt-md">Video Chat</div>
        <div class="text-subtitle2 text-grey-6">Create your account</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleRegister" class="q-gutter-md">
          <q-input
            v-model="username"
            label="Username"
            outlined
            :rules="[
              val => !!val || 'Username is required',
              val => val.length >= 3 || 'Username must be at least 3 characters'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            :rules="[
              val => !!val || 'Email is required',
              val => /.+@.+\..+/.test(val) || 'Please enter a valid email'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            :rules="[
              val => !!val || 'Password is required',
              val => val.length >= 6 || 'Password must be at least 6 characters'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <div>
            <q-btn
              label="Sign Up"
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
          Already have an account?
          <router-link to="/login" class="text-primary">Sign in</router-link>
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
  name: 'RegisterPage',
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const authStore = useAuthStore()

    const username = ref('')
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const loading = ref(false)

    const handleRegister = async () => {
      loading.value = true

      const result = await authStore.register(
        username.value,
        email.value,
        password.value
      )

      loading.value = false

      if (result.success) {
        $q.notify({
          type: 'positive',
          message: 'Account created successfully',
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
      email,
      password,
      showPassword,
      loading,
      handleRegister
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