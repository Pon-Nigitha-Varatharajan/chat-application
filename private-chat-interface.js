let socket;
let currentUsername;
let targetUsername;

// Initialize WebSocket connection
function setupWebSocket() {
    socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        console.log('WebSocket connection established');
        // Notify server about private chat initiation
        socket.send(JSON.stringify({
            type: 'startPrivateChat',
            sender: currentUsername,
            target: targetUsername
        }));
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'privateMessage') {
            // Display private messages
            if ((message.from === currentUsername && message.to === targetUsername) ||
                (message.from === targetUsername && message.to === currentUsername)) {
                displayPrivateMessage(message);
            }
        }
    };
}

// Display private message
function displayPrivateMessage(message) {
    const chatBox = document.getElementById('private-chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('private-message');
    messageElement.textContent = `${message.from}: ${message.text}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send private message
function sendPrivateMessage() {
    const messageInput = document.getElementById('private-message-input');
    const message = messageInput.value.trim();

    if (message) {
        socket.send(JSON.stringify({
            type: 'privateMessage',
            from: currentUsername,
            to: targetUsername,
            text: message
        }));

        // Clear input and display sent message
        messageInput.value = '';
        displayPrivateMessage({
            from: currentUsername,
            to: targetUsername,
            text: message
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Retrieve username from local storage
    currentUsername = localStorage.getItem('username');
    
    // Get target username from URL
    const urlParams = new URLSearchParams(window.location.search);
    targetUsername = urlParams.get('target');

    if (!currentUsername || !targetUsername) {
        // Redirect to main page if no username
        window.location.href = 'index.html';
        return;
    }

    // Set target username in title
    document.getElementById('target-username').textContent = targetUsername;

    // Set up WebSocket
    setupWebSocket();

    // Send message button
    const sendButton = document.getElementById('send-private-message');
    sendButton.addEventListener('click', sendPrivateMessage);

    // Message input enter key support
    const messageInput = document.getElementById('private-message-input');
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendPrivateMessage();
        }
    });

    // Exit private chat button
    const exitButton = document.getElementById('exit-private-chat');
    exitButton.addEventListener('click', () => {
        window.location.href = 'chat.html';
    });
});