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
$year = $_GET['year'] ?? null;

if (!$user_id || !$year) {

    echo json_encode([
        "success" => false,
        "message" => "user_id и year обязательны"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$user_id = (int)$user_id;
$year = (int)$year;

// Год не выходит за пределы smallint и остаётся осмысленным.
if ($year < 2000 || $year > 2100) {

    echo json_encode([
        "success" => false,
        "message" => "year должен быть в диапазоне 2000..2100"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT
            g.month,
            g.goal,
            s.text AS subgoal,
            s.position

        FROM year_goals g

        -- LEFT JOIN: карточка с заполненной целью, но без подцелей,
        -- всё равно должна вернуться.
        LEFT JOIN year_goal_subgoals s
               ON s.goal_id = g.id

        WHERE g.user_id = :user_id
          AND g.year = :year

        ORDER BY g.month ASC, s.position ASC, s.id ASC
    ");

    $stmt->execute([
        ':user_id' => $user_id,
        ':year'    => $year,
    ]);

    // Возвращаем ровно 12 месяцев — фронтенд рисует сетку и для пустого года.
    $months = [];

    for ($m = 1; $m <= 12; $m++) {
        $months[$m] = [
            "month"    => $m,
            "goal"     => "",
            "subgoals" => [],
        ];
    }

    foreach ($stmt as $row) {

        $m = (int)$row['month'];

        // Месяц пришёл из БД с CHECK (1..12), но проверяем — иначе строка
        // с испорченным значением молча создала бы 13-й ключ в ответе.
        if ($m < 1 || $m > 12) {
            continue;
        }

        $months[$m]['goal'] = (string)$row['goal'];

        if ($row['subgoal'] !== null) {
            $months[$m]['subgoals'][] = (string)$row['subgoal'];
        }
    }

    // Текущий год берём с сервера, а не с клиента: иначе сбитые часы в
    // браузере показали бы редактируемую карточку, которую API отклонит.
    $current_year = (int)date('Y');

    // Нижняя граница переключателя: самый ранний год с данными, но не позже
    // текущего. LEAST обязателен — если пользователь заполнил только 2030-й,
    // без него кнопка "назад" заперла бы его в 2030 году.
    $min = $pdo->prepare("
        SELECT LEAST(COALESCE(MIN(year), :cy), :cy)
        FROM year_goals
        WHERE user_id = :user_id
    ");

    $min->execute([
        ':user_id' => $user_id,
        ':cy'      => $current_year,
    ]);

    $min_year = (int)$min->fetchColumn();

    echo json_encode([
        "success" => true,
        "year"    => $year,
        // array_values — чтобы в JSON был массив, а не объект с ключами "1".."12"
        "months"  => array_values($months),
        "current_year" => $current_year,
        "min_year"     => $min_year,
        // Вносить данные можно только в текущий год и дальше.
        "editable"     => $year >= $current_year,
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
