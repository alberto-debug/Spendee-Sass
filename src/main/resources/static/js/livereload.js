document.addEventListener('DOMContentLoaded', function() {
    // Check if we're not in an iframe
    if (window.self === window.top) {
        // Create a new WebSocket connection to the Spring Boot DevTools LiveReload server
        const socket = new WebSocket('ws://' + window.location.hostname + ':35729/livereload');
        
        // When the connection is established
        socket.addEventListener('open', function(event) {
            console.log('LiveReload connected');
        });
        
        // Listen for messages
        socket.addEventListener('message', function(event) {
            // When we receive a reload command, refresh the page
            if (event.data) {
                const data = JSON.parse(event.data);
                if (data && data.command === 'reload') {
                    window.location.reload();
                }
            }
        });
        
        // Handle connection errors or closures
        socket.addEventListener('close', function() {
            console.log('LiveReload disconnected');
        });
    }
});

