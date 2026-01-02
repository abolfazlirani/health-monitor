<?php
/**
 * Telegram Bot API Proxy
 * 
 * This proxy allows Iranian servers to send Telegram messages
 * by routing requests through a foreign host.
 * 
 * Installation:
 * 1. Upload this file to your foreign hosting
 * 2. Make sure PHP curl extension is enabled
 * 3. Set the URL of this file in your .env as TELEGRAM_PROXY_URL
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// Validate required fields
if (!isset($data['bot_token']) || !isset($data['method']) || !isset($data['params'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: bot_token, method, params']);
    exit();
}

$botToken = $data['bot_token'];
$method = $data['method'];
$params = $data['params'];

// Validate method (security measure)
$allowedMethods = ['sendMessage', 'sendPhoto', 'sendDocument'];
if (!in_array($method, $allowedMethods)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Build Telegram API URL
$telegramUrl = "https://api.telegram.org/bot{$botToken}/{$method}";

// Initialize cURL
$ch = curl_init($telegramUrl);

// Set cURL options
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

// Handle cURL errors
if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'cURL error: ' . $curlError
    ]);
    exit();
}

// Return Telegram API response
http_response_code($httpCode);
echo $response;

// Optional: Log requests (comment out in production)
// $logFile = __DIR__ . '/telegram_proxy.log';
// $logEntry = date('Y-m-d H:i:s') . " - Method: {$method} - Response: {$httpCode}\n";
// file_put_contents($logFile, $logEntry, FILE_APPEND);
?>
