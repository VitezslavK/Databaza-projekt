<template>
  <div class="flex flex-col gap-6">

    <!-- Page header -->
    <div>
      <h1 class="page-title">Dostupné zdroje</h1>
      <p class="text-gray-500 text-sm mt-1">
        Vyberte učebnu nebo vybavení a vytvořte rezervaci.
      </p>
    </div>

    <!-- Search & filter bar -->
    <div class="card p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Icon
            name="heroicons:magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Hledat podle názvu…"
            class="pl-9"
            @input="onSearchInput"
          />
        </div>
        <select v-model="typeFilter" @change="applyFilters" class="sm:w-48">
          <option value="">Všechny typy</option>
          <option v-for="(label, value) in TYPE_LABELS" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
        <AppButton variant="outline" size="md" @click="resetFilters">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
          Resetovat
        </AppButton>
      </div>
    </div>

    <!-- Results -->
    <LoadingSpinner v-if="loading" text="Načítám zdroje…" full-page />

    <div v-else-if="resources.length === 0" class="text-center py-16 text-gray-400">
      <Icon name="heroicons:inbox" class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="font-medium">Žádné zdroje nebyly nalezeny.</p>
      <p class="text-sm mt-1">Zkuste jiný vyhledávací výraz nebo filtr.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ResourceCard
        v-for="resource in resources"
        :key="resource.id"
        :resource="resource"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { RESOURCE_TYPE_LABELS, type ResourceType } from '~/types'

definePageMeta({ middleware: 'auth' })

const { resources, loading, fetchResources } = useResources()

const searchQuery = ref('')
const typeFilter  = ref<ResourceType | ''>('')

const TYPE_LABELS = RESOURCE_TYPE_LABELS

let searchTimeout: ReturnType<typeof setTimeout>

const applyFilters = async () => {
  await fetchResources({
    search: searchQuery.value.trim() || undefined,
    type:   typeFilter.value || undefined,
  })
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(applyFilters, 350)
}

const resetFilters = async () => {
  searchQuery.value = ''
  typeFilter.value = ''
  await fetchResources()
}

onMounted(async () => {
  await fetchResources()
})
</script>
