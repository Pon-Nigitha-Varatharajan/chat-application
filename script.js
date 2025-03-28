const joinClientButton = document.getElementById('join-client');
const createRoomButton = document.getElementById('create-room');
const clientForm = document.getElementById('client-form');
const roomForm = document.getElementById('room-form');
const roomSelection = document.getElementById('room-selection');
const usernameInput = document.getElementById('username');
const roomNameInput = document.getElementById('room-name');
const submitUsernameButton = document.getElementById('submit-username');
const submitRoomButton = document.getElementById('submit-room');
const roomList = document.getElementById('room-list');
const noRoomsMessage = document.getElementById('no-rooms-message');
const chatInterface = document.getElementById('chat-interface');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendMessageButton = document.getElementById('send-message');
const privateMessageButton = document.getElementById('private-message');

let socket;
let currentUsername;
let currentRoomId;
let isWebSocketSetup = false; // Flag to ensure WebSocket is set up only once

// Show client form when "Join as Client" is clicked
joinClientButton.addEventListener('click', () => {
    clientForm.classList.remove('hidden');
    roomForm.classList.add('hidden');
    roomSelection.classList.add('hidden');
    chatInterface.classList.add('hidden');
});

// Show room form when "Create a Room" is clicked
createRoomButton.addEventListener('click', () => {
    roomForm.classList.remove('hidden');
    clientForm.classList.add('hidden');
    roomSelection.classList.add('hidden');
    chatInterface.classList.add('hidden');
});

// Handle client username submission
submitUsernameButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        currentUsername = username;
        // Store username in local storage
        localStorage.setItem('username', username);
        clientForm.classList.add('hidden');
        roomSelection.classList.remove('hidden');
        setupWebSocket();
    }
});

// Handle room creation submission
submitRoomButton.addEventListener('click', () => {
    const roomName = roomNameInput.value.trim();
    if (roomName) {
        socket.send(JSON.stringify({ type: 'createRoom', roomName }));
        roomNameInput.value = ''; // Clear input field
    }
});

// Private message button
privateMessageButton.addEventListener('click', () => {
    // Navigate to private users page
    window.location.href = 'private-users.html';
});

// Set up WebSocket connection
function setupWebSocket() {
    if (isWebSocketSetup) return; // Ensure WebSocket is set up only once
    isWebSocketSetup = true;

    socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'roomList') {
            displayRooms(message.rooms);
        }

        if (message.type === 'roomCreated') {
            alert(`Room created: ${message.roomId}`);
        }

        if (message.type === 'userJoined') {
            appendMessage(`${message.username} joined the room. Clients: ${message.clients}`);
        }

        if (message.type === 'message') {
            appendMessage(`${message.username}: ${message.text}`);
        }
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };
}

// Display available rooms
function displayRooms(rooms) {
    roomList.innerHTML = '';
    if (rooms.length === 0) {
        noRoomsMessage.classList.remove('hidden');
    } else {
        noRoomsMessage.classList.add('hidden');
        rooms.forEach((room) => {
            const li = document.createElement('li');
            li.textContent = `${room.roomId} (${room.clients} clients)`;
            li.addEventListener('click', () => joinRoom(room.roomId, currentUsername));
            roomList.appendChild(li);
        });
    }
}

// Handle joining a room
function joinRoom(roomId, username) {
    currentRoomId = roomId;
    // Store room ID in local storage
    localStorage.setItem('roomId', roomId);
    socket.send(JSON.stringify({ type: 'joinRoom', roomId, username }));
    roomSelection.classList.add('hidden');
    chatInterface.classList.remove('hidden');
}

// Append message to chat box
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message
sendMessageButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.send(JSON.stringify({ type: 'message', roomId: currentRoomId, username: currentUsername, text: message }));
        chatInput.value = '';
    }
});