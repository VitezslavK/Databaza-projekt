<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6 text-center">Přihlášení</h2>

    <form class="flex flex-col gap-5" @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">E-mailová adresa</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="vas@email.cz"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Heslo</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0 mt-0.5" />
        {{ error }}
      </div>

      <AppButton type="submit" :loading="loading" class="w-full" size="lg">
        Přihlásit se
      </AppButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Nemáte účet?
      <NuxtLink to="/register" class="text-primary-600 hover:underline font-medium">
        Zaregistrujte se
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Redirect already-authenticated users
if (user.value) {
  await navigateTo('/resources', { replace: true })
}

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  loading.value = true
  error.value = null
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (authError) throw authError
    await navigateTo('/resources')
  } catch (e: any) {
    error.value = 'Nesprávný e-mail nebo heslo.'
  } finally {
    loading.value = false
  }
}
</script>
