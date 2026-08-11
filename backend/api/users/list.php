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
require_once '../discipline_helper.php';

$pdo = getPDO();

// Ensure avatar_url and nickname columns exist
try { $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50)"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_nickname_unique UNIQUE (nickname)"); } catch (PDOException $e) {}

$location = $_GET['location'] ?? '';

try {

    $sql = "
    SELECT
        u.id,
        u.username,
        u.nickname,
        u.location,
        u.goal,
        u.created_at,
        u.avatar_url,

        COALESCE(
            json_agg(p.day_date ORDER BY p.day_date)
            FILTER (WHERE p.day_date IS NOT NULL AND p.status != 'rest'),
            '[]'
        ) AS completed_dates,

        COALESCE(
            json_agg(p.day_date ORDER BY p.day_date)
            FILTER (WHERE p.day_date IS NOT NULL AND p.status = 'rest'),
            '[]'
        ) AS rest_dates

    FROM users u

    LEFT JOIN progress p
        ON p.user_id = u.id
    ";

    if ($location) {
        $sql .= " WHERE u.location = :location";
    }

    $sql .= "
    GROUP BY u.id
    ORDER BY u.id
    ";

    $stmt = $pdo->prepare($sql);

    if ($location) {

        $stmt->execute([
            ':location' => $location
        ]);

    } else {

        $stmt->execute();
    }

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as &$user) {
        if (is_string($user['completed_dates'])) {
            $user['completed_dates'] = json_decode($user['completed_dates'], true);
        }
        if (is_string($user['rest_dates'])) {
            $user['rest_dates'] = json_decode($user['rest_dates'], true);
        }
        $user['completed_dates'] = $user['completed_dates'] ?? [];
        $user['rest_dates'] = $user['rest_dates'] ?? [];

        $discipline = calcDisciplineScore(
            $user['completed_dates'],
            $user['rest_dates'],
            $user['created_at']
        );

        $user['discipline_score'] = $discipline['score'];
    }

    echo json_encode([
        "success" => true,
        "users" => $users
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}