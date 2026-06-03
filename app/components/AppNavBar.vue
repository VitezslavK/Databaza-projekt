<template>
  <nav class="bg-primary-700 text-white shadow-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">

        <!-- Logo & navigation links -->
        <div class="flex items-center gap-6 min-w-0">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 text-base font-bold hover:text-primary-200 transition-colors shrink-0"
          >
            <Icon name="heroicons:building-library" class="w-5 h-5" />
            <span class="hidden sm:inline">Rezervační systém</span>
          </NuxtLink>

          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              to="/resources"
              class="px-3 py-1.5 rounded-md text-sm hover:bg-primary-600 transition-colors"
              active-class="bg-primary-600"
            >
              Zdroje
            </NuxtLink>
            <NuxtLink
              to="/dashboard"
              class="px-3 py-1.5 rounded-md text-sm hover:bg-primary-600 transition-colors"
              active-class="bg-primary-600"
            >
              Moje rezervace
            </NuxtLink>
            <NuxtLink
              v-if="isAdmin"
              to="/admin/resources"
              class="px-3 py-1.5 rounded-md text-sm hover:bg-primary-600 transition-colors"
              active-class="bg-primary-600"
            >
              Správa zdrojů
            </NuxtLink>
          </div>
        </div>

        <!-- User info & logout -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="hidden sm:flex items-center gap-2">
            <Icon name="heroicons:user-circle" class="w-5 h-5 text-primary-300" />
            <span class="text-sm font-medium truncate max-w-[120px]">{{ displayName }}</span>
            <span
              :class="isAdmin
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-primary-500 text-primary-100'"
              class="badge text-xs"
            >
              {{ roleLabel }}
            </span>
          </div>
          <button
            class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-800 transition-colors"
            @click="handleLogout"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
            <span class="hidden sm:inline">Odhlásit</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Mobile navigation -->
    <div class="md:hidden border-t border-primary-600 px-4 py-2 flex gap-2 overflow-x-auto">
      <NuxtLink
        to="/resources"
        class="text-xs px-2 py-1 rounded hover:bg-primary-600 whitespace-nowrap transition-colors"
        active-class="bg-primary-600"
      >
        Zdroje
      </NuxtLink>
      <NuxtLink
        to="/dashboard"
        class="text-xs px-2 py-1 rounded hover:bg-primary-600 whitespace-nowrap transition-colors"
        active-class="bg-primary-600"
      >
        Moje rezervace
      </NuxtLink>
      <NuxtLink
        v-if="isAdmin"
        to="/admin/resources"
        class="text-xs px-2 py-1 rounded hover:bg-primary-600 whitespace-nowrap transition-colors"
        active-class="bg-primary-600"
      >
        Správa zdrojů
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ROLE_LABELS } from '~/types'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, fetchProfile, isAdmin } = useProfile()

onMounted(async () => {
  if (user.value && !profile.value) {
    await fetchProfile()
  }
})

const displayName = computed(
  () => profile.value?.display_name ?? user.value?.email?.split('@')[0] ?? 'Uživatel',
)

const roleLabel = computed(
  () => ROLE_LABELS[profile.value?.role ?? 'student'],
)

const handleLogout = async () => {
  const { clearProfile } = useProfile()
  clearProfile()
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>
