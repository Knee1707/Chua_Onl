<script setup lang="ts">
import { onMounted } from 'vue'
import { useTempleTheme } from '~/composables/useTempleTheme'

const { initTheme } = useTempleTheme()
onMounted(() => initTheme())
</script>

<template>
  <NuxtPage />
</template>
