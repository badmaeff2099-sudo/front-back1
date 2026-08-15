<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();
require_once '../../db.php';

$pdo = getPDO();
$data = json_decode(file_get_contents("php://input"), true);
$friendshipId = intval($data['friendship_id'] ?? 0);
$userId = intval($data['user_id'] ?? 0);

if (!$friendshipId || !$userId) {
    echo json_encode(["success" => false, "error" => "Invalid params"], JSON_UNESCAPED_UNICODE); exit;
}

try {
    // Only a participant of the friendship may remove it
    $stmt = $pdo->prepare(
        "DELETE FROM friendships WHERE id=:id AND (from_user_id=:uid OR to_user_id=:uid2)"
    );
    $stmt->execute([':id' => $friendshipId, ':uid' => $userId, ':uid2' => $userId]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(["success" => false, "error" => "Not found"], JSON_UNESCAPED_UNICODE); exit;
    }
    echo json_encode(["success" => true], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
