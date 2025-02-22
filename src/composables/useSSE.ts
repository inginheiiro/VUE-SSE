import { ref, onUnmounted } from 'vue';
import { SSEConnectionManager } from '@/services/SSEConnectionManager';
import type { SSEHandler, SSEHandlers } from '@/types/sse';

/**
 * Composable for managing SSE connections.
 */
export function useSSE() {
  const sseManager = ref(new SSEConnectionManager());

  onUnmounted(() => {
    sseManager.value.disconnectAll();
  });

  return {
    sseManager,
    connect: (route: string, handlers: SSEHandler | SSEHandlers) =>
      sseManager.value.connect(route, handlers),
    disconnect: (route: string) => sseManager.value.disconnect(route),
    disconnectAll: () => sseManager.value.disconnectAll(),
    connectionStatuses: sseManager.value.connectionStatuses
  };
}
