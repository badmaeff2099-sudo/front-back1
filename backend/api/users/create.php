<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require '../../db.php';

$pdo = getPDO();

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$location = $data['location'] ?? '';
$goal = $data['goal'] ?? '';

if (!$username) {
    echo json_encode([
        'success' => false,
        'error' => 'Username required'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {

    $stmt = $pdo->prepare("
        INSERT INTO users (name, location, goal)
        VALUES (:username, :location, :goal)
        RETURNING id, name AS username, location, goal
    ");

    $stmt->execute([
        ':username' => $username,
        ':location' => $location,
        ':goal' => $goal
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'user' => $user
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}