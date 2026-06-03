import type { Reservation } from '~/types'

export const useReservations = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const reservations = ref<Reservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMyReservations = async () => {
    if (!user.value) return
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('reservations')
        .select('*, resource:resources(*)')
        .eq('user_id', user.value.id)
        .order('start_time', { ascending: false })

      if (err) throw err
      reservations.value = (data ?? []) as Reservation[]
    } catch (e: any) {
      error.value = e.message ?? 'Nepodařilo se načíst rezervace.'
    } finally {
      loading.value = false
    }
  }

  const fetchAllReservations = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('reservations')
        .select('*, resource:resources(*), profile:profiles(id, display_name, email)')
        .order('start_time', { ascending: false })

      if (err) throw err
      reservations.value = (data ?? []) as Reservation[]
    } catch (e: any) {
      error.value = e.message ?? 'Nepodařilo se načíst rezervace.'
    } finally {
      loading.value = false
    }
  }

  const fetchResourceReservations = async (resourceId: string): Promise<Reservation[]> => {
    const now = new Date().toISOString()
    const { data, error: err } = await supabase
      .from('reservations')
      .select('*, profile:profiles(id, display_name, email)')
      .eq('resource_id', resourceId)
      .eq('status', 'active')
      .gte('end_time', now)
      .order('start_time')

    if (err) throw new Error(err.message)
    return (data ?? []) as Reservation[]
  }

  /**
   * Returns true when an active reservation for the given resource overlaps
   * with the requested [startTime, endTime] interval.
   * Overlap condition: existing.start < newEnd  AND  existing.end > newStart
   */
  const checkConflict = async (
    resourceId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> => {
    let query = supabase
      .from('reservations')
      .select('id')
      .eq('resource_id', resourceId)
      .eq('status', 'active')
      .lt('start_time', endTime)
      .gt('end_time', startTime)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error: err } = await query
    if (err) throw new Error(err.message)
    return (data?.length ?? 0) > 0
  }

  const createReservation = async (
    resourceId: string,
    startTime: string,
    endTime: string,
  ): Promise<Reservation> => {
    if (!user.value) throw new Error('Nejste přihlášeni.')

    const hasConflict = await checkConflict(resourceId, startTime, endTime)
    if (hasConflict) {
      throw new Error('Zvolený čas je již obsazen. Vyberte prosím jiný termín.')
    }

    const { data, error: err } = await supabase
      .from('reservations')
      .insert({
        resource_id: resourceId,
        user_id: user.value.id,
        start_time: startTime,
        end_time: endTime,
        status: 'active',
      })
      .select()
      .single()

    if (err) throw new Error(err.message)
    return data as Reservation
  }

  const cancelReservation = async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (err) throw new Error(err.message)
  }

  const deleteReservation = async (id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (err) throw new Error(err.message)
  }

  return {
    reservations,
    loading,
    error,
    fetchMyReservations,
    fetchAllReservations,
    fetchResourceReservations,
    checkConflict,
    createReservation,
    cancelReservation,
    deleteReservation,
  }
}
