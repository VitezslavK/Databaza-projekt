<template>
  <div>

    <!-- Back link -->
    <NuxtLink
      to="/resources"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
    >
      <Icon name="heroicons:arrow-left" class="w-4 h-4" />
      Zpět na seznam zdrojů
    </NuxtLink>

    <LoadingSpinner v-if="pageLoading" text="Načítám…" full-page />

    <div v-else-if="!resource" class="text-center py-16 text-gray-400">
      <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="font-medium">Zdroj nebyl nalezen.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- LEFT: Resource detail -->
      <div class="lg:col-span-2 flex flex-col gap-6">

        <div class="card p-6">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
              <Icon :name="typeIcon" class="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h1 class="page-title">{{ resource.name }}</h1>
              <span class="badge bg-primary-100 text-primary-700 mt-1">{{ typeLabel }}</span>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div v-if="resource.description">
              <p class="text-gray-500 font-medium mb-1">Popis</p>
              <p class="text-gray-800">{{ resource.description }}</p>
            </div>
            <div v-if="resource.location">
              <p class="text-gray-500 font-medium mb-1">Umístění</p>
              <p class="text-gray-800 flex items-center gap-1">
                <Icon name="heroicons:map-pin" class="w-4 h-4 text-gray-400" />
                {{ resource.location }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 font-medium mb-1">Dostupné kusy</p>
              <p class="text-gray-800">{{ resource.quantity }} ks</p>
            </div>
          </div>
        </div>

        <!-- Upcoming reservations for this resource -->
        <div class="card p-6">
          <h2 class="section-title mb-4">Nadcházející rezervace tohoto zdroje</h2>
          <div v-if="existingReservations.length === 0" class="text-sm text-gray-400 flex items-center gap-2">
            <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-500" />
            Žádné naplánované rezervace — zdroj je volný!
          </div>
          <ul v-else class="flex flex-col gap-2">
            <li
              v-for="r in existingReservations"
              :key="r.id"
              class="flex items-center justify-between text-sm p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <span class="flex items-center gap-1.5 text-amber-800">
                <Icon name="heroicons:clock" class="w-4 h-4" />
                {{ formatDate(r.start_time) }} – {{ formatEndTime(r.start_time, r.end_time) }}
              </span>
              <span class="text-xs text-amber-600">
                {{ r.profile?.display_name ?? r.profile?.email ?? 'Uživatel' }}
              </span>
            </li>
          </ul>
        </div>

      </div>

      <!-- RIGHT: Reservation form -->
      <div class="lg:col-span-1">
        <div class="card p-6 sticky top-24">
          <h2 class="section-title mb-5">Vytvořit rezervaci</h2>

          <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="start_time">Začátek rezervace</label>
              <input
                id="start_time"
                v-model="form.startTime"
                type="datetime-local"
                :min="minDateTime"
                required
              />
            </div>

            <div class="form-group">
              <label for="end_time">Konec rezervace</label>
              <input
                id="end_time"
                v-model="form.endTime"
                type="datetime-local"
                :min="form.startTime || minDateTime"
                required
              />
            </div>

            <div v-if="formError" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0 mt-0.5" />
              {{ formError }}
            </div>

            <div v-if="formSuccess" class="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <Icon name="heroicons:check-circle" class="w-4 h-4 shrink-0 mt-0.5" />
              Rezervace byla úspěšně vytvořena!
            </div>

            <AppButton type="submit" :loading="formLoading" class="w-full" size="lg">
              <Icon name="heroicons:calendar-days" class="w-5 h-5" />
              Rezervovat
            </AppButton>
          </form>

          <p class="mt-4 text-xs text-gray-400 text-center">
            Před uložením proběhne automatická kontrola kolizí.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_ICONS, type Resource, type Reservation } from '~/types'

definePageMeta({ middleware: 'auth' })

const route  = useRoute()
const id     = computed(() => route.params.id as string)

const { fetchResourceById } = useResources()
const { fetchResourceReservations, createReservation } = useReservations()

const resource             = ref<Resource | null>(null)
const existingReservations = ref<Reservation[]>([])
const pageLoading          = ref(true)
const formLoading          = ref(false)
const formError            = ref<string | null>(null)
const formSuccess          = ref(false)

const form = reactive({ startTime: '', endTime: '' })

const typeLabel = computed(() => RESOURCE_TYPE_LABELS[resource.value?.type ?? 'other'])
const typeIcon  = computed(() => RESOURCE_TYPE_ICONS[resource.value?.type ?? 'other'])

// Minimum datetime = now (rounded up to next minute)
const minDateTime = computed(() => {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 1)
  return d.toISOString().slice(0, 16)
})

onMounted(async () => {
  try {
    resource.value = await fetchResourceById(id.value)
    if (resource.value) {
      existingReservations.value = await fetchResourceReservations(id.value)
    }
  } finally {
    pageLoading.value = false
  }
})

const handleSubmit = async () => {
  formError.value = null
  formSuccess.value = false

  if (!form.startTime || !form.endTime) {
    formError.value = 'Vyplňte prosím datum a čas začátku i konce.'
    return
  }

  const start = new Date(form.startTime)
  const end   = new Date(form.endTime)

  if (end <= start) {
    formError.value = 'Čas konce musí být po čase začátku.'
    return
  }

  if (start < new Date()) {
    formError.value = 'Začátek rezervace nesmí být v minulosti.'
    return
  }

  formLoading.value = true
  try {
    await createReservation(id.value, start.toISOString(), end.toISOString())
    formSuccess.value = true
    form.startTime = ''
    form.endTime   = ''
    // Refresh the occupancy list
    existingReservations.value = await fetchResourceReservations(id.value)
  } catch (e: any) {
    formError.value = e.message ?? 'Nepodařilo se vytvořit rezervaci.'
  } finally {
    formLoading.value = false
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const formatEndTime = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  if (s.toDateString() === e.toDateString()) {
    return e.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }
  return formatDate(end)
}
</script>
