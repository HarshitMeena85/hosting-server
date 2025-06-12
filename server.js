const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Render will override this to 10000

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS headers for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Tracking pixel endpoint
app.get('/track/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    const userAgent = req.get('User-Agent') || '';
    const timestamp = new Date().toISOString();
    
    console.log(`📧 Email opened: ${emailId} at ${timestamp}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`IP: ${req.ip}`);
    
    // Create a 1x1 transparent GIF pixel
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );
    
    res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    res.send(pixel);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Email tracker server running on port ${port}`);
    console.log(`📍 Tracking endpoint: http://localhost:${port}/track/:emailId`);
});
