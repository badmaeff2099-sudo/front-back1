<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../db.php';

$pdo = getPDO();

$user_id = $_GET['user_id'] ?? null;
$year    = (int)($_GET['year'] ?? date('Y'));

if (!$user_id) {
    echo json_encode([
        "success" => false,
        "message" => "user_id required"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($year < 2000 || $year > (int)date('Y')) {
    $year = (int)date('Y');
}

try {
    // Отметки пользователя за выбранный год
    $stmt = $pdo->prepare("
        SELECT day_date, status
        FROM progress
        WHERE user_id = :user_id
          AND day_date >= :from
          AND day_date <= :to
        ORDER BY day_date ASC
    ");
    $stmt->execute([
        ':user_id' => $user_id,
        ':from'    => "$year-01-01",
        ':to'      => "$year-12-31",
    ]);

    $marks = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $marks[$row['day_date']] = $row['status'] === 'rest' ? 'rest' : 'done';
    }

    // Начало отсчёта: первая отметка пользователя либо дата регистрации.
    $startStmt = $pdo->prepare("
        SELECT
            (SELECT MIN(day_date) FROM progress WHERE user_id = :user_id) AS first_mark,
            (SELECT created_at   FROM users    WHERE id      = :user_id2) AS created_at
    ");
    $startStmt->execute([':user_id' => $user_id, ':user_id2' => $user_id]);
    $startRow = $startStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $candidates = [];
    if (!empty($startRow['first_mark'])) $candidates[] = substr($startRow['first_mark'], 0, 10);
    if (!empty($startRow['created_at'])) $candidates[] = substr($startRow['created_at'], 0, 10);
    $startDate = $candidates ? min($candidates) : date('Y-m-d');

    $today = date('Y-m-d');

    // Собираем полный год по дням
    $days   = [];
    $counts = ['done' => 0, 'rest' => 0, 'missed' => 0, 'empty' => 0];

    $cursor = new DateTime("$year-01-01");
    $end    = new DateTime("$year-12-31");

    while ($cursor <= $end) {
        $date = $cursor->format('Y-m-d');

        if (isset($marks[$date])) {
            $status = $marks[$date];                 // done | rest
        } elseif ($date > $today || $date < $startDate) {
            $status = 'empty';                       // будущее или до старта — серым
        } else {
            $status = 'missed';                      // пропущенный день — красным
        }

        $days[] = ['date' => $date, 'status' => $status];
        $counts[$status]++;

        $cursor->modify('+1 day');
    }

    echo json_encode([
        "success" => true,
        "year"    => $year,
        "start_date" => $startDate,
        "today"   => $today,
        "days"    => $days,
        "counts"  => $counts,
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
