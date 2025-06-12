const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const TRACKING_LOG_FILE = 'tracklog.txt';

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Enhanced tracking endpoint
app.get('/track/:emailId/:timestamp?/:random?', (req, res) => {
    const emailId = req.params.emailId;
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer') || req.get('Referrer') || '';
    const realIp = req.get('X-Forwarded-For') ? req.get('X-Forwarded-For').split(',')[0] : req.ip;
    
    // Detailed logging
    console.log('════════════════════════════════════════');
    console.log(`📧 EMAIL TRACKING EVENT`);
    console.log(`Email ID: ${emailId}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`IP: ${realIp}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Referrer: ${referrer}`);
    console.log(`Gmail Proxy: ${userAgent.includes('GoogleImageProxy') || userAgent.includes('Google')}`);
    console.log('════════════════════════════════════════');
    
    // Log to file
    const logEntry = {
        emailId,
        timestamp,
        ip: realIp,
        userAgent,
        referrer,
        isGmailProxy: userAgent.includes('GoogleImageProxy') || userAgent.includes('Google')
    };
    
    const isGmailClient = userAgent.includes('Gmail') || userAgent.includes('GoogleImageProxy') || userAgent.includes('Mozilla') && referrer.includes('mail.google.com');

if (!isGmailClient) {
    fs.appendFileSync(TRACKING_LOG_FILE, JSON.stringify(logEntry) + '\n');
}

    
    // Return tracking pixel
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );
    
    res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    res.send(pixel);
});

// API to check tracking status
app.get('/api/email/:emailId/status', (req, res) => {
    const emailId = req.params.emailId;
    
    try {
        if (fs.existsSync(TRACKING_LOG_FILE)) {
            const content = fs.readFileSync(TRACKING_LOG_FILE, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const emailLogs = lines
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(log => log && log.emailId === emailId);
            
            if (emailLogs.length > 0) {
                res.json({
                    success: true,
                    emailId: emailId,
                    opened: true,
                    openCount: emailLogs.length,
                    firstOpened: emailLogs[0].timestamp,
                    lastOpened: emailLogs[emailLogs.length - 1].timestamp
                });
            } else {
                res.json({
                    success: true,
                    emailId: emailId,
                    opened: false,
                    openCount: 0,
                    firstOpened: null,
                    lastOpened: null
                });
            }
        } else {
            res.json({
                success: true,
                emailId: emailId,
                opened: false,
                openCount: 0,
                firstOpened: null,
                lastOpened: null
            });
        }
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Email tracker server running on port ${port}`);
    console.log(`📍 Tracking: /track/:emailId/:timestamp/:random`);
    console.log(`📍 Status API: /api/email/:emailId/status`);
});
