import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Stores active SSE connections
interface SSEClient {
  id: string;
  response: express.Response;
}

const systemClients = new Map<string, SSEClient>();
const userClients = new Map<string, SSEClient>();
const chatClients = new Map<string, SSEClient>();
const mainClients = new Map<string, SSEClient>();

/**
 * Middleware to set up SSE.
 * @param response - The response object.
 */
const setupSSE = (response: express.Response) => {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
};

// SSE routes
app.get('/api/notifications/system', (req, res) => {
  const clientId = uuidv4();
  setupSSE(res);

  systemClients.set(clientId, { id: clientId, response: res });

  req.on('close', () => {
    systemClients.delete(clientId);
    console.log(`System client disconnected: ${clientId}`);
  });

  // Send initial notification
  const notification = {
    id: uuidv4(),
    message: 'Connected to system notifications',
    timestamp: new Date().toISOString()
  };

  res.write(`data: ${JSON.stringify(notification)}\n\n`);
});

app.get('/api/notifications/user', (req, res) => {
  const clientId = uuidv4();
  setupSSE(res);

  userClients.set(clientId, { id: clientId, response: res });

  req.on('close', () => {
    userClients.delete(clientId);
    console.log(`User client disconnected: ${clientId}`);
  });

  // Send initial notification
  const notification = {
    id: uuidv4(),
    message: 'Connected to user notifications',
    timestamp: new Date().toISOString()
  };

  res.write(`data: ${JSON.stringify(notification)}\n\n`);
});

app.get('/api/chat/messages', (req, res) => {
  const clientId = uuidv4();
  setupSSE(res);

  chatClients.set(clientId, { id: clientId, response: res });

  req.on('close', () => {
    chatClients.delete(clientId);
    console.log(`Chat client disconnected: ${clientId}`);
  });

  // Send initial message
  const message = {
    id: uuidv4(),
    user: 'System',
    text: 'Welcome to the chat!',
    type: 'incoming',
    timestamp: new Date().toISOString()
  };

  res.write(`data: ${JSON.stringify(message)}\n\n`);
});

app.get('/api/main/updates', (req, res) => {
  const clientId = uuidv4();
  setupSSE(res);

  mainClients.set(clientId, { id: clientId, response: res });

  req.on('close', () => {
    mainClients.delete(clientId);
    console.log(`Main client disconnected: ${clientId}`);
  });

  // Send initial notification
  const notification = {
    id: uuidv4(),
    message: 'Connected to main updates',
    timestamp: new Date().toISOString()
  };

  res.write(`data: ${JSON.stringify(notification)}\n\n`);
});

/**
 * Sends a system notification to all connected clients.
 * @param message - The notification message.
 */
const sendSystemNotification = (message: string) => {
  const notification = {
    id: uuidv4(),
    message,
    timestamp: new Date().toISOString()
  };

  systemClients.forEach(client => {
    client.response.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
};

/**
 * Sends a user notification to all connected clients.
 * @param message - The notification message.
 */
const sendUserNotification = (message: string) => {
  const notification = {
    id: uuidv4(),
    message,
    timestamp: new Date().toISOString()
  };

  userClients.forEach(client => {
    client.response.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
};

/**
 * Sends a chat message to all connected clients.
 * @param user - The user sending the message.
 * @param text - The message text.
 */
const sendChatMessage = (user: string, text: string) => {
  const message = {
    id: uuidv4(),
    user,
    text,
    type: 'incoming',
    timestamp: new Date().toISOString()
  };

  chatClients.forEach(client => {
    client.response.write(`data: ${JSON.stringify(message)}\n\n`);
  });
};

/**
 * Sends a main notification to all connected clients.
 * @param message - The notification message.
 */
const sendMainNotification = (message: string) => {
  const notification = {
    id: uuidv4(),
    message,
    timestamp: new Date().toISOString()
  };

  mainClients.forEach(client => {
    client.response.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
};

// Routes to test event sending
app.post('/api/test/system', (req, res) => {
  const { message } = req.body;
  sendSystemNotification(message);
  res.json({ success: true });
});

app.post('/api/test/user', (req, res) => {
  const { message } = req.body;
  sendUserNotification(message);
  res.json({ success: true });
});

app.post('/api/test/chat', (req, res) => {
  const { user, text } = req.body;
  sendChatMessage(user, text);
  res.json({ success: true });
});

app.post('/api/test/main', (req, res) => {
  const { message } = req.body;
  sendMainNotification(message);
  res.json({ success: true });
});

// Automatic event simulators
setInterval(() => {
  if (systemClients.size > 0) {
    sendSystemNotification(`Automatic system notification: ${new Date().toLocaleTimeString()}`);
  }
}, 10000);

setInterval(() => {
  if (userClients.size > 0) {
    sendUserNotification(`Automatic user notification: ${new Date().toLocaleTimeString()}`);
  }
}, 15000);

setInterval(() => {
  if (chatClients.size > 0) {
    sendChatMessage('Bot', `Automatic message: ${new Date().toLocaleTimeString()}`);
  }
}, 8000);

setInterval(() => {
  if (mainClients.size > 0) {
    sendMainNotification(`Automatic main notification: ${new Date().toLocaleTimeString()}`);
  }
}, 12000);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
