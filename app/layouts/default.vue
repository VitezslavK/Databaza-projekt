<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <AppNavBar />
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
    <footer class="border-t border-gray-200 bg-white mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
        Rezervační systém učeben a vybavení
      </div>
    </footer>
  </div>
</template>
