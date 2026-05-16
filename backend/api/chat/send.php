<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../db.php';

$pdo = getPDO();

try {

    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = $data['user_id'] ?? null;
    $channel = trim($data['channel'] ?? 'general');
    $message = trim($data['message'] ?? '');

    if (!$user_id || !$message) {

        echo json_encode([
            "success" => false,
            "message" => "user_id and message required"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO chat_messages (
            user_id,
            channel,
            message
        )
        VALUES (
            :user_id,
            :channel,
            :message
        )
        RETURNING id, created_at
    ");

    $stmt->execute([
        ':user_id' => $user_id,
        ':channel' => $channel,
        ':message' => $message
    ]);

    $created = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message_data" => [
            "id" => $created['id'],
            "user_id" => $user_id,
            "channel" => $channel,
            "message" => $message,
            "created_at" => $created['created_at']
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}