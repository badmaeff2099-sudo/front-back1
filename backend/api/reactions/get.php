<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../db.php';

$pdo = getPDO();

try {

    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {

        echo json_encode([
            "success" => false,
            "message" => "user_id required"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    $stmt = $pdo->prepare("
        SELECT
            r.id,
            r.emoji,
            r.created_at,
            u.username AS from_username
        FROM reactions r
        JOIN users u
            ON u.id = r.from_user_id
        WHERE r.to_user_id = :user_id
        ORDER BY r.created_at DESC
    ");

    $stmt->execute([
        ':user_id' => $user_id
    ]);

    $reactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "reactions" => $reactions
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}