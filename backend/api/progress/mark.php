<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../db.php';

$pdo = getPDO();

try {

    $data = json_decode(file_get_contents("php://input"), true);

    $user_id = $data['user_id'] ?? null;
    $day_date = $data['day_date'] ?? null;
    $status = $data['status'] ?? 'done';

    if (!$user_id || !$day_date) {
        echo json_encode([
            "success" => false,
            "message" => "user_id and day_date required"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!in_array($status, ['done', 'rest'])) {
        echo json_encode([
            "success" => false,
            "error" => "Invalid status"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Проверяем, не отмечен ли уже этот день
    $check = $pdo->prepare("
        SELECT id FROM progress
        WHERE user_id = :user_id AND day_date = :day_date
    ");
    $check->execute([':user_id' => $user_id, ':day_date' => $day_date]);

    if ($check->fetch()) {
        echo json_encode([
            "success" => false,
            "error" => "Already marked for this date"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Если отмечаем выходной — проверяем, не был ли предыдущий день тоже выходным
    if ($status === 'rest') {
        $prevDate = date('Y-m-d', strtotime($day_date . ' -1 day'));
        $prevCheck = $pdo->prepare("
            SELECT status FROM progress
            WHERE user_id = :user_id AND day_date = :day_date
        ");
        $prevCheck->execute([':user_id' => $user_id, ':day_date' => $prevDate]);
        $prevRow = $prevCheck->fetch(PDO::FETCH_ASSOC);

        if ($prevRow && $prevRow['status'] === 'rest') {
            echo json_encode([
                "success" => false,
                "error" => "Two rest days in a row break the streak"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $stmt = $pdo->prepare("
        INSERT INTO progress (user_id, day_date, status)
        VALUES (:user_id, :day_date, :status)
    ");
    $stmt->execute([
        ':user_id' => $user_id,
        ':day_date' => $day_date,
        ':status' => $status
    ]);

    echo json_encode([
        "success" => true
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}