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

// Ensure avatar_url column exists
try { $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)"); } catch (PDOException $e) {}

$location = $_GET['location'] ?? '';

try {

    $sql = "
    SELECT
        u.id,
        u.username,
        u.location,
        u.goal,
        u.created_at,
        u.avatar_url,

        COALESCE(
            json_agg(p.day_date)
            FILTER (WHERE p.day_date IS NOT NULL),
            '[]'
        ) AS completed_dates

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

            $user['completed_dates'] =
                json_decode($user['completed_dates'], true);
        }
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