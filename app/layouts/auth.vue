<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">
          <Icon name="heroicons:building-library" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Rezervační systém</h1>
        <p class="text-sm text-gray-500 mt-1">učeben a vybavení</p>
      </div>
      <div class="card p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
