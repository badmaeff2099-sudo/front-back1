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

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {

    echo json_encode([
        "success" => false,
        "message" => "user_id required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Вернуть строки одного списка пользователя.
function fetchItems($pdo, $user_id, $day_type)
{
    $stmt = $pdo->prepare("
        SELECT id, text
        FROM planner_items
        WHERE user_id = :user_id AND day_type = :day_type
        ORDER BY position ASC, id ASC
    ");

    $stmt->execute([
        ':user_id'  => $user_id,
        ':day_type' => $day_type,
    ]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

try {

    $pdo->beginTransaction();

    // Мета-запись пользователя.
    $stmt = $pdo->prepare("SELECT last_date FROM planner WHERE user_id = :user_id");
    $stmt->execute([':user_id' => $user_id]);
    $meta = $stmt->fetch(PDO::FETCH_ASSOC);

    $today = date('Y-m-d');

    if (!$meta) {

        // Первый вход — создаём мету и 5 пустых строк "сегодня".
        $pdo->prepare("INSERT INTO planner (user_id, last_date) VALUES (:user_id, :d)")
            ->execute([':user_id' => $user_id, ':d' => $today]);

        $ins = $pdo->prepare("
            INSERT INTO planner_items (user_id, day_type, position, text)
            VALUES (:user_id, 'today', :position, '')
        ");
        for ($i = 0; $i < 5; $i++) {
            $ins->execute([':user_id' => $user_id, ':position' => $i]);
        }

    } elseif ($meta['last_date'] < $today) {

        // Новый день — ротация: "завтра" -> "сегодня", "завтра" очищается.
        $pdo->prepare("DELETE FROM planner_items WHERE user_id = :user_id AND day_type = 'today'")
            ->execute([':user_id' => $user_id]);

        $pdo->prepare("
            UPDATE planner_items SET day_type = 'today'
            WHERE user_id = :user_id AND day_type = 'tomorrow'
        ")->execute([':user_id' => $user_id]);

        // Если после ротации "сегодня" пусто — добавляем 5 пустых строк.
        $cnt = $pdo->prepare("SELECT COUNT(*) FROM planner_items WHERE user_id = :user_id AND day_type = 'today'");
        $cnt->execute([':user_id' => $user_id]);
        if ((int)$cnt->fetchColumn() === 0) {
            $ins = $pdo->prepare("
                INSERT INTO planner_items (user_id, day_type, position, text)
                VALUES (:user_id, 'today', :position, '')
            ");
            for ($i = 0; $i < 5; $i++) {
                $ins->execute([':user_id' => $user_id, ':position' => $i]);
            }
        }

        $pdo->prepare("UPDATE planner SET last_date = :d WHERE user_id = :user_id")
            ->execute([':d' => $today, ':user_id' => $user_id]);
    }

    $result = [
        "success"  => true,
        "lastDate" => $today,
        "today"    => fetchItems($pdo, $user_id, 'today'),
        "tomorrow" => fetchItems($pdo, $user_id, 'tomorrow'),
    ];

    $pdo->commit();

    echo json_encode($result, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
