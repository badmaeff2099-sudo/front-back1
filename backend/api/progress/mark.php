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
$day_date = $data['day_date'] ?? null;

if (!$user_id || !$day_date) {

    echo json_encode([
        "success" => false,
        "error" => "user_id and day_date required"
    ]);

    exit;
}

try {

    $check = $pdo->prepare("
        SELECT id
        FROM progress
        WHERE user_id = :user_id
        AND day_date = :day_date
    ");

    $check->execute([
        ':user_id' => $user_id,
        ':day_date' => $day_date
    ]);

    if ($check->fetch()) {

        echo json_encode([
            "success" => false,
            "error" => "Already marked for this date"
        ]);

        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO progress (
            user_id,
            day_date,
            completed,
            status
        )

        VALUES (
            :user_id,
            :day_date,
            true,
            'done'
        )
    ");

    $stmt->execute([
        ':user_id' => $user_id,
        ':day_date' => $day_date
    ]);

    echo json_encode([
        "success" => true
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}