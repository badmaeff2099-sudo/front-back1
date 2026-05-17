<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();
require_once '../../db.php';

$pdo = getPDO();
$data = json_decode(file_get_contents("php://input"), true);
$fromUserId = intval($data['from_user_id'] ?? 0);
$toUserId   = intval($data['to_user_id'] ?? 0);

if (!$fromUserId || !$toUserId || $fromUserId === $toUserId) {
    echo json_encode(["success" => false, "error" => "Invalid users"], JSON_UNESCAPED_UNICODE); exit;
}

try {
    // Create table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        from_user_id INT NOT NULL,
        to_user_id INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(from_user_id, to_user_id)
    )");

    // Check if already exists
    $check = $pdo->prepare("SELECT id, status FROM friendships WHERE (from_user_id=:a AND to_user_id=:b) OR (from_user_id=:b AND to_user_id=:a)");
    $check->execute([':a' => $fromUserId, ':b' => $toUserId]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        echo json_encode(["success" => false, "error" => "already_exists", "status" => $existing['status']], JSON_UNESCAPED_UNICODE); exit;
    }

    $stmt = $pdo->prepare("INSERT INTO friendships (from_user_id, to_user_id, status) VALUES (:from, :to, 'pending')");
    $stmt->execute([':from' => $fromUserId, ':to' => $toUserId]);

    echo json_encode(["success" => true], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
