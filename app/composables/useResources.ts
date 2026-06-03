import type { Resource, ResourceFormData, ResourceType } from '~/types'

export const useResources = () => {
  const supabase = useSupabaseClient()

  const resources = useState<Resource[]>('resources-list', () => [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchResources = async (params?: { search?: string; type?: ResourceType | '' }) => {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('resources')
        .select('*')
        .order('name')

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`)
      }
      if (params?.type) {
        query = query.eq('type', params.type)
      }

      const { data, error: err } = await query
      if (err) throw err
      resources.value = (data ?? []) as Resource[]
    } catch (e: any) {
      error.value = e.message ?? 'Nepodařilo se načíst zdroje.'
    } finally {
      loading.value = false
    }
  }

  const fetchResourceById = async (id: string): Promise<Resource | null> => {
    const { data, error: err } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()

    if (err) return null
    return data as Resource
  }

  const createResource = async (payload: ResourceFormData): Promise<Resource> => {
    const { data, error: err } = await supabase
      .from('resources')
      .insert(payload)
      .select()
      .single()

    if (err) throw new Error(err.message)
    return data as Resource
  }

  const updateResource = async (id: string, payload: Partial<ResourceFormData>): Promise<Resource> => {
    const { data, error: err } = await supabase
      .from('resources')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (err) throw new Error(err.message)
    return data as Resource
  }

  const deleteResource = async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)

    if (err) throw new Error(err.message)
  }

  return {
    resources,
    loading,
    error,
    fetchResources,
    fetchResourceById,
    createResource,
    updateResource,
    deleteResource,
  }
}
