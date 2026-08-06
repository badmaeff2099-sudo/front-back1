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
$today = $data['today'] ?? null;
$tomorrow = $data['tomorrow'] ?? null;

if (!$user_id || !is_array($today) || !is_array($tomorrow)) {

    echo json_encode([
        "success" => false,
        "message" => "user_id, today и tomorrow обязательны"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $pdo->beginTransaction();

    // Гарантируем наличие мета-записи.
    $pdo->prepare("
        INSERT INTO planner (user_id, last_date)
        VALUES (:user_id, CURRENT_DATE)
        ON CONFLICT (user_id) DO NOTHING
    ")->execute([':user_id' => $user_id]);

    // Полностью заменяем оба списка пользователя.
    $pdo->prepare("DELETE FROM planner_items WHERE user_id = :user_id")
        ->execute([':user_id' => $user_id]);

    $ins = $pdo->prepare("
        INSERT INTO planner_items (user_id, day_type, position, text)
        VALUES (:user_id, :day_type, :position, :text)
    ");

    foreach (['today' => $today, 'tomorrow' => $tomorrow] as $day_type => $items) {
        foreach ($items as $i => $item) {
            $ins->execute([
                ':user_id'  => $user_id,
                ':day_type' => $day_type,
                ':position' => $i,
                ':text'     => (string)($item['text'] ?? ''),
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        "success" => true
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
