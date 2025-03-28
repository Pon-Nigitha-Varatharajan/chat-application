const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;

// Serve static files from the "frontend" directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Store rooms and their client counts
const rooms = new Map();

// Global active users list (independent of rooms)
const globalActiveUsers = new Map();

// WebSocket connection
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        // User registration for global active users list
        if (message.type === 'registerUser') {
            const { username } = message;
            
            // Check if username is already taken
            if (Array.from(globalActiveUsers.keys()).includes(username)) {
                ws.send(JSON.stringify({ 
                    type: 'userRegistrationError', 
                    message: 'Username already exists' 
                }));
                return;
            }

            // Add user to global active users
            globalActiveUsers.set(username, {
                connectionTime: new Date(),
                ws: ws
            });

            // Broadcast updated active users list to all clients
            broadcastActiveUsersList();

            console.log(`User registered: ${username}. Total active users: ${globalActiveUsers.size}`);
        }

        // Get active users list
        if (message.type === 'getActiveUsers') {
            ws.send(JSON.stringify({
                type: 'activeUsersList',
                users: Array.from(globalActiveUsers.keys())
            }));
        }

        // Private messaging
        if (message.type === 'privateMessage') {
            const { from, to, text } = message;
            
            // Find target user's WebSocket
            const targetUser = globalActiveUsers.get(to);
            if (targetUser) {
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'privateMessage',
                            from,
                            to,
                            text
                        }));
                    }
                });
            } else {
                ws.send(JSON.stringify({
                    type: 'privateMessageError',
                    message: 'User is not online'
                }));
            }
        }

        // Existing room logic remains the same
        if (message.type === 'createRoom') {
            const roomId = message.roomName;
            if (!rooms.has(roomId)) {
                rooms.set(roomId, { clients: 0, users: [] });
                console.log(`Room created: ${roomId}`);
                ws.send(JSON.stringify({ type: 'roomCreated', roomId }));

                // Notify all clients about the new room
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'roomList',
                            rooms: Array.from(rooms.entries()).map(([roomId, room]) => ({
                                roomId,
                                clients: room.clients,
                            })),
                        }));
                    }
                });
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Room already exists' }));
            }
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        
        // Remove user from global active users
        for (const [username, userInfo] of globalActiveUsers.entries()) {
            if (userInfo.ws === ws) {
                globalActiveUsers.delete(username);
                
                // Broadcast updated active users list
                broadcastActiveUsersList();
                break;
            }
        }
    });
});

// Broadcast active users list to all connected clients
function broadcastActiveUsersList() {
    const activeUsersList = Array.from(globalActiveUsers.keys());
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'activeUsersList',
                users: activeUsersList
            }));
        }
    });
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
