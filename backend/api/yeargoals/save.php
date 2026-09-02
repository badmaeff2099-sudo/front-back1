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

$user_id  = $data['user_id'] ?? null;
$year     = $data['year'] ?? null;
$month    = $data['month'] ?? null;
$goal     = $data['goal'] ?? '';
$subgoals = $data['subgoals'] ?? [];

// Сохраняется одна карточка месяца, а не год целиком: правки в разных
// месяцах не перетирают друг друга, и запрос остаётся маленьким.
if (!$user_id || !$year || !$month || !is_array($subgoals)) {

    echo json_encode([
        "success" => false,
        "message" => "user_id, year, month и subgoals обязательны"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$user_id = (int)$user_id;
$year    = (int)$year;
$month   = (int)$month;

if ($year < 2000 || $year > 2100) {

    echo json_encode([
        "success" => false,
        "message" => "year должен быть в диапазоне 2000..2100"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($month < 1 || $month > 12) {

    echo json_encode([
        "success" => false,
        "message" => "month должен быть в диапазоне 1..12"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Прошлые годы только для просмотра — цели ставят вперёд, а не назад.
// Проверка именно здесь, а не только в интерфейсе: иначе оставленная
// открытой вкладка или прямой запрос к API всё равно записали бы прошлое.
$current_year = (int)date('Y');

if ($year < $current_year) {

    echo json_encode([
        "success" => false,
        "message" => "Прошлые годы доступны только для просмотра. Вносить данные можно с $current_year года."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$goal = trim((string)$goal);

// Порядок подцелей — это позиция в массиве, поэтому переиндексируем:
// array_filter сохраняет исходные ключи и оставил бы дырки в position.
$texts = array_values(array_map(
    fn ($s) => trim((string)(is_array($s) ? ($s['text'] ?? '') : $s)),
    $subgoals
));

// Хвостовые пустые строки не храним — это просто незаполненные линейки
// в карточке. Внутренние пустые оставляем: они держат нумерацию.
while (count($texts) > 0 && $texts[count($texts) - 1] === '') {
    array_pop($texts);
}

// Карточка целиком пустая — удаляем строку вместо хранения пустышки
// (подцели уйдут сами по ON DELETE CASCADE).
$isEmpty = $goal === '' && count($texts) === 0;

try {

    $pdo->beginTransaction();

    if ($isEmpty) {

        $del = $pdo->prepare("
            DELETE FROM year_goals
            WHERE user_id = :user_id
              AND year = :year
              AND month = :month
        ");

        $del->execute([
            ':user_id' => $user_id,
            ':year'    => $year,
            ':month'   => $month,
        ]);

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "cleared" => true,
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // ON CONFLICT по UNIQUE (user_id, year, month): при быстрых правках одной
    // карточки два запроса не создадут дубль. RETURNING id работает и при
    // вставке, и при обновлении — отдельный SELECT не нужен.
    $up = $pdo->prepare("
        INSERT INTO year_goals (
            user_id,
            year,
            month,
            goal
        )
        VALUES (
            :user_id,
            :year,
            :month,
            :goal
        )
        ON CONFLICT (user_id, year, month)
        DO UPDATE SET
            goal = EXCLUDED.goal,
            updated_at = CURRENT_TIMESTAMP

        RETURNING id
    ");

    $up->execute([
        ':user_id' => $user_id,
        ':year'    => $year,
        ':month'   => $month,
        ':goal'    => $goal,
    ]);

    $goal_id = (int)$up->fetchColumn();

    // Подцели переписываем целиком: так порядок и удаление строк
    // выражаются одним и тем же запросом.
    $delSub = $pdo->prepare("DELETE FROM year_goal_subgoals WHERE goal_id = :goal_id");
    $delSub->execute([':goal_id' => $goal_id]);

    $insSub = $pdo->prepare("
        INSERT INTO year_goal_subgoals (
            goal_id,
            position,
            text
        )
        VALUES (
            :goal_id,
            :position,
            :text
        )
    ");

    foreach ($texts as $i => $text) {

        $insSub->execute([
            ':goal_id'  => $goal_id,
            ':position' => $i,
            ':text'     => $text,
        ]);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
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
