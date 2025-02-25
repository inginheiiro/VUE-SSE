Vue Project with SSE Using SharedWorker
=======================================

This project is a Vue application that uses Server-Sent Events (SSE) via a SharedWorker to efficiently receive real-time notifications across multiple tabs. The main goal of the project is to provide a way to manage SSE connections in Vue with enhanced performance and clean management, using a single shared connection for multiple tabs/windows and a backend with multiple routes to notify the frontend. The application consists of a Vue user interface and a Node.js server that sends notifications via SSE.

Project Structure
-----------------

* `src/`: Contains the Vue application source code.
  * `App.vue`: Main application component with global connection status.
  * `router/index.ts`: Application routes configuration.
  * `views/`: Contains the application views (`ChatView.vue` and `NotificationsView.vue`).
  * `composables/useSSE.ts`: Composable to manage SSE connections via SharedWorker.
  * `public/sharedWorker.js`: SharedWorker script that maintains SSE connections.
* `node-sse-server/`: Contains the Node.js server code.
  * `src/index.ts`: Server code that manages SSE connections and sends notifications.

Prerequisites
-------------

* Node.js (version 14 or higher)
* npm (version 6 or higher)
* Browser with SharedWorker support (Chrome, Firefox, Edge)

Installation
------------

1. Clone the repository:   
   `git clone <REPOSITORY_URL> cd <REPOSITORY_NAME>`

2. Install project dependencies:   
   `npm install`

3. Install server dependencies:   
   `cd node-sse-server npm install cd ..`

Running the Application
-----------------------

1. Start the Node.js server:   
   `cd node-sse-server npm start`

2. In another terminal window, start the Vue application:   
   `npm run dev`

3. Open your browser and go to `http://localhost:3000` to see the application running.

Key Components
--------------

### `src/App.vue`

This file contains the main Vue application component, which includes route configuration and a global connection status indicator. It connects to the SSE endpoint `/api/main/updates` via the SharedWorker and displays connection status in the navigation bar.

### `src/views/ChatView.vue`

This file contains the chat view, which receives real-time messages from the SSE endpoint `/api/chat/messages` through the SharedWorker. It displays messages in a chronological list and shows connection status.

### `src/views/NotificationsView.vue`

This file contains the notifications view, which receives real-time notifications from the SSE endpoints `/api/notifications/system` and `/api/notifications/user` through the SharedWorker. It displays notifications in a prioritized list and shows connection status for each source.

### `src/composables/useSSE.ts`

This file defines a composable to manage SSE connections via the SharedWorker, including functions to:

* Connect to SSE endpoints
* Disconnect from SSE endpoints
* Monitor connection status
* Share connection status between components/tabs
* Register message handlers

### `public/sharedWorker.js`

This file contains the SharedWorker script that:

* Maintains SSE connections for all tabs/windows
* Handles automatic reconnection with exponential backoff
* Implements heartbeat mechanism to detect disconnections
* Broadcasts SSE messages to all connected clients
* Provides connection status updates

Benefits of Using SharedWorker
------------------------------

* **Reduced Server Load**: Only one SSE connection per endpoint is established, even with multiple tabs open
* **Shared Connection State**: Connection status is synchronized across tabs/windows
* **Efficient Resource Usage**: Fewer network connections and better memory usage
* **Consistent Message Delivery**: All tabs receive the same messages without duplication
* **Persistent Connections**: The SharedWorker maintains connections even when some tabs are inactive

