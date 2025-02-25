<template>
  <div class="notifications">
    <h2>Notifications</h2>

    <!-- Connection status panel for each notification route -->
    <div class="status-panel">
      <div v-for="(route, name) in routes" :key="name"
           :class="['status-item', { connected: isRouteConnected(route) }]">
        <span class="status-label">{{ name.toUpperCase() }}</span>
        <span class="status-text">
          {{ isRouteConnected(route) ? 'Connected' : 'Reconnecting...' }}
          <span v-if="!isRouteConnected(route)" class="retry-text">
            ({{ getReconnectTime(route) }}s)
          </span>
        </span>
      </div>
    </div>

    <!-- Notifications display area -->
    <div class="notifications-list">
      <template v-if="notifications.length">
        <div v-for="notification in sortedNotifications" :key="notification.id"
             class="notification-item" :class="notification.type">
          <div class="notification-content">
            <div class="notification-source">{{ notification.source.split('/').pop()?.toUpperCase() }}</div>
            {{ notification.message }}
          </div>
          <div class="notification-time">
            {{ formatTime(notification.timestamp) }}
          </div>
        </div>
      </template>
      <div v-else class="no-notifications">
        No notifications yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useSSE } from '@/composables/useSSE';

/**
 * Interface representing a notification
 * @property {number} id - Unique identifier for the notification
 * @property {string} message - Content of the notification
 * @property {string} timestamp - ISO formatted timestamp when notification was received
 * @property {string} source - Source route of the notification
 * @property {'info' | 'warning' | 'error'} [type] - Severity level of the notification
 */
interface Notification {
  id: number;
  message: string;
  timestamp: string;
  source: string;
  type?: 'info' | 'warning' | 'error';
}

// State variables
const notifications = ref<Notification[]>([]); // Stores all notifications
const { connect, disconnect, connectionStatuses } = useSSE(); // SSE connection utility

// Define notification routes
const routes = {
  system: '/api/notifications/system',
  user: '/api/notifications/user'
} as const;

/**
 * Computed property that sorts notifications by timestamp (newest first)
 * @returns {Notification[]} Sorted notifications array
 */
const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

/**
 * Formats a timestamp into a readable time string
 * @param {string} timestamp - ISO formatted date string
 * @returns {string} Localized time string
 */
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Checks if a specific SSE route is currently connected
 * @param {string} route - API route to check
 * @returns {boolean} True if connected, false otherwise
 */
function isRouteConnected(route: string): boolean {
  const status = connectionStatuses.value[route];
  return status?.connected || status?.readyState === EventSource.OPEN || false;
}

/**
 * Gets the reconnect countdown time for a specific route
 * @param {string} route - API route to check
 * @returns {number} Seconds until next reconnection attempt
 */
function getReconnectTime(route: string): number {
  const status = connectionStatuses.value[route];
  return status ? Math.ceil(status.reconnectDelay / 1000) : 0;
}

/**
 * Creates an event handler for incoming notifications from a specific route
 * @param {string} route - Source route for the notifications
 * @returns {function} Event handler function for the specified route
 */
function handleNotification(route: string) {
  return (event: MessageEvent) => {
    try {
      const notification = JSON.parse(event.data);
      notifications.value.push({
        ...notification,
        source: route
      });

      // Limit the number of notifications kept in memory to prevent performance issues
      if (notifications.value.length > 100) {
        notifications.value = notifications.value.slice(-100);
      }
    } catch (error) {
      console.error('Error parsing notification:', error);
    }
  };
}

/**
 * Sets up the SSE connections for all notification routes when the component is mounted
 */
onMounted(() => {
  Object.entries(routes).forEach(([name, route]) => {
    connect(route, {
      // Handle incoming notifications
      message: handleNotification(route),

      // Handle connection errors
      error: () => {
        notifications.value.push({
          id: Date.now(),
          message: `Connection error on ${name.toUpperCase()}`,
          timestamp: new Date().toISOString(),
          source: route,
          type: 'error'
        });
      },

      // Handle successful connection
      open: () => {
        notifications.value.push({
          id: Date.now(),
          message: `Connected to ${name.toLowerCase()} notifications`,
          timestamp: new Date().toISOString(),
          source: route,
          type: 'info'
        });
      }
    });
  });
});

/**
 * Cleans up all SSE connections when the component is unmounted
 */
onBeforeUnmount(() => {
  Object.values(routes).forEach(route => {
    disconnect(route);
  });
});
</script>

<style scoped>
.notifications {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* Status panel styles */
.status-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.status-item {
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #ffebee; /* Light red for disconnected state */
  color: #c62828;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.status-item.connected {
  background-color: #e8f5e9; /* Light green for connected state */
  color: #2e7d32;
}

.status-label {
  font-weight: bold;
}

.status-text {
  margin-left: auto;
}

.retry-text {
  font-size: 0.9em;
  opacity: 0.8;
}

/* Notifications list styles */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  padding: 16px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

/* Notification type styles */
.notification-item.error {
  border-left: 4px solid #c62828; /* Red for error notifications */
}

.notification-item.warning {
  border-left: 4px solid #f57c00; /* Orange for warning notifications */
}

.notification-item.info {
  border-left: 4px solid #1976d2; /* Blue for info notifications */
}

.notification-content {
  flex: 1;
}

.notification-source {
  font-weight: bold;
  margin-bottom: 4px;
  color: #666;
}

.notification-time {
  color: #666;
  font-size: 0.9em;
  white-space: nowrap;
  margin-left: 16px;
}

.no-notifications {
  text-align: center;
  padding: 32px;
  color: #666;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
