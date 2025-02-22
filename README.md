# Vue Project with SSE

This project is a Vue application that uses Server-Sent Events (SSE) to receive real-time notifications. The main goal of the project is to provide a way to manage SSE in Vue with performance and clean management, using a backend with multiple routes to notify the frontend. The application consists of a Vue user interface and a Node.js server that sends notifications via SSE.

## Project Structure

- `src/`: Contains the Vue application source code.
    - `App.vue`: Main application component.
    - `router/index.ts`: Application routes configuration.
    - `views/`: Contains the application views (`ChatView.vue` and `NotificationsView.vue`).
    - `composables/useSSE.ts`: Composable to manage SSE connections.
    - `services/SSEConnectionManager.ts`: Class to manage SSE connections.
- `node-sse-server/`: Contains the Node.js server code.
    - `src/index.ts`: Server code that manages SSE connections and sends notifications.

## Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)

## Installation

1. Clone the repository:
   ```sh
   git clone <REPOSITORY_URL>
   cd <REPOSITORY_NAME>
   ```

2. Install project dependencies:
   ```sh
   npm install
   ```

3. Install server dependencies:
   ```sh
   cd node-sse-server
   npm install
   cd ..
   ```

## Running the Application

1. Start the Node.js server:
   ```sh
   cd node-sse-server
   npm start
   ```

2. In another terminal window, start the Vue application:
   ```sh
   npm run dev
   ```

3. Open your browser and go to `http://localhost:3000` to see the application running.

## File Structure

### `src/App.vue`

This file contains the main Vue application component, which includes route configuration and logic to connect to the SSE endpoint `/api/main/updates`.

### `src/router/index.ts`

This file configures the application routes, including the `NotificationsView.vue` and `ChatView.vue` views.

### `src/views/ChatView.vue`

This file contains the chat view, which connects to the SSE endpoint `/api/chat/messages` to receive real-time messages.

### `src/views/NotificationsView.vue`

This file contains the notifications view, which connects to the SSE endpoints `/api/notifications/system` and `/api/notifications/user` to receive real-time notifications.

### `src/composables/useSSE.ts`

This file defines a composable to manage SSE connections, including functions to connect, disconnect, and monitor connection status.

### `src/services/SSEConnectionManager.ts`

This file contains the `SSEConnectionManager` class, which manages SSE connections with automatic reconnection.

### `node-sse-server/src/index.ts`

This file contains the Node.js server code, which manages SSE connections and sends notifications to the configured endpoints.

## Testing Notifications

You can test sending notifications using the test routes configured on the server:

- Send a system notification:
  ```sh
  curl -X POST http://localhost:3000/api/test/system -H "Content-Type: application/json" -d '{"message": "System notification test"}'
  ```

- Send a user notification:
  ```sh
  curl -X POST http://localhost:3000/api/test/user -H "Content-Type: application/json" -d '{"message": "User notification test"}'
  ```

- Send a chat message:
  ```sh
  curl -X POST http://localhost:3000/api/test/chat -H "Content-Type: application/json" -d '{"user": "Test", "text": "Test message"}'
  ```

- Send a main notification:
  ```sh
  curl -X POST http://localhost:3000/api/test/main -H "Content-Type: application/json" -d '{"message": "Main notification test"}'
  ```

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.