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

    $channel = $_GET['channel'] ?? 'general';
    $limit = (int)($_GET['limit'] ?? 50);

    $stmt = $pdo->prepare("
        SELECT
            c.id,
            c.message,
            c.created_at,
            u.username
        FROM chat_messages c
        JOIN users u ON u.id = c.user_id
        WHERE c.channel = :channel
        ORDER BY c.created_at ASC
        LIMIT :limit
    ");

    $stmt->bindValue(':channel', $channel, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);

    $stmt->execute();

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "messages" => $messages
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}