let socket;
let currentUsername;
let currentRoomId;

// Initialize WebSocket connection
function setupWebSocket() {
    socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        console.log('WebSocket connection established');
        // Request list of active users
        socket.send(JSON.stringify({ 
            type: 'getActiveUsers', 
            roomId: currentRoomId 
        }));
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'activeUsersList') {
            displayActiveUsers(message.users);
        }

        if (message.type === 'privateMessage') {
            // Handle incoming private message
            displayPrivateMessage(message);
        }
    };
}

// Display list of active users
function displayActiveUsers(users) {
    const usersList = document.getElementById('users');
    usersList.innerHTML = ''; // Clear previous list

    users.forEach(user => {
        if (user !== currentUsername) {
            const li = document.createElement('li');
            li.textContent = user;
            li.addEventListener('click', () => startPrivateChat(user));
            usersList.appendChild(li);
        }
    });
}

// Start private chat with selected user
function startPrivateChat(targetUser) {
    // Navigate to private chat page
    window.location.href = `private-chat.html?target=${encodeURIComponent(targetUser)}`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Retrieve username and room from local storage
    currentUsername = localStorage.getItem('username');
    currentRoomId = localStorage.getItem('roomId');

    if (!currentUsername || !currentRoomId) {
        // Redirect to main page if no username/room
        window.location.href = 'index.html';
        return;
    }

    // Set up WebSocket
    setupWebSocket();

    // Back to chat button
    const backButton = document.getElementById('back-to-chat');
    backButton.addEventListener('click', () => {
        window.location.href = 'chat.html';
    });
});