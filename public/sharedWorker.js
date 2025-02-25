/**
 * SharedWorker for Server-Sent Events (SSE) Connection Management
 *
 * This worker manages SSE connections across multiple client instances (tabs/windows).
 * It maintains a centralized connection pool to prevent duplicate connections to the same endpoints.
 *
 * Features:
 * - Connection pooling for SSE endpoints
 * - Automatic reconnection on errors
 * - Connection heartbeat monitoring
 * - Message broadcasting to all connected clients
 * - Connection cleanup when clients disconnect
 */

// Map to store active SSE connections by route
const connections = new Map();

// Set to track connected client ports
const clients = new Set();

/**
 * Handle new client connections to the SharedWorker
 */
self.onconnect = (event) => {
  const port = event.ports[0];
  clients.add(port);

  console.log("Client connected");

  /**
   * Process messages from clients
   */
  port.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
      case 'CONNECT': {
        // Create a new EventSource connection if one doesn't exist for this route
        const { route } = payload;
        if (!connections.has(route)) {
          createEventSource(route);
        }
        break;
      }

      case 'DISCONNECT': {
        // Disconnect a specific SSE connection
        console.log('Disconnecting route:', payload.route);
        const { route } = payload;
        disconnectRoute(route);
        break;
      }

      case 'DISCONNECT_ALL': {
        // Disconnect all active SSE connections
        console.log('Disconnecting all connections');
        disconnectAll();
        break;
      }
    }
  };

  /**
   * Handle client disconnection errors
   */
  port.onmessageerror = () => {
    console.log('Client disconnected due to error');
    clients.delete(port);

    // Clean up all connections if no clients remain
    if (clients.size === 0) {
      disconnectAll();
    }
  };

  port.start();
};

/**
 * Create and configure a new EventSource connection
 * @param {string} route - The SSE endpoint URL
 */
function createEventSource(route) {
  const eventSource = new EventSource(route);

  // Store both the EventSource instance and heartbeat timeout
  connections.set(route, { eventSource, timeout: null });

  /**
   * Reset the heartbeat timeout
   * Monitors for stalled connections and triggers reconnection if needed
   */
  function resetHeartbeatTimeout() {
    const connection = connections.get(route);
    if (connection) {
      if (connection.timeout) {
        clearTimeout(connection.timeout);
      }
      // Set a 15-second timeout for heartbeat monitoring
      connection.timeout = setTimeout(() => {
        console.log(`No messages received on route ${route} for 15 seconds. Reconnecting...`);
        eventSource.close();
        handleReconnect(route);
      }, 15000);
    }
  }

  /**
   * Handle EventSource open event
   */
  eventSource.onopen = () => {
    console.log("SSE connection opened");
    broadcastMessage('SSE_OPEN', { route });
    resetHeartbeatTimeout(); // Start the heartbeat monitoring
  };

  /**
   * Handle EventSource messages
   */
  eventSource.onmessage = (event) => {
    resetHeartbeatTimeout(); // Reset heartbeat timeout on each message
    broadcastMessage('SSE_MESSAGE', { route, data: event.data });
  };

  /**
   * Handle EventSource errors
   */
  eventSource.onerror = () => {
    console.log("SSE connection error");
    broadcastMessage('SSE_ERROR', { route });
    handleReconnect(route);
  };
}

/**
 * Broadcast a message to all connected clients
 * @param {string} type - Message type
 * @param {Object} payload - Message payload
 */
function broadcastMessage(type, payload) {
  clients.forEach(port => {
    try {
      port.postMessage({ type, payload });
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  });
}

/**
 * Disconnect a specific SSE connection
 * @param {string} route - The route to disconnect
 */
function disconnectRoute(route) {
  const connection = connections.get(route);
  if (connection) {
    connection.eventSource.close();
    if (connection.timeout) {
      clearTimeout(connection.timeout);
    }
    connections.delete(route);
    broadcastMessage('SSE_DISCONNECTED', { route });
  }
}

/**
 * Disconnect all active SSE connections
 */
function disconnectAll() {
  connections.forEach((_, route) => disconnectRoute(route));
}

/**
 * Handle reconnection for a specific route
 * @param {string} route - The route to reconnect
 */
function handleReconnect(route) {
  disconnectRoute(route);
  // Wait 5 seconds before attempting to reconnect
  setTimeout(() => {
    broadcastMessage('SSE_RECONNECT', { route });
    createEventSource(route);
  }, 5000);
}
