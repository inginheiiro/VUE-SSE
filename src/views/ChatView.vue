<template>
  <div class="chat">
    <h2>Chat</h2>
    <div class="connection-status" :class="{ connected: isConnected }">
      {{ isConnected ? 'Connected' : 'Reconnecting...' }}
    </div>

    <div class="messages-container">
      <div v-for="message in messages" :key="message.id"
           :class="['message', message.type]">
        <strong>{{ message.user }}:</strong> {{ message.text }}
        <span class="message-time">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSSE } from '@/composables/useSSE';

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  type: 'incoming' | 'outgoing';
  timestamp: string;
  reconnecting?: boolean; // Propriedade opcional para mensagens de reconexão
}

const messages = ref<ChatMessage[]>([]);
const isConnected = ref(false);
const { connect, disconnect, connectionStatuses } = useSSE();
const CHAT_ROUTE = '/api/chat/messages';

onMounted(() => {
  connect(CHAT_ROUTE, (event) => {
    const message = JSON.parse(event.data);
    messages.value.push(message);
  });

  // Monitor connection status
  const checkConnection = setInterval(() => {
    const status = connectionStatuses[CHAT_ROUTE];
    isConnected.value = status?.connected || false;
    if (isConnected.value) {
      // Clear reconnection messages
      messages.value = messages.value.filter(msg => !msg.reconnecting);
    }
  }, 1000);

  onUnmounted(() => {
    clearInterval(checkConnection);
    disconnect(CHAT_ROUTE);
  });
});
</script>

<style scoped>
.chat {
  padding: 20px;
}

.connection-status {
  padding: 8px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
}

.connection-status.connected {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
  position: relative;
}

.message.incoming {
  align-self: flex-start;
  background-color: #f5f5f5;
  margin-right: 20%;
}

.message.outgoing {
  align-self: flex-end;
  background-color: #e3f2fd;
  margin-left: 20%;
}

.message-time {
  font-size: 0.8em;
  color: #666;
  position: absolute;
  bottom: 4px;
  right: 8px;
}
</style>
