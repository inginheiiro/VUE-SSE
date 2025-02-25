/**
 * Type definitions for the SSE (Server-Sent Events) composable.
 */

/**
 * Represents a single event handler function for SSE events.
 */
export type SSEHandler = (event: MessageEvent) => void;

/**
 * Represents the collection of handlers for different SSE event types.
 */
export interface SSEHandlers {
  /** Handler for message events */
  message?: (event: MessageEvent) => void;

  /** Handler for open events */
  open?: (event: Event) => void;

  /** Handler for error events */
  error?: (event: Event) => void;

  /** Handler for close events */
  close?: (event: Event) => void;
}

/**
 * Represents the connection status for an SSE endpoint.
 */
export interface ConnectionStatus {
  /** Whether the connection is currently active */
  connected: boolean;

  /** Delay in milliseconds before attempting to reconnect (0 if connected) */
  reconnectDelay: number;

  /** The ready state of the connection (same values as EventSource.readyState) */
  readyState: number;

  /** Whether the connection is in the process of reconnecting */
  reconnecting?: boolean;

  /** Whether the server is confirmed to be down (from error event) */
  serverDown?: boolean;

  /** When the connection status was last updated */
  lastUpdated?: Date;
}
