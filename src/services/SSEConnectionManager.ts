import { reactive } from 'vue';
import type { SSEHandler, SSEHandlers, ConnectionStatus } from '@/types/sse';

/**
 * Manages SSE (Server-Sent Events) connections with automatic reconnection.
 */
export class SSEConnectionManager {
  private connections: Map<string, EventSource>;
  private reconnectDelays: Map<string, number>;
  private readonly maxReconnectDelay: number;
  private readonly initialDelay: number;
  private readonly maxConnections: number;
  public connectionStatuses: Record<string, ConnectionStatus>;

  /**
   * Initializes a new instance of the SSEConnectionManager class.
   * @param initialDelay - The initial delay before attempting to reconnect (in milliseconds).
   * @param maxDelay - The maximum delay before attempting to reconnect (in milliseconds).
   * @param maxConnections - The maximum number of allowed SSE connections.
   */
  constructor(initialDelay = 5000, maxDelay = 60000, maxConnections = 6) {
    this.connections = new Map();
    this.reconnectDelays = new Map();
    this.initialDelay = initialDelay;
    this.maxReconnectDelay = maxDelay;
    this.maxConnections = maxConnections;
    this.connectionStatuses = reactive({});
  }

  /**
   * Connects to an SSE endpoint.
   * @param route - The SSE endpoint route.
   * @param handlers - The event handlers for the SSE connection.
   */
  connect(route: string, handlers: SSEHandler | SSEHandlers): void {
    if (this.connections.size >= this.maxConnections) {
      console.warn(`Maximum number of connections (${this.maxConnections}) reached.`);
      return;
    }

    if (this.connections.has(route)) return;

    try {
      const eventSource = new EventSource(route);
      this.connections.set(route, eventSource);
      this.reconnectDelays.set(route, this.initialDelay);
      this.updateConnectionStatus(route);

      eventSource.onopen = () => {
        this.reconnectDelays.set(route, this.initialDelay);
        this.updateConnectionStatus(route);
      };

      eventSource.onerror = () => this.handleError(route, handlers);

      if (typeof handlers === 'function') {
        eventSource.onmessage = handlers;
      } else {
        Object.entries(handlers).forEach(([event, handler]) => {
          eventSource.addEventListener(event, handler);
        });
      }
    } catch {
      this.handleError(route, handlers);
    }
  }

  /**
   * Handles connection errors and attempts reconnection.
   * @param route - The SSE endpoint route.
   * @param handlers - The event handlers for the SSE connection.
   */
  private handleError(route: string, handlers: SSEHandler | SSEHandlers): void {
    const eventSource = this.connections.get(route);
    if (eventSource) {
      eventSource.close();
      this.connections.delete(route);

      const currentDelay = this.reconnectDelays.get(route) || this.initialDelay;
      setTimeout(() => this.connect(route, handlers), currentDelay);

      const newDelay = Math.min(currentDelay * 2, this.maxReconnectDelay);
      this.reconnectDelays.set(route, newDelay);
      this.updateConnectionStatus(route);
    }
  }

  /**
   * Updates the connection status for a given route.
   * @param route - The SSE endpoint route.
   */
  private updateConnectionStatus(route: string): void {
    const eventSource = this.connections.get(route);
    this.connectionStatuses[route] = {
      connected: eventSource?.readyState === EventSource.OPEN,
      reconnectDelay: this.reconnectDelays.get(route) || 0,
      readyState: eventSource?.readyState || -1
    };
  }

  /**
   * Disconnects from an SSE endpoint.
   * @param route - The SSE endpoint route.
   */
  disconnect(route: string): void {
    const eventSource = this.connections.get(route);
    if (eventSource) {
      eventSource.close();
      this.connections.delete(route);
      this.reconnectDelays.delete(route);
      delete this.connectionStatuses[route];
    }
  }

  /**
   * Disconnects from all SSE endpoints.
   */
  disconnectAll(): void {
    Array.from(this.connections.keys()).forEach(route => this.disconnect(route));
  }
}
