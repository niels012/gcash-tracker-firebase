// Simple HTTP Server for GCash Tracker
// Save this as: server.js
// Run with: node server.js
// Then open: http://localhost:8000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const server = http.createServer((req, res) => {
    // Remove query string
    let filePath = req.url.split('?')[0];
    
    // Default to index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Security: prevent directory traversal
    filePath = path.join(__dirname, filePath);
    
    // Serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }
        
        // Determine content type
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        
        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.json') contentType = 'application/json';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.jpg') contentType = 'image/jpeg';
        if (ext === '.gif') contentType = 'image/gif';
        if (ext === '.svg') contentType = 'image/svg+xml';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`
    ✅ GCash Tracker is running!
    📍 Open your browser: http://localhost:${PORT}
    🛑 Press Ctrl+C to stop the server
    `);
});
