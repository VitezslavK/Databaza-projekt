<script setup lang="ts">
const user = useSupabaseUser()
await navigateTo(user.value ? '/resources' : '/login', { replace: true })
</script>
