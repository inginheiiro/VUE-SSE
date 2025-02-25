<template>
  <div class="chat">
    <h2>Chat</h2>
    <!-- Connection status indicator -->
    <div class="connection-status" :class="{ connected: isConnected }">
      {{ isConnected ? 'Connected' : 'Reconnecting...' }}
      <span v-if="!isConnected" class="retry-text">
        Trying to reconnect in {{ reconnectCountdown }}s...
      </span>
    </div>

    <!-- Messages display area -->
    <div class="messages-container">
      <template v-if="messages.length">
        <div v-for="message in messages" :key="message.id"
             :class="['message', message.type]">
          <strong>{{ message.user }}:</strong> {{ message.text }}
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
      </template>
      <div v-else class="no-messages">
        No messages yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onBeforeUnmount } from 'vue';
import { useSSE } from '@/composables/useSSE';

/**
 * Interface representing a chat message
 * @property {number} id - Unique identifier for the message
 * @property {string} user - Name of the user who sent the message
 * @property {string} text - Content of the message
 * @property {'incoming' | 'outgoing'} type - Direction of message
 * @property {string} timestamp - ISO formatted timestamp when message was sent
 */
interface ChatMessage {
  id: number;
  user: string;
  text: string;
  type: 'incoming' | 'outgoing';
  timestamp: string;
}

// State variables
const messages = ref<ChatMessage[]>([]); // Stores all chat messages
const reconnectCountdown = ref(0); // Countdown timer for reconnection attempts
const { connect, disconnect, connectionStatuses } = useSSE(); // SSE connection utility
const CHAT_ROUTE = '/api/chat/messages'; // API endpoint for chat messages

/**
 * Computed property that determines if the SSE connection is active
 * @returns {boolean} True if connected, false otherwise
 */
const isConnected = computed(() => {
  const status = connectionStatuses.value[CHAT_ROUTE];
  return status?.connected || status?.readyState === EventSource.OPEN || false;
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
 * Watches the connection status and updates the reconnection countdown
 * when disconnected
 */
watchEffect(() => {
  if (!isConnected.value) {
    const status = connectionStatuses.value[CHAT_ROUTE];
    if (status?.reconnectDelay) {
      reconnectCountdown.value = Math.ceil(status.reconnectDelay / 1000);
      const timer = setInterval(() => {
        reconnectCountdown.value = Math.max(0, reconnectCountdown.value - 1);
      }, 1000);

      // Clear timer when reconnected or component is unmounted
      return () => clearInterval(timer);
    }
  } else {
    reconnectCountdown.value = 0;
  }
});

/**
 * Sets up the SSE connection when the component is mounted
 */
onMounted(() => {
  connect(CHAT_ROUTE, {
    // Handle incoming messages
    message: (event) => {
      try {
        const message = JSON.parse(event.data);
        messages.value.push(message);

        // Limit the number of messages kept in memory to prevent performance issues
        if (messages.value.length > 100) {
          messages.value = messages.value.slice(-100);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    },
    // Handle connection errors
    error: () => {
      messages.value.push({
        id: Date.now(),
        user: 'System',
        text: 'Connection lost. Attempting to reconnect...',
        type: 'incoming',
        timestamp: new Date().toISOString()
      });
    },
    // Handle successful connection
    open: () => {
      messages.value.push({
        id: Date.now(),
        user: 'System',
        text: 'Connected to chat',
        type: 'incoming',
        timestamp: new Date().toISOString()
      });
    }
  });
});

/**
 * Cleans up the SSE connection when the component is unmounted
 */
onBeforeUnmount(() => {
  disconnect(CHAT_ROUTE);
});
</script>

<style scoped>
.chat {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* Connection status indicator styles */
.connection-status {
  padding: 8px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  background-color: #ffebee; /* Light red for disconnected state */
  color: #c62828;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.connection-status.connected {
  background-color: #e8f5e9; /* Light green for connected state */
  color: #2e7d32;
}

.retry-text {
  font-size: 0.9em;
  opacity: 0.8;
}

/* Message container styles */
.messages-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 600px;
  overflow-y: auto;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Individual message styles */
.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
  position: relative;
  word-wrap: break-word;
}

.message.incoming {
  align-self: flex-start;
  background-color: #f5f5f5; /* Light gray for incoming messages */
  margin-right: 20%;
}

.message.outgoing {
  align-self: flex-end;
  background-color: #e3f2fd; /* Light blue for outgoing messages */
  margin-left: 20%;
}

.message-time {
  font-size: 0.8em;
  color: #666;
  position: absolute;
  bottom: 4px;
  right: 8px;
}

.no-messages {
  text-align: center;
  padding: 32px;
  color: #666;
}
</style>
