<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../db.php';
require_once 'streak_helper.php';

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
                    WHERE p.status = 'done'
                ),
                '[]'
            ) AS completed_dates,

            COALESCE(
                json_agg(p.day_date)
                FILTER (
                    WHERE p.status = 'rest'
                ),
                '[]'
            ) AS rest_dates

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
            $user['completed_dates'] = json_decode($user['completed_dates'], true);
        }
        if (is_string($user['rest_dates'])) {
            $user['rest_dates'] = json_decode($user['rest_dates'], true);
        }
        $user['completed_dates'] = $user['completed_dates'] ?? [];
        $user['rest_dates'] = $user['rest_dates'] ?? [];

        // Считаем пропущенные дни (только done-дни, rest не считаем пропуском)
        $createdAt = new DateTime($user['created_at']);
        $today = new DateTime();
        $createdAt->setTime(0, 0, 0);
        $today->setTime(0, 0, 0);

        $daysSinceRegistration = $createdAt->diff($today)->days;
        $markedDays = count($user['completed_dates']) + count($user['rest_dates']);
        $missedDays = max(0, $daysSinceRegistration - $markedDays);
        $user['missed_days'] = $missedDays;

        $user['streak'] = calcStreak($user['completed_dates'], $user['rest_dates']);
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