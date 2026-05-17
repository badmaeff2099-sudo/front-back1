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
$action = $data['action'] ?? ''; // 'accept' or 'decline'

if (!$friendshipId || !in_array($action, ['accept', 'decline'])) {
    echo json_encode(["success" => false, "error" => "Invalid params"], JSON_UNESCAPED_UNICODE); exit;
}

try {
    if ($action === 'accept') {
        $stmt = $pdo->prepare("UPDATE friendships SET status='accepted' WHERE id=:id");
    } else {
        $stmt = $pdo->prepare("DELETE FROM friendships WHERE id=:id");
    }
    $stmt->execute([':id' => $friendshipId]);
    echo json_encode(["success" => true], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
