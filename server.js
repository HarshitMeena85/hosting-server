const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enhanced logging for debugging
const TRACKING_LOG_FILE = 'tracklog.txt';

function logDetailedRequest(req, emailId) {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || '';
    const referrer = req.get('Referer') || req.get('Referrer') || '';
    const xForwardedFor = req.get('X-Forwarded-For');
    const realIp = xForwardedFor ? xForwardedFor.split(',')[0] : req.ip;
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    // Detect Gmail proxy
    const isGmailProxy = userAgent.includes('GoogleImageProxy') || 
                        userAgent.includes('Google') ||
                        referrer.includes('googleusercontent.com');
    
    // Detect other email clients
    const isOutlookProxy = userAgent.includes('Microsoft') || referrer.includes('outlook');
    const isAppleProxy = userAgent.includes('Apple') || userAgent.includes('Mail');
    
    const logData = {
        timestamp,
        emailId,
        ip: realIp,
        userAgent,
        referrer,
        acceptLanguage,
        acceptEncoding,
        isGmailProxy,
        isOutlookProxy,
        isAppleProxy,
        headers: JSON.stringify(req.headers)
    };
    
    // Log to file
    const logLine = JSON.stringify(logData) + '\n';
    fs.appendFileSync(TRACKING_LOG_FILE, logLine);
    
    // Enhanced console logging
    console.log('═══════════════════════════════════════');
    console.log(`📧 EMAIL TRACKING EVENT`);
    console.log(`Email ID: ${emailId}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`IP Address: ${realIp}`);
    console.log(`User-Agent: ${userAgent}`);
    console.log(`Referrer: ${referrer}`);
    console.log(`Gmail Proxy: ${isGmailProxy ? 'YES' : 'NO'}`);
    console.log(`Outlook Proxy: ${isOutlookProxy ? 'YES' : 'NO'}`);
    console.log(`Apple Proxy: ${isAppleProxy ? 'YES' : 'NO'}`);
    console.log(`Accept-Language: ${acceptLanguage}`);
    console.log('═══════════════════════════════════════');
    
    return logData;
}

app.use(express.json());
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Enhanced tracking endpoint with multiple path formats
app.get('/track/:emailId/:timestamp?/:random?', (req, res) => {
    const emailId = req.params.emailId;
    
    // Log all request details
    const logData = logDetailedRequest(req, emailId);
    
    // Create tracking pixel with anti-cache headers
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
    );
    
    res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${emailId}-${Date.now()}"`,
        'Access-Control-Allow-Origin': '*'
    });
    
    res.send(pixel);
});

// Legacy endpoint
app.get('/track/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    logDetailedRequest(req, emailId);
    
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

// Debug endpoint to view tracking logs
app.get('/debug/logs/:emailId?', (req, res) => {
    const emailId = req.params.emailId;
    
    try {
        if (fs.existsSync(TRACKING_LOG_FILE)) {
            const content = fs.readFileSync(TRACKING_LOG_FILE, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            let logs = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            }).filter(log => log !== null);
            
            // Filter by emailId if provided
            if (emailId) {
                logs = logs.filter(log => log.emailId === emailId);
            }
            
            res.json({
                success: true,
                count: logs.length,
                logs: logs.slice(-50) // Last 50 entries
            });
        } else {
            res.json({
                success: true,
                count: 0,
                logs: [],
                message: 'No tracking log file found'
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
    console.log(`🚀 Enhanced Email Tracker Server running on port ${port}`);
    console.log(`📍 Tracking endpoint: /track/:emailId`);
    console.log(`📍 Debug endpoint: /debug/logs/:emailId`);
    console.log(`📁 Log file: ${TRACKING_LOG_FILE}`);
});
