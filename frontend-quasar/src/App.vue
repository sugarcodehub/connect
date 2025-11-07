<template>
  <router-view />
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'App',
  setup() {
    const $q = useQuasar()
    
    // Set dark mode based on system preference
    $q.dark.set('auto')
    
    return {}
  }
})
</script>