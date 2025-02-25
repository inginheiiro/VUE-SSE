<template>
  <header>
    <nav>
      <!-- Navigation links -->
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/notifications">Notifications</RouterLink>
      <RouterLink to="/chat">Chat</RouterLink>

      <!-- Main connection status indicator -->
      <div class="connection-indicator" :class="{ connected: isMainConnected }">
        <span class="status-dot"></span>
        {{ isMainConnected ? 'Online' : 'Reconnecting...' }}
      </div>
    </nav>
  </header>

  <main>
    <!-- Router view for displaying the current route's component -->
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useSSE } from '@/composables/useSSE';

const { connect, disconnect, connectionStatuses } = useSSE(); // SSE connection utility
const MAIN_ROUTE = '/api/main/updates'; // Main API endpoint for app-wide updates
const mainUpdates = ref<any[]>([]); // Stores updates received from the main route

/**
 * Computed property that reflects the connection status of the MAIN_ROUTE.
 * The status is updated via heartbeat and reconnection mechanisms managed by the SharedWorker.
 * @returns {boolean} True if connected, false otherwise
 */
const isMainConnected = computed(() =>
  connectionStatuses.value[MAIN_ROUTE]?.connected ?? false
);

/**
 * Sets up the SSE connection for the main updates route when the component is mounted
 */
onMounted(() => {
  // Connect to MAIN_ROUTE with handlers for messages and errors.
  // The heartbeat and reconnection mechanism (SSE_RECONNECT) is triggered by the SharedWorker,
  // which automatically attempts to reconnect when no messages are received for a defined period.
  connect(MAIN_ROUTE, {
    // Handle incoming updates
    message: (event) => {
      try {
        const update = JSON.parse(event.data);
        mainUpdates.value.push(update);
        console.log('Main SSE event:', update);
      } catch (err) {
        console.error('Error processing SSE message:', err);
      }
    },
    // Handle connection errors
    error: (event) => {
      console.error('Main SSE error:', event);
    }
  });
});

/**
 * Cleans up the SSE connection when the component is unmounted
 */
onBeforeUnmount(() => {
  disconnect(MAIN_ROUTE);
});
</script>

<style>
/* Global styles for the application */
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

/* Header and navigation styles */
header {
  background-color: #2c3e50;
  padding: 1rem;
}

nav {
  display: flex;
  gap: 1rem;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
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

/* Connection status indicator styles */
.connection-indicator {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ff4444; /* Red for disconnected state */
  font-size: 0.9rem;
}

.connection-indicator.connected {
  color: #4caf50; /* Green for connected state */
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite; /* Pulsing animation for disconnected state */
}

.connected .status-dot {
  animation: none; /* No animation when connected */
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

/* Main content container styles */
main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
