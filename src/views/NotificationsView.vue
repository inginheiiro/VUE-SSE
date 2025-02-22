<template>
  <div class="notifications">
    <h2>Notifications</h2>

    <div class="status-panel">
      <div v-for="(status, route) in connectionStatuses" :key="route"
           :class="['status-item', { connected: status.connected }]">
        {{ formatRoute(route) }}: {{ status.connected ? 'Connected' : 'Reconnecting...' }}
      </div>
    </div>

    <div class="notifications-list">
      <div v-for="notification in notifications" :key="notification.id"
           class="notification-item">
        <div class="notification-content">{{ notification.message }}</div>
        <div class="notification-time">
          {{ new Date(notification.timestamp).toLocaleTimeString() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSSE } from '@/composables/useSSE';

interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const notifications = ref<Notification[]>([]);
const { connect, disconnect, connectionStatuses } = useSSE();

const ROUTES = {
  system: '/api/notifications/system',
  user: '/api/notifications/user'
};

function formatRoute(route: string): string {
  return route.split('/').pop()?.toUpperCase() || route;
}

onMounted(() => {
  // Connect to notification endpoints
  Object.values(ROUTES).forEach(route => {
    connect(route, (event) => {
      const notification = JSON.parse(event.data);
      notifications.value.push(notification);
    });
  });

  onUnmounted(() => {
    Object.values(ROUTES).forEach(route => {
      disconnect(route);
    });
  });
});
</script>

<style scoped>
.notifications {
  padding: 20px;
}

.status-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.status-item {
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
  transition: all 0.3s ease;
}

.status-item.connected {
  background-color: #e8f5e9;
  color: #2e7d32;
}

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
  align-items: center;
}

.notification-content {
  flex: 1;
}

.notification-time {
  color: #666;
  font-size: 0.9em;
}
</style>
