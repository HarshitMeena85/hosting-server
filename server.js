const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Use .txt file for tracking data
const TRACKING_DATA_FILE = 'tracklog.txt';

function loadTrackingData() {
    try {
        if (fs.existsSync(TRACKING_DATA_FILE)) {
            const content = fs.readFileSync(TRACKING_DATA_FILE, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            const trackingData = {};
            
            lines.forEach(line => {
                try {
                    // Each line is a JSON object
                    const data = JSON.parse(line);
                    if (!trackingData[data.emailId]) {
                        trackingData[data.emailId] = {
                            id: data.emailId,
                            opens: [],
                            firstOpened: null,
                            totalOpens: 0
                        };
                    }
                    trackingData[data.emailId].opens.push({
                        timestamp: data.timestamp,
                        userAgent: data.userAgent,
                        ip: data.ip,
                        isGmailProxy: data.isGmailProxy
                    });
                    trackingData[data.emailId].totalOpens++;
                    if (!trackingData[data.emailId].firstOpened) {
                        trackingData[data.emailId].firstOpened = data.timestamp;
                    }
                } catch (e) {
                    // Skip invalid lines
                }
            });
            return trackingData;
        }
    } catch (error) {
        console.error('Error loading tracking data:', error);
    }
    return {};
}

function appendTrackingData(emailId, openRecord) {
    try {
        const logEntry = {
            emailId: emailId,
            timestamp: openRecord.timestamp,
            userAgent: openRecord.userAgent,
            ip: openRecord.ip,
            isGmailProxy: openRecord.isGmailProxy
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(TRACKING_DATA_FILE, logLine);
    } catch (error) {
        console.error('Error saving tracking data:', error);
    }
}

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Main tracking endpoint
app.get('/track/:emailId/:timestamp?/:random?', (req, res) => {
    const emailId = req.params.emailId;
    const timestamp = req.params.timestamp || Date.now();
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer') || req.get('Referrer') || '';
    const realIp = req.get('X-Forwarded-For') ? req.get('X-Forwarded-For').split(',')[0] : req.ip;
    
    // Create open record
    const openRecord = {
        timestamp: new Date().toISOString(),
        userAgent: userAgent,
        referrer: referrer,
        ip: realIp,
        isGmailProxy: userAgent.includes('GoogleImageProxy') || userAgent.includes('Google')
    };
    
    // Append to .txt file
    appendTrackingData(emailId, openRecord);
    
    console.log(`📧 Email opened: ${emailId} at ${openRecord.timestamp}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Is Gmail Proxy: ${openRecord.isGmailProxy}`);
    console.log('---');
    
    // Return tracking pixel
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

// API endpoint to check email status
app.get('/api/email/:emailId/status', (req, res) => {
    const emailId = req.params.emailId;
    const trackingData = loadTrackingData();
    
    if (trackingData[emailId]) {
        res.json({
            success: true,
            emailId: emailId,
            opened: trackingData[emailId].totalOpens > 0,
            openCount: trackingData[emailId].totalOpens,
            firstOpened: trackingData[emailId].firstOpened,
            lastOpened: trackingData[emailId].opens.length > 0 ? 
                       trackingData[emailId].opens[trackingData[emailId].opens.length - 1].timestamp : null
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
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: port 
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Email tracker server running on port ${port}`);
    console.log(`📍 Tracking endpoint: /track/:emailId/:timestamp/:random`);
    console.log(`📍 Status API: /api/email/:emailId/status`);
    console.log(`📁 Tracking data file: ${TRACKING_DATA_FILE}`);
});
