<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();
require_once '../../db.php';

$pdo = getPDO();
$userId   = intval($_GET['user_id'] ?? 0);
$targetId = intval($_GET['target_id'] ?? 0);

if (!$userId || !$targetId) {
    echo json_encode(["success" => true, "status" => "none"], JSON_UNESCAPED_UNICODE); exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, from_user_id, to_user_id, status
        FROM friendships
        WHERE (from_user_id=:a AND to_user_id=:b) OR (from_user_id=:b AND to_user_id=:a)
    ");
    $stmt->execute([':a' => $userId, ':b' => $targetId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(["success" => true, "status" => "none"], JSON_UNESCAPED_UNICODE); exit;
    }

    $direction = $row['from_user_id'] == $userId ? 'sent' : 'received';
    echo json_encode([
        "success" => true,
        "status" => $row['status'],
        "direction" => $direction,
        "friendship_id" => $row['id'],
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
