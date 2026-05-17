<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../db.php';

$pdo = getPDO();

try {

    $stmt = $pdo->query("

        SELECT
            u.id,
            u.username,
            u.goal,
            u.created_at,
            u.avatar_url,

            COUNT(
                CASE
                    WHEN p.status = 'done'
                    THEN 1
                END
            ) AS total_days,

            COALESCE(
                json_agg(p.day_date)
                FILTER (
                    WHERE p.day_date IS NOT NULL
                ),
                '[]'
            ) AS completed_dates

        FROM users u

        LEFT JOIN progress p
            ON p.user_id = u.id

        GROUP BY
            u.id,
            u.username,
            u.goal,
            u.created_at,
            u.avatar_url

        ORDER BY total_days DESC

    ");

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as &$user) {

        $user['total_days'] =
            (int)$user['total_days'];

        if (is_string($user['completed_dates'])) {

            $user['completed_dates'] =
                json_decode(
                    $user['completed_dates'],
                    true
                );
        }

        /*
            Считаем пропущенные дни
        */

        $createdAt =
    new DateTime($user['created_at']);

$today =
    new DateTime();

$createdAt->setTime(0, 0, 0);
$today->setTime(0, 0, 0);

/*
    Только полностью прошедшие дни
*/

$daysSinceRegistration =
    $createdAt->diff($today)->days;

/*
    Пропущенные дни
*/

$missedDays =
    $daysSinceRegistration -
    $user['total_days'];

if ($missedDays < 0) {
    $missedDays = 0;
}

$user['missed_days'] =
    $missedDays;

        /*
            Серия подряд
        */

        $completedDates =
            $user['completed_dates'];

        rsort($completedDates);

        $streak = 0;

        $currentDate =
            new DateTime();

        while (true) {

            $dateStr =
                $currentDate
                    ->format('Y-m-d');

            if (
                in_array(
                    $dateStr,
                    $completedDates
                )
            ) {

                $streak++;

                $currentDate->modify('-1 day');

            } else {

                break;
            }
        }

        $user['streak'] =
            $streak;
    }

    echo json_encode([
        "success" => true,
        "users" => $users
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}