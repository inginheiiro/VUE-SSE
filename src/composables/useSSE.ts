/**
 * Vue Composable for Server-Sent Events (SSE) Connection Management
 *
 * This composable provides a Vue-friendly interface to the SharedWorker that manages
 * SSE connections. It handles connection state tracking, message routing, and error handling.
 *
 * @module useSSE
 */

import { ref, shallowRef } from 'vue';
import type { SSEHandler, SSEHandlers, ConnectionStatus } from '@/types/sse';

/**
 * A composable function for managing SSE connections in Vue applications
 *
 * @returns {Object} Methods and reactive state for SSE connection management
 */
export function useSSE() {
  // Use shallowRef for complex objects like SharedWorker
  const worker = shallowRef<SharedWorker | null>(null);

  // Track connection status for each route
  const connectionStatuses = ref<Record<string, ConnectionStatus>>({});

  // Store message handlers for each route
  const messageHandlers = new Map<string, SSEHandler | SSEHandlers>();

  try {
    // Initialize SharedWorker
    worker.value = new SharedWorker('/sharedWorker.js');

    /**
     * Handle messages from the SharedWorker
     */
    worker.value.port.onmessage = (event) => {
      const { type, payload } = event.data;
      const { route } = payload;

      switch (type) {
        case 'SSE_MESSAGE': {
          // Route messages to the appropriate handler
          const handler = messageHandlers.get(route);
          if (handler) {
            if (typeof handler === 'function') {
              // Handle simple function handler
              handler(new MessageEvent('message', { data: payload.data }));
            } else {
              // Handle object-based handlers with dedicated message method
              const messageHandler = handler['message'];
              if (messageHandler) {
                messageHandler(new MessageEvent('message', { data: payload.data }));
              }
            }
          }
          break;
        }

        case 'SSE_OPEN': {
          // Update connection status when connection is established
          updateConnectionStatus(route, true);
          break;
        }

        case 'WORKER_LOG': {
          // Pass through worker logs
          console.log(`[SharedWorker] ${payload.message}`, payload.data);
          break;
        }

        case 'SSE_ERROR':
        case 'SSE_DISCONNECTED': {
          // Update connection status on errors or disconnections
          updateConnectionStatus(route, false);
          break;
        }

        // SSE_RECONNECT is triggered by the worker when no heartbeat messages
        // have been received for a configured time period
        case 'SSE_RECONNECT': {
          updateConnectionStatus(route, false);
          console.log(`Attempting to reconnect to route ${route}...`);
          // Re-establish the connection using the previously configured handler
          connect(route, messageHandlers.get(route)!);
          break;
        }
      }
    };

    // Start the worker port
    worker.value.port.start();
  } catch (error) {
    console.error('SharedWorker not supported:', error);
  }

  /**
   * Update the connection status for a specific route
   *
   * @param {string} route - The SSE endpoint route
   * @param {boolean} connected - Whether the connection is active
   */
  function updateConnectionStatus(route: string, connected: boolean) {
    const currentStatus = connectionStatuses.value[route];
    const newStatus = {
      connected,
      // If not connected, set a reconnection delay (mirrored from worker config)
      reconnectDelay: connected ? 0 : 5000,
      readyState: connected ? EventSource.OPEN : EventSource.CLOSED
    };

    // Only update if the status has changed
    if (JSON.stringify(currentStatus) !== JSON.stringify(newStatus)) {
      connectionStatuses.value[route] = newStatus;
    }
  }

  /**
   * Connect to an SSE endpoint
   *
   * @param {string} route - The SSE endpoint route
   * @param {SSEHandler | SSEHandlers} handlers - Event handlers for this connection
   */
  function connect(route: string, handlers: SSEHandler | SSEHandlers) {
    if (!worker.value) return;

    // Store the handlers for this route
    messageHandlers.set(route, handlers);

    // Request connection via the SharedWorker
    worker.value.port.postMessage({
      type: 'CONNECT',
      payload: { route }
    });
  }

  /**
   * Disconnect from a specific SSE endpoint
   *
   * @param {string} route - The SSE endpoint route to disconnect
   */
  function disconnect(route: string) {
    if (!worker.value) return;

    // Remove handlers for this route
    messageHandlers.delete(route);

    // Request disconnection via the SharedWorker
    worker.value.port.postMessage({
      type: 'DISCONNECT',
      payload: { route }
    });
  }

  /**
   * Disconnect from all SSE endpoints
   */
  function disconnectAll() {
    if (!worker.value) return;

    // Clear all handlers
    messageHandlers.clear();

    // Request all connections to be closed
    worker.value.port.postMessage({
      type: 'DISCONNECT_ALL'
    });
  }

  // Return public API
  return {
    connect,
    disconnect,
    disconnectAll,
    connectionStatuses
  };
}
