<?php  
// Security headers  
header("Content-Security-Policy: default-src 'none'");  
header("X-Content-Type-Options: nosniff");  

// Extract email ID from URL path  
$path = $_SERVER['REQUEST_URI'];  
preg_match('/\/track\/([a-zA-Z0-9_-]{20})/', $path, $matches);  
$emailId = $matches[1] ?? null;  

if ($emailId && preg_match('/^et_[a-f0-9]{17}$/i', $emailId)) {  
    // Log to SQLite database  
    $db = new SQLite3('tracking.db');  
    $db->exec("CREATE TABLE IF NOT EXISTS opens (  
        id INTEGER PRIMARY KEY,  
        email_id TEXT NOT NULL,  
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,  
        ip TEXT,  
        user_agent TEXT  
    )");  

    $stmt = $db->prepare("INSERT INTO opens (email_id, ip, user_agent)  
        VALUES (:email_id, :ip, :user_agent)");  
    $stmt->bindValue(':email_id', $emailId);  
    $stmt->bindValue(':ip', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR']);  
    $stmt->bindValue(':user_agent', $_SERVER['HTTP_USER_AGENT'] ?? '');  
    $stmt->execute();  
}  

// Serve 1x1 transparent GIF  
header("Content-Type: image/gif");  
header("Cache-Control: no-store, max-age=0");  
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');  
