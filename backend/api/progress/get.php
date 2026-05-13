<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../db.php';

$pdo = getPDO();

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {

    echo json_encode([
        "success" => false,
        "message" => "user_id required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT
            day_date,
            status

        FROM progress

        WHERE user_id = :user_id

        ORDER BY day_date ASC
    ");

    $stmt->execute([
        ':user_id' => $user_id
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $completed_dates = array_map(
        fn($row) => $row['day_date'],
        $rows
    );

    echo json_encode([
        "success" => true,
        "completed_dates" => $completed_dates,
        "total" => count($completed_dates)
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}