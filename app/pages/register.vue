<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6 text-center">Registrace</h2>

    <form class="flex flex-col gap-5" @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="display_name">Zobrazované jméno</label>
        <input
          id="display_name"
          v-model="form.displayName"
          type="text"
          placeholder="Jan Novák"
          required
        />
      </div>

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
          autocomplete="new-password"
          placeholder="Minimálně 6 znaků"
          minlength="6"
          required
        />
      </div>

      <div class="form-group">
        <label for="password_confirm">Potvrzení hesla</label>
        <input
          id="password_confirm"
          v-model="form.passwordConfirm"
          type="password"
          autocomplete="new-password"
          placeholder="Zopakujte heslo"
          required
        />
      </div>

      <div class="form-group">
        <label>Role</label>
        <div class="grid grid-cols-2 gap-3 mt-1">
          <label
            v-for="option in roleOptions"
            :key="option.value"
            class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
            :class="form.role === option.value
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300'"
          >
            <input
              v-model="form.role"
              type="radio"
              :value="option.value"
              class="!w-4 !h-4 !rounded-full !p-0 accent-primary-600"
            />
            <div>
              <div class="text-sm font-medium">{{ option.label }}</div>
              <div class="text-xs text-gray-500">{{ option.description }}</div>
            </div>
          </label>
        </div>
      </div>

      <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0 mt-0.5" />
        {{ error }}
      </div>

      <div v-if="success" class="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
        <Icon name="heroicons:check-circle" class="w-4 h-4 shrink-0 mt-0.5" />
        {{ success }}
      </div>

      <AppButton type="submit" :loading="loading" class="w-full" size="lg">
        Vytvořit účet
      </AppButton>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Máte účet?
      <NuxtLink to="/login" class="text-primary-600 hover:underline font-medium">
        Přihlaste se
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

if (user.value) {
  await navigateTo('/resources', { replace: true })
}

const roleOptions = [
  { value: 'student', label: 'Žák', description: 'Může rezervovat zdroje' },
  { value: 'admin', label: 'Admin', description: 'Spravuje systém' },
]

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  role: 'student',
})

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const handleRegister = async () => {
  error.value = null
  success.value = null

  if (form.password !== form.passwordConfirm) {
    error.value = 'Hesla se neshodují.'
    return
  }
  if (form.password.length < 6) {
    error.value = 'Heslo musí mít alespoň 6 znaků.'
    return
  }

  loading.value = true
  try {
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { display_name: form.displayName, role: form.role },
      },
    })
    if (authError) throw authError
    success.value = 'Účet byl vytvořen. Zkontrolujte svůj e-mail a potvrďte registraci, poté se přihlaste.'
    Object.assign(form, { displayName: '', email: '', password: '', passwordConfirm: '' })
  } catch (e: any) {
    if (e.message?.includes('already registered')) {
      error.value = 'Tento e-mail je již zaregistrován.'
    } else {
      error.value = e.message ?? 'Registrace se nezdařila.'
    }
  } finally {
    loading.value = false
  }
}
</script>
