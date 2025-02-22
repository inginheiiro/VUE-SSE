export interface SSEHandler {
  (event: MessageEvent): void;
}

export interface SSEHandlers {
  [eventName: string]: SSEHandler;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnectDelay: number;
  readyState: number;
}
