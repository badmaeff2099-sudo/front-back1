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

            COUNT(
                CASE
                    WHEN p.status = 'done'
                    THEN 1
                END
            ) AS total_days,

            COUNT(
                CASE
                    WHEN p.status = 'missed'
                    THEN 1
                END
            ) AS missed_days

        FROM users u

        LEFT JOIN progress p
            ON p.user_id = u.id

        GROUP BY u.id, u.username, u.goal

        ORDER BY total_days DESC
    ");

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as &$user) {

        $user['total_days'] = (int)$user['total_days'];
        $user['missed_days'] = (int)$user['missed_days'];

        // временно streak = total_days
        $user['streak'] = $user['total_days'];
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