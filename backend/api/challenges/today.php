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

// Часовой пояс пользователя (IANA, из браузера). Если не передан или
// некорректный — считаем по времени сервера.
$tz_name = $_GET['tz'] ?? '';

try {
    $zone = new DateTimeZone($tz_name);
} catch (Exception $e) {
    $zone = new DateTimeZone(date_default_timezone_get());
}

// «День челленджа» начинается в 12:00 по локальному времени пользователя:
// до 12:00 действует челлендж, начатый вчера в полдень, после 12:00 — новый.
$now = new DateTime('now', $zone);

if ((int)$now->format('G') < 12) {
    $now->modify('-1 day');
}

$challenge_date = $now->format('Y-m-d');

try {

    $userStmt = $pdo->prepare("SELECT id FROM users WHERE id = :user_id");

    $userStmt->execute([
        ':user_id' => $user_id
    ]);

    if (!$userStmt->fetchColumn()) {

        echo json_encode([
            "success" => false,
            "message" => "user not found"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // Детерминированный выбор: порядок задаёт хэш от даты и id челленджа.
    // Внутри одного дня порядок неизменен — пользователь всегда получает
    // один и тот же челлендж, при смене даты выборка меняется.
    $stmt = $pdo->prepare("
        SELECT
            id,
            title,
            description

        FROM challenges

        WHERE active = TRUE

        ORDER BY md5(:challenge_date || '-' || id::text)

        LIMIT 1
    ");

    $stmt->execute([
        ':challenge_date' => $challenge_date
    ]);

    $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$challenge) {

        echo json_encode([
            "success" => false,
            "message" => "no active challenges"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    echo json_encode([
        "success" => true,
        "id" => (int)$challenge['id'],
        "title" => $challenge['title'],
        "description" => $challenge['description'],
        "challenge_date" => $challenge_date
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
