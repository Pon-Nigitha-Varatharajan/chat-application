let socket;
let currentUsername;

// Initialize WebSocket connection
function setupWebSocket() {
    socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        console.log('WebSocket connection established');
        
        // Request list of active users
        socket.send(JSON.stringify({ 
            type: 'getActiveUsers' 
        }));
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'activeUsersList') {
            displayActiveUsers(message.users);
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
    // Navigate to private chat page with target user
    window.location.href = `private-chat-interface.html?target=${encodeURIComponent(targetUser)}`;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Retrieve username from local storage
    currentUsername = localStorage.getItem('username');

    if (!currentUsername) {
        // Redirect to main page if no username
        window.location.href = 'index.html';
        return;
    }

    // Set up WebSocket
    setupWebSocket();

    // Back to chat button
    const backButton = document.getElementById('back-to-chat');
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
