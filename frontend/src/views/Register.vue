<template>
  <div class="auth-container">
    <div class="auth-box">
      <h1>Register</h1>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Username</label>
          <input 
            v-model="username" 
            type="text" 
            required 
            placeholder="Choose a username"
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="Choose a password"
            minlength="6"
          />
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <div class="auth-footer">
        Already have an account? 
        <router-link to="/login">Login</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const username = ref('')
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)

    const handleRegister = async () => {
      error.value = ''
      loading.value = true

      const result = await authStore.register(
        username.value, 
        email.value, 
        password.value
      )
      
      loading.value = false

      if (result.success) {
        router.push('/')
      } else {
        error.value = result.error
      }
    }

    return {
      username,
      email,
      password,
      error,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.auth-box {
  background: #1a1f2e;
  padding: 40px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

h1 {
  margin-bottom: 30px;
  text-align: center;
  color: #fff;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #8b949e;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #1f6feb;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #1f6feb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1a5cd7;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #f85149;
  background: rgba(248, 81, 73, 0.1);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  color: #8b949e;
  font-size: 14px;
}

.auth-footer a {
  color: #1f6feb;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>