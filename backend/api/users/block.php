<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../../db.php';

$pdo = getPDO();

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["success" => false, "error" => "user_id required"]);
    exit;
}

try {
    // Add is_blocked column if it doesn't exist
    try { $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE"); } catch (PDOException $e) {}

    $stmt = $pdo->prepare("UPDATE users SET is_blocked = TRUE WHERE id = :user_id");
    $stmt->execute([':user_id' => $user_id]);

    echo json_encode(["success" => true], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
