import type { Profile } from '~/types'

export const useProfile = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // useState keeps profile in shared SSR-safe state across components
  const profile = useState<Profile | null>('user-profile', () => null)
  const loading = ref(false)

  const fetchProfile = async () => {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) throw error
      profile.value = data as Profile
    } finally {
      loading.value = false
    }
  }

  const isAdmin = computed(() => profile.value?.role === 'admin')

  const clearProfile = () => {
    profile.value = null
  }

  return {
    profile,
    loading,
    isAdmin,
    fetchProfile,
    clearProfile,
  }
}
