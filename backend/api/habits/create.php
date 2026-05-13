<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../../db.php';

$pdo = getPDO();

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null;
$title = trim($data['title'] ?? '');
$total_days = $data['total_days'] ?? 30;

if (!$user_id || !$title) {

    echo json_encode([
        "success" => false,
        "message" => "Заполните все поля"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        INSERT INTO habits (
            user_id,
            title,
            total_days
        )

        VALUES (
            :user_id,
            :title,
            :total_days
        )

        RETURNING
            id,
            user_id,
            title,
            total_days,
            created_at
    ");

    $stmt->execute([
        ':user_id' => $user_id,
        ':title' => $title,
        ':total_days' => $total_days
    ]);

    $habit = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "habit" => $habit
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}