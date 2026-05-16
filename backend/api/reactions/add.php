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

    $from_user_id = $data['from_user_id'] ?? null;
    $to_user_id = $data['to_user_id'] ?? null;
    $emoji = trim($data['emoji'] ?? '');

    if (!$from_user_id || !$to_user_id || !$emoji) {

        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO reactions (
            from_user_id,
            to_user_id,
            emoji
        )
        VALUES (
            :from_user_id,
            :to_user_id,
            :emoji
        )
    ");

    $stmt->execute([
        ':from_user_id' => $from_user_id,
        ':to_user_id' => $to_user_id,
        ':emoji' => $emoji
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Reaction added"
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}