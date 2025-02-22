<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/notifications">Notifications</RouterLink>
      <RouterLink to="/chat">Chat</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style>
header {
  background-color: #2c3e50;
  padding: 1rem;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: #34495e;
}

nav a.router-link-active {
  background-color: #42b883;
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Basic reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f5f5f5;
}
</style>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';
import { useSSE } from '@/composables/useSSE';

const { connect, disconnect } = useSSE();
const MAIN_ROUTE = '/api/main/updates';

onMounted(() => {
  connect(MAIN_ROUTE, (event) => {
    console.log('Main SSE event:', event.data);
  });

  onUnmounted(() => {
    disconnect(MAIN_ROUTE);
  });
});
</script>
