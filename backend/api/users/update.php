<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../../db.php';

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null;

if (!$user_id) {
    echo json_encode([
        "success" => false,
        "error" => "user_id required"
    ]);
    exit;
}

try {

    $stmt = $pdo->prepare("
        UPDATE users
        SET 
            name = COALESCE(:username, name),
            location = COALESCE(:location, location),
            goal = COALESCE(:goal, goal)
        WHERE id = :user_id
        RETURNING id, name AS username, location, goal
    ");

    $stmt->execute([
        ':user_id' => $user_id,
        ':username' => $data['username'] ?? null,
        ':location' => $data['location'] ?? null,
        ':goal' => $data['goal'] ?? null
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "user" => $user
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}