const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Simple in-memory storage (replace with database later)
const trackedEmails = new Map();

app.get('/track/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    
    // Update tracking count
    const currentCount = trackedEmails.get(emailId) || 0;
    trackedEmails.set(emailId, currentCount + 1);

    // Serve 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.type('gif').send(pixel);
});

app.get('/stats/:emailId', (req, res) => {
    res.json({
        opens: trackedEmails.get(req.params.emailId) || 0
    });
});

app.listen(port, () => {
    console.log(`Tracker server running on port ${port}`);
});
