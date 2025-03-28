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

// Store active users
const activeUsers = new Map();

// Store private chat connections
const privateChats = new Map();

// WebSocket connection
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send the list of available rooms to the client
    ws.send(JSON.stringify({
        type: 'roomList',
        rooms: Array.from(rooms.entries()).map(([roomId, room]) => ({
            roomId,
            clients: room.clients,
        })),
    }));

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        // Existing room and messaging logic...
        if (message.type === 'createRoom') {
            // Create a new room
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

        if (message.type === 'joinRoom') {
            // Join a room
            const roomId = message.roomId;
            const username = message.username;

            if (rooms.has(roomId)) {
                // Increment client count
                const room = rooms.get(roomId);
                room.clients += 1;
                room.users.push(username);
                rooms.set(roomId, room);

                // Store active user
                activeUsers.set(username, { roomId });

                console.log(`${username} joined room ${roomId}. Clients: ${room.clients}`);

                // Notify all clients in the room
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'userJoined',
                            username,
                            roomId,
                            clients: room.clients,
                        }));
                    }
                });
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
            }
        }

        // New private messaging logic
        if (message.type === 'getActiveUsers') {
            const roomId = message.roomId;
            const room = rooms.get(roomId);
            
            ws.send(JSON.stringify({
                type: 'activeUsersList',
                users: room ? room.users : []
            }));
        }

        if (message.type === 'startPrivateChat') {
            const { sender, target } = message;
            const privateRoomId = `${sender}-${target}`;
            privateChats.set(privateRoomId, { 
                participants: [sender, target],
                messages: [] 
            });
        }

        if (message.type === 'privateMessage') {
            const { from, to, text } = message;
            
            // Broadcast private message to all WebSocket clients
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

            // Optionally store message in private chat room
            const privateRoomId = `${from}-${to}`;
            const privateRoom = privateChats.get(privateRoomId);
            if (privateRoom) {
                privateRoom.messages.push({ from, text, timestamp: new Date() });
            }
        }

        // Existing message broadcasting logic...
        if (message.type === 'message') {
            // Broadcast message to all clients in the room
            const { roomId, username, text } = message;
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'message',
                        username,
                        text,
                    }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove user from active users and rooms
        for (const [username, userInfo] of activeUsers.entries()) {
            const room = rooms.get(userInfo.roomId);
            if (room) {
                room.users = room.users.filter(u => u !== username);
                room.clients -= 1;
                rooms.set(userInfo.roomId, room);
            }
            activeUsers.delete(username);
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});