<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../../db.php';

$pdo = getPDO();

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {

    echo json_encode([
        "success" => false,
        "error" => "Email и пароль обязательны"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT
            u.id,
            u.username,
            u.nickname,
            u.email,
            u.password,
            u.location,
            u.goal,
            u.bio,
            u.daily_actions,
            u.avatar_url,
            u.created_at,
            COALESCE(
                json_agg(p.day_date) FILTER (WHERE p.day_date IS NOT NULL),
                '[]'
            ) AS completed_dates
        FROM users u
        LEFT JOIN progress p ON p.user_id = u.id
        WHERE u.email = :email
        GROUP BY u.id
        LIMIT 1
    ");

    $stmt->execute([
        ':email' => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {

        echo json_encode([
            "success" => false,
            "error" => "Пользователь не найден"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if (!password_verify($password, $user['password'])) {

        echo json_encode([
            "success" => false,
            "error" => "Неверный пароль"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    unset($user['password']);

    if (is_string($user['completed_dates'])) {
        $user['completed_dates'] = json_decode($user['completed_dates'], true);
    }

    echo json_encode([
        "success" => true,
        "user" => $user
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}